import { Redis } from "@upstash/redis";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  ok: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  headers: Record<string, string>;
};

type RateLimitOptions = {
  request: Request;
  key: string;
  limit: number;
  windowMs: number;
};

const MAX_ENTRIES = 10_000;
const DEFAULT_PREFIX = "ratelimit";

let redisClient: Redis | null | undefined;

function getRedis() {
  if (redisClient !== undefined) return redisClient;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    redisClient = null;
    return redisClient;
  }
  redisClient = new Redis({ url, token });
  return redisClient;
}

function getStore() {
  const globalStore = globalThis as typeof globalThis & {
    __rateLimitStore?: Map<string, RateLimitEntry>;
  };
  if (!globalStore.__rateLimitStore) {
    globalStore.__rateLimitStore = new Map();
  }
  return globalStore.__rateLimitStore;
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    "unknown"
  );
}

function buildResult(limit: number, count: number, resetAt: number, now = Date.now()): RateLimitResult {
  const remaining = Math.max(0, limit - count);
  const ok = count <= limit;
  const resetSeconds = Math.ceil(resetAt / 1000);

  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(ok ? remaining : 0),
    "X-RateLimit-Reset": String(resetSeconds),
  };

  if (!ok) {
    headers["Retry-After"] = String(Math.max(1, Math.ceil((resetAt - now) / 1000)));
  }

  return {
    ok,
    limit,
    remaining,
    resetAt,
    headers,
  };
}

async function rateLimitRedis(
  redis: Redis,
  bucketKey: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const now = Date.now();
  const pipeline = redis.pipeline();
  pipeline.incr(bucketKey);
  pipeline.pttl(bucketKey);
  const [countRaw, ttlRaw] = await pipeline.exec();

  const count = Number(countRaw ?? 0);
  let ttl = Number(ttlRaw ?? -1);

  if (count === 1 || ttl < 0) {
    await redis.pexpire(bucketKey, windowMs);
    ttl = windowMs;
  }

  const resetAt = now + ttl;
  return buildResult(limit, count, resetAt, now);
}

function rateLimitMemory(
  bucketKey: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const store = getStore();
  const now = Date.now();

  let entry = store.get(bucketKey);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
  }

  entry.count += 1;
  store.set(bucketKey, entry);

  if (store.size > MAX_ENTRIES) {
    for (const [storedKey, storedEntry] of store.entries()) {
      if (storedEntry.resetAt < now) {
        store.delete(storedKey);
      }
    }
  }

  return buildResult(limit, entry.count, entry.resetAt, now);
}

export async function rateLimit({
  request,
  key,
  limit,
  windowMs,
}: RateLimitOptions): Promise<RateLimitResult> {
  const ip = getClientIp(request);
  const prefix = process.env.RATE_LIMIT_REDIS_PREFIX ?? DEFAULT_PREFIX;
  const bucketKey = `${prefix}:${key}:${ip}`;
  const redis = getRedis();

  if (redis) {
    try {
      return await rateLimitRedis(redis, bucketKey, limit, windowMs);
    } catch (error) {
      console.warn("Redis rate limit fallback to memory:", error);
      return rateLimitMemory(bucketKey, limit, windowMs);
    }
  }

  return rateLimitMemory(bucketKey, limit, windowMs);
}
