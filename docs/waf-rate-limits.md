# WAF/CDN Rate Limit Playbook (Cloudflare example)

Use these rules when **not** using Upstash. Apply to production and preview.

## This project (Budgetin)
Server-side rate limiting in this repo uses Upstash when `UPSTASH_REDIS_REST_URL` and
`UPSTASH_REDIS_REST_TOKEN` are set. If those env vars are missing, the app assumes
rate limiting is enforced by your CDN/WAF layer (see `src/lib/rate-limit.ts`).

To apply the Cloudflare rules programmatically, use:

```bash
node scripts/cloudflare/apply-rate-limits.mjs --dry-run
node scripts/cloudflare/apply-rate-limits.mjs --apply
```

Required env vars:
- `CLOUDFLARE_ZONE_ID`
- `CLOUDFLARE_API_TOKEN`

Note: Cloudflare rules only apply to hostnames that are actually proxied by Cloudflare (typically your custom domain).
Default Vercel preview URLs (`*.vercel.app`) won't go through your Cloudflare zone unless you set up a preview domain
under your zone.

## Target endpoints
- /api/auth/login
- /api/auth/register
- /api/auth/password-reset
- /api/auth/resend
- /api/auth/mfa
- /api/auth/email-update
- /api/auth/password-update
- /api/auth/metadata-update
- /api/auth/anonymous
- /api/auth/link
- /api/auth/unlink

## Baseline limits (per IP)
- Login: 5 requests / 60s, block 10m
- Register: 3 requests / 60s, block 30m
- Password reset/resend: 3 requests / 60s, block 30m
- MFA verify: 6 requests / 5m, block 15m

## Project defaults for other auth endpoints (per IP)
These match the in-app `rateLimit(...)` configuration (when Upstash is enabled), with a reasonable WAF block timeout.
- Email update: 3 requests / 60s, block 30m
- Password update: 3 requests / 60s, block 30m
- Anonymous sign-in: 10 requests / 60s, block 10m (or use managed challenge)
- Link/unlink identity: 5 requests / 60s, block 10m
- Metadata update: 5 requests / 60s, block 10m

## Cloudflare API snippets
Replace placeholders: `CF_ZONE_ID`, `CF_API_TOKEN`.

### Login rule (block)
```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/CF_ZONE_ID/rate_limits" \
  -H "Authorization: Bearer CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "threshold": 5,
    "period": 60,
    "action": { "mode": "block", "timeout": 600 },
    "match": {
      "request": { "methods": ["POST"], "schemes": ["https"], "url": "*/api/auth/login*" },
      "headers": [{ "name": "cf-connecting-ip", "op": "present" }]
    },
    "description": "Auth login rate limit"
  }'
```

### Register rule (block)
```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/CF_ZONE_ID/rate_limits" \
  -H "Authorization: Bearer CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "threshold": 3,
    "period": 60,
    "action": { "mode": "block", "timeout": 1800 },
    "match": { "request": { "methods": ["POST"], "schemes": ["https"], "url": "*/api/auth/register*" } },
    "description": "Auth register rate limit"
  }'
```

### Password reset/resend rule
```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/CF_ZONE_ID/rate_limits" \
  -H "Authorization: Bearer CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "threshold": 3,
    "period": 60,
    "action": { "mode": "block", "timeout": 1800 },
    "match": { "request": { "methods": ["POST"], "schemes": ["https"], "url": "*/api/auth/password-reset*" } },
    "description": "Auth password reset rate limit"
  }'
```

### MFA verify rule
```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/CF_ZONE_ID/rate_limits" \
  -H "Authorization: Bearer CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "threshold": 6,
    "period": 300,
    "action": { "mode": "block", "timeout": 900 },
    "match": { "request": { "methods": ["POST"], "schemes": ["https"], "url": "*/api/auth/mfa*" } },
    "description": "Auth MFA verify rate limit"
  }'
```

### Optional: Bot/JS challenge for anonymous
```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/CF_ZONE_ID/rulesets/phases/http_request_firewall_custom/entrypoint" \
  -H "Authorization: Bearer CF_API_TOKEN" \
  -H "Content-Type": "application/json" \
  --data '{
    "description": "Challenge anonymous auth",
    "rules": [
      {
        "expression": "(http.request.uri.path contains \"/api/auth/anonymous\")",
        "action": "managed_challenge"
      }
    ]
  }'
```

## Fingerprinting (optional)
- Add request match on User-Agent and country to tighten rule:
  `"headers": [{ "name": "user-agent", "op": "present" }, { "name": "cf-ipcountry", "op": "present" }]`

## Verification checklist
- Rules created and active in Cloudflare dashboard (Rate Limiting section).
- Test with `curl` rapid requests to confirm 429/block after thresholds.
- Ensure preview/staging use same limits or slightly lower to catch issues early.
