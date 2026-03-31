import { NextResponse } from "next/server";
import { handleServiceError } from "@/lib/service-error";
import { getAuthUser } from "@/lib/auth";
import { createTransaction, getTransactionsByFilter } from "@/app/api/transactions/service/transaction.service";
import { CreateTransactionSchema } from "@/lib/validators";

function parseList(value: string | null) {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseNumber(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function GET(request: Request) {
  try {
    const { user, supabase } = await getAuthUser();
    const { searchParams } = new URL(request.url);
    const limitParam = parseNumber(searchParams.get("limit"), 100);
    const limit = Math.min(Math.max(limitParam, 1), 200);
    const offset = Math.max(parseNumber(searchParams.get("offset"), 0), 0);

    const walletIds = parseList(searchParams.get("walletIds"));
    const categoryIds = parseList(searchParams.get("categoryIds"));
    const walletId = searchParams.get("walletId") || undefined;
    const categoryId = searchParams.get("categoryId") || undefined;
    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;
    const typeParam = searchParams.get("type");
    const type = typeParam === "income" || typeParam === "expense" ? typeParam : undefined;

    const items = await getTransactionsByFilter(supabase, user.id, {
      walletIds: walletIds.length ? walletIds : undefined,
      categoryIds: categoryIds.length ? categoryIds : undefined,
      walletId,
      categoryId,
      dateFrom,
      dateTo,
      type,
      limit: limit + 1,
      offset,
    });

    const hasMore = items.length > limit;
    const sliced = hasMore ? items.slice(0, limit) : items;
    const nextOffset = hasMore ? offset + limit : null;

    return NextResponse.json({
      items: sliced,
      hasMore,
      nextOffset,
    });
  } catch (error) {
    const { body, status } = handleServiceError(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: Request) {
  try {
    const { user, supabase } = await getAuthUser();
    const raw = await request.json();
    const dto = CreateTransactionSchema.parse(raw);
    const transaction = await createTransaction(supabase, user.id, dto);
    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: (error as import("zod").ZodError).issues.map(i => i.message).join(", ") }, { status: 400 });
    }
    const { body, status } = handleServiceError(error);
    return NextResponse.json(body, { status });
  }
}
