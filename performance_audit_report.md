# 🔍 Web Performance Audit — Budgetin
**Stack:** Next.js 16.1.6 · React 19 · Supabase · TailwindCSS v4 · Vercel · Upstash Redis  
**Diaudit:** 2026-04-03 | Berdasarkan inspeksi kode aktual

---

## 1. EXECUTIVE SUMMARY

### Estimasi Skor Performa (Lighthouse Mobile)

| Metrik | Estimasi Skor | Target |
|---|---|---|
| Performance | **55–65** | ≥ 90 |
| Accessibility | 75–80 | ≥ 90 |
| Best Practices | 80–85 | ≥ 95 |
| SEO | 70–75 | ≥ 90 |

> [!WARNING]
> Skor performance **sangat dipengaruhi** oleh Google Fonts `Material Symbols Outlined` yang di-load via `<link>` blocking, dan tidak adanya caching header pada API routes.

### 3 Bottleneck Terbesar

1. **Render-Blocking Third-Party Font** — `Material Symbols Outlined` di-load via external `<link>` di `<head>` tanpa `preload`, memblokir render hingga 500–800ms pada koneksi 3G.
2. **Seluruh App adalah Client-Side** — `layout.tsx` di `(main)` adalah `"use client"`, artinya tidak ada SSR untuk halaman apapun. Setiap route butuh full JS hydration sebelum interaktif → INP & LCP tinggi.
3. **Waterfall Data Fetching** — `DataLoader` → fetch session → kondisional fetch anonymous → `budgetActions.loadFromApi()`. Tiga round-trip berurutan sebelum data apapun ditampilkan.

### 3 Quick Wins (Impact Tinggi, Effort Rendah)

| # | Quick Win | Estimasi Gain |
|---|---|---|
| 1 | Tambahkan `Cache-Control` header pada GET API routes | ~30% TTI reduction pada revisit |
| 2 | Self-host `Material Symbols Outlined` atau gunakan `<link rel="preload">` | LCP -300ms |
| 3 | Tambahkan `staleTime` & `gcTime` ke TanStack Query config | Eliminasi refetch berulang |

---

## 2. AUDIT CORE WEB VITALS

### LCP (Largest Contentful Paint)
**Estimasi:** 3.8–5.5s mobile | Target: < 2.5s

**Penyebab Utama:**
- `Material Symbols Outlined` di-load via `<link rel="stylesheet">` di `<head>` tanpa `preload` → render-blocking
- `TotalBalanceCard` mengandung SVG inline kompleks dan efek `blur-[80px]` CSS yang mahal
- Gambar di `beranda/page.tsx` (line 220) di-load dari external URL `lh3.googleusercontent.com` tanpa `loading="lazy"`, `width/height`, atau `fetchpriority`
- Tidak ada SSR → LCP element hanya muncul setelah JS hydration selesai

**Rekomendasi:**
```html
<!-- SEBELUM (blocking) -->
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined..." />

<!-- SESUDAH: preload + async load -->
<link rel="preload" as="style" href="https://fonts.googleapis.com/..." onload="this.onload=null;this.rel='stylesheet'" />
```

Untuk gambar di `beranda/page.tsx`:
```tsx
// Ganti <img> biasa dengan next/image
import Image from "next/image";
<Image
  src="https://lh3.googleusercontent.com/..."
  alt="savings"
  width={400}
  height={300}
  loading="lazy"
  className="absolute inset-0 h-full w-full scale-110 object-cover opacity-20"
/>
```

---

### INP (Interaction to Next Paint)
**Estimasi:** 200–400ms | Target: < 200ms

**Penyebab Utama:**
- `(main)/layout.tsx` adalah `"use client"` sepenuhnya; tab-cache system (line 22-46) menyimpan semua tab di memori dan render sembunyi dengan `className="hidden"` — semua JS tetap dieksekusi
- `framer-motion` `AnimatePresence` dijalankan pada setiap route change di `providers.tsx`
- `useMemo` di `beranda/page.tsx` melakukan `[...transactions].sort()` synchronously — O(n log n) per render

**Rekomendasi:**

```tsx
// 1. Lazy load framer-motion
const { AnimatePresence, motion } = await import("framer-motion");

// 2. Ganti tab-cache hidden div dengan display:contents + visibility
// Atau gunakan React.lazy + Suspense per tab

// 3. Sort transaksi hanya saat data berubah, bukan setiap render
// Sudah menggunakan useMemo tapi bisa dipindah ke server-side sorting
```

---

### CLS (Cumulative Layout Shift)
**Estimasi:** 0.15–0.25 | Target: < 0.1

**Penyebab Utama:**
- Gambar di `beranda/page.tsx` (line 217–221) tidak memiliki explisit `width` dan `height` → browser tidak bisa reserve ruang sebelum gambar load
- Font `Inter` dan `Plus Jakarta Sans` menggunakan `display: "swap"` (benar), tapi `Material Symbols Outlined` di-load via CSS external dengan `display=block` yang blocking
- `MainLayout` memiliki transisi sidebar (`lg:ml-20` ↔ `lg:ml-64`) tanpa `transition` CSS → layout jump saat state toggle

**Rekomendasi:**
```tsx
// Tambahkan CSS transition pada main element
<main className={`min-h-screen transition-all duration-300 ease-in-out ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"}`}>
```

```tsx
// Selalu sertakan width/height pada semua <img> tags
<img width={400} height={300} ... />
// atau gunakan Next.js <Image> yang otomatis handle ini
```

---

## 3. STRATEGI RENDERING & CACHING

### Evaluasi Rendering Saat Ini
Seluruh app menggunakan **Client-Side Rendering (CSR)** murni — bahkan `(main)/layout.tsx` memiliki `"use client"` directive. Ini tidak optimal.

### Matriks Rekomendasi per Halaman

| Halaman | Render Saat Ini | Rekomendasi | Alasan |
|---|---|---|---|
| `/beranda` | CSR | **ISR (revalidate: 60s)** | Data agregat, tidak perlu real-time |
| `/riwayat` | CSR | **SSR + streaming** | Data user-spesifik, perlu fresh |
| `/statistik` | CSR | **ISR (revalidate: 300s)** | Laporan bulanan, jarang berubah |
| `/dompet` | CSR | **SSR** | Balance harus akurat |
| `/categories` | CSR | **Static (build-time)** | Data referensial, jarang berubah |
| `/login`, `/signup` | CSR | **Static** | Tidak butuh server data |

### Implementasi ISR
```tsx
// Pisahkan fetch ke Server Component
// src/app/(main)/beranda/page.tsx — HAPUS "use client" dari sini

export const revalidate = 60; // ISR: regenerate tiap 60 detik

export default async function HomePage() {
  // Fetch data di server
  const summary = await getMonthlySummary();
  return <HomeClient initialData={summary} />;
}
```

### Caching API

**Saat ini:** Tidak ada `Cache-Control` header pada API routes (wallets, transactions, profiles). Setiap request baru selalu hit Supabase.

**Rekomendasi:**
```ts
// src/app/api/wallets/route.ts
export async function GET() {
  // ...existing code...
  return NextResponse.json(wallets, {
    headers: {
      "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
    },
  });
}
```

```ts
// TanStack Query — tambahkan staleTime
new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,       // Data dianggap fresh 30 detik
      gcTime: 5 * 60_000,     // Cache tersimpan 5 menit
    },
  },
})
```

---

## 4. ANALISIS BUNDLE SIZE & JAVASCRIPT

### Estimasi Bundle (berdasarkan dependencies)

| Library | Estimasi Size (gzip) | Digunakan Di |
|---|---|---|
| `framer-motion` v12 | **~85KB** | Hanya transisi halaman di `providers.tsx` |
| `recharts` v2 | **~140KB** | `CashFlowChartCard`, `ExpenseChart` |
| `@supabase/supabase-js` | ~75KB | Auth + DB |
| `@tanstack/react-query` | ~35KB | Data fetching |
| `zod` v4 | ~15KB | Validasi |
| `react-hook-form` | ~25KB | Form handling |
| `lucide-react` | ~variable | Ikon |
| **Total Estimasi** | **~400–450KB gzip** | — |

> [!CAUTION]
> `framer-motion` v12 (~85KB gzip) digunakan hanya untuk **satu animasi fade** di `providers.tsx`. Ini ROI yang sangat buruk.

### Rekomendasi Code Splitting

**1. Lazy load Recharts (paling impactful):**
```tsx
// CashFlowChartCard.tsx
import dynamic from "next/dynamic";

const LineChart = dynamic(() => import("recharts").then(m => ({ default: m.LineChart })), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse rounded-xl bg-surface-container" />,
});
```

**2. Ganti framer-motion untuk animasi sederhana:**
```tsx
// Ganti AnimatedSwitcher dengan CSS transitions
// providers.tsx — hapus framer-motion sepenuhnya

function AnimatedSwitcher({ children }: { children: ReactNode }) {
  return (
    <div className="animate-fade-in min-h-screen">
      {children}
    </div>
  );
}
// Tambahkan di globals.css:
// @keyframes fade-in { from { opacity:0 } to { opacity:1 } }
// .animate-fade-in { animation: fade-in 0.3s ease-out; }
```

**3. Lazy load modals:**
```tsx
const WalletSelectionDialog = dynamic(() => import("@/components/modals/WalletSelectionDialog"), {
  ssr: false,
});
```

**4. Lucide-react — import individual:**
```ts
// ❌ Berisiko tree-shaking gagal
import { Icon1, Icon2 } from "lucide-react";

// ✅ Direct import per icon
import Icon1 from "lucide-react/dist/esm/icons/icon-1";
```

**5. Aktifkan bundle analyzer:**
```bash
npm install --save-dev @next/bundle-analyzer
```
```js
// next.config.mjs
import BundleAnalyzer from "@next/bundle-analyzer";
const withBundleAnalyzer = BundleAnalyzer({ enabled: process.env.ANALYZE === "true" });
export default withBundleAnalyzer(nextConfig);
```

---

## 5. OPTIMASI GAMBAR & ASET

### Temuan

| File | Masalah |
|---|---|
| `beranda/page.tsx` L220 | `<img>` biasa dari external URL, tanpa width/height, tanpa lazy loading |
| `public/Budgetin.svg` | `favicon.ico` (25KB) bersamaan SVG — favicon.ico sebaiknya dihapus |
| Seluruh app | Tidak ada gambar WebP/AVIF; tidak ada `Next/Image` |

### Fix External Image di Beranda

```tsx
// next.config.mjs — tambahkan domain
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

// beranda/page.tsx
import Image from "next/image";
// Ganti <img> dengan:
<Image
  src="https://lh3.googleusercontent.com/..."
  alt="Smart savings illustration"
  fill
  sizes="(max-width: 768px) 100vw, 33vw"
  loading="lazy"
  className="object-cover opacity-20"
/>
```

### CLS Prevention
```tsx
// Semua gambar WAJIB punya width/height atau fill + sizes
// Untuk SVG icon di /public:
<Image src="/Budgetin.svg" alt="Budgetin" width={32} height={32} />
```

---

## 6. OPTIMASI CSS

### Temuan

| Temuan | File | Impact |
|---|---|---|
| TailwindCSS v4 aktif tapi `tokens.css` menggunakan CSS vars custom yang tidak di-purge | `globals.css`, `tokens.css` | Possible CSS bloat |
| `Material Symbols Outlined` CSS external blocking | `layout.tsx` L44–47 | +500ms render block |
| `blur-[80px]` di `TotalBalanceCard` | `TotalBalanceCard.tsx` L88 | GPU-intensive, paint expensive |

### Critical CSS Inline

```tsx
// layout.tsx — inlinekan critical CSS untuk above-the-fold
<style dangerouslySetInnerHTML={{ __html: `
  body { background: #0e141d; color: #dde2f1; margin: 0; }
  .min-h-screen { min-height: 100vh; }
` }} />
```

### Kurangi CSS Paint Cost

```css
/* Ganti blur-[80px] dengan solusi lebih ringan */
/* Di TotalBalanceCard — gunakan gradient radial menggantikan backdrop blur */
.card-glow {
  background: radial-gradient(ellipse at top right, rgba(124,235,255,0.08) 0%, transparent 70%);
}
```

### TailwindCSS v4 Purging

TailwindCSS v4 melakukan purge otomatis, tapi pastikan `content` path dikonfigurasi benar:
```js
// tailwind.config.ts — verifikasi semua paths
content: [
  "./src/**/*.{js,ts,jsx,tsx,mdx}",
  "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
]
```

---

## 7. FONT & THIRD PARTY SCRIPT

### Audit Font Loading

**Saat ini:**
```tsx
// layout.tsx L44-47 — BLOCKING render
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined..."
/>
```

**Inter & Plus Jakarta Sans** menggunakan `next/font/google` dengan `display: "swap"` ✅ — ini sudah benar.

**Material Symbols Outlined** menggunakan external `<link>` biasa — ini **blocking render**.

### Rekomendasi

**Opsi A (Quick Win): Non-blocking load**
```tsx
<link
  rel="preconnect"
  href="https://fonts.gstatic.com"
  crossOrigin="anonymous"
/>
<link
  rel="preload"
  as="style"
  href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined..."
/>
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined..."
  media="print"
  // @ts-ignore
  onLoad="this.media='all'"
/>
```

**Opsi B (Best): Self-host Material Symbols**
```bash
# Download hanya subset icons yang digunakan
npx google-fonts-helper --family "Material Symbols Outlined" --subsets latin
```

```css
/* src/fonts/material-symbols.css */
@font-face {
  font-family: "Material Symbols Outlined";
  src: url("/fonts/material-symbols-outlined.woff2") format("woff2");
  font-display: block; /* Sesuai display=block yang ada */
}
```

---

## 8. DELIVERY & NETWORK OPTIMIZATION

### Audit

**Positif yang sudah ada:**
- Vercel otomatis mengaktifkan HTTP/2, Brotli compression, dan edge CDN ✅
- HSTS header sudah dikonfigurasi di `next.config.mjs` ✅
- Security headers lengkap ✅

**Yang belum ada:**
- Tidak ada `<link rel="preconnect">` ke Supabase di `layout.tsx`
- Tidak ada `dns-prefetch` ke Upstash Redis domain
- `X-DNS-Prefetch-Control: off` (line 6 `next.config.mjs`) justru **mematikan** DNS prefetch browser!

### Tambahkan ke `layout.tsx`

```tsx
<head>
  {/* Preconnect ke Supabase untuk mengurangi connection latency */}
  <link rel="preconnect" href="https://YOUR_PROJECT.supabase.co" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
  
  {/* DNS prefetch sebagai fallback */}
  <link rel="dns-prefetch" href="https://YOUR_PROJECT.supabase.co" />
</head>
```

### Fix `X-DNS-Prefetch-Control`

```js
// next.config.mjs — UBAH:
// ❌ { key: "X-DNS-Prefetch-Control", value: "off" }
// ✅ 
{ key: "X-DNS-Prefetch-Control", value: "on" }
```

> [!IMPORTANT]
> `X-DNS-Prefetch-Control: off` saat ini **mencegah browser** melakukan DNS pre-resolve untuk link di halaman, yang menaikkan latency navigasi.

### Route Prefetching

Next.js `<Link>` sudah melakukan prefetch otomatis untuk routes yang visible — pastikan navigasi menggunakan `<Link>` bukan `<a>` biasa.

---

## 9. OPTIMASI BACKEND & DATABASE

### Audit API Routes

**`/api/transactions` GET (route.ts L24-66):**
- `limit` default 100, `useExpenseByCategory` fetch dengan limit **500** — ini sangat besar
- Query berurutan: auth check → DB query → response; tidak ada caching
- `monthly_summary` diupdate **manual** di dalam POST transaction (L105-132) — risiko inconsistency dan N+1 write

**`/api/wallets` GET:**
- Tidak ada caching header → Supabase dipanggil setiap page view
- `getAllWallets` belum diinspeksi tapi kemungkinan `SELECT *`

### Database Recommendations

```sql
-- 1. Index yang wajib ada (verifikasi di Supabase dashboard):
CREATE INDEX IF NOT EXISTS idx_transactions_user_date 
  ON transactions(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_wallet_date 
  ON transactions(wallet_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_monthly_summary_lookup 
  ON monthly_summary(user_id, wallet_id, year, month);

-- 2. Validasi query dengan EXPLAIN ANALYZE
EXPLAIN ANALYZE 
SELECT * FROM transactions 
WHERE user_id = 'xxx' AND date BETWEEN '2026-01-01' AND '2026-01-31'
ORDER BY date DESC LIMIT 100;
```

### Kurangi Limit di `useExpenseByCategory`

```ts
// useTransactions.ts L143 — KURANGI limit:
// ❌ limit: "500"
// ✅
limit: "100", // Cukup untuk chart pie
```

### Pindahkan `monthly_summary` Update ke Database Trigger

```sql
-- Lebih reliable dan menghapus logic dari application layer
CREATE OR REPLACE FUNCTION update_monthly_summary()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO monthly_summary (user_id, wallet_id, year, month, total_income, total_expense)
  VALUES (
    NEW.user_id, NEW.wallet_id,
    EXTRACT(YEAR FROM NEW.date::date),
    EXTRACT(MONTH FROM NEW.date::date),
    CASE WHEN NEW.type = 'income' THEN NEW.amount ELSE 0 END,
    CASE WHEN NEW.type = 'expense' THEN NEW.amount ELSE 0 END
  )
  ON CONFLICT (user_id, wallet_id, year, month)
  DO UPDATE SET
    total_income = monthly_summary.total_income + EXCLUDED.total_income,
    total_expense = monthly_summary.total_expense + EXCLUDED.total_expense;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_monthly_summary
AFTER INSERT ON transactions
FOR EACH ROW EXECUTE FUNCTION update_monthly_summary();
```

### Connection Pooling

Supabase sudah menggunakan `pgBouncer` mode pooling secara default. Pastikan string koneksi menggunakan **Transaction mode** (port 6543) untuk Next.js serverless, bukan Session mode (port 5432).

---

## 10. OPTIMASI UNTUK DEVICE & JARINGAN LEMAH

### Masalah Saat Ini
- Semua komponen heavy: Recharts, framer-motion, seluruh Zustand stores di-load bahkan untuk halaman login
- Tidak ada strategi untuk koneksi slow 3G
- Animasi CSS `animate-spin` + `blur-[80px]` tetap aktif di semua device

### Rekomendasi

**1. Respect `prefers-reduced-motion`:**
```css
/* globals.css */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**2. Adaptive loading dengan Network Information API:**
```ts
// utils/network.ts
export function isSlowConnection() {
  if (typeof navigator === "undefined") return false;
  const conn = (navigator as Navigator & { connection?: { effectiveType: string } }).connection;
  return conn?.effectiveType === "slow-2g" || conn?.effectiveType === "2g";
}
```

```tsx
// Defer non-critical components pada slow network
const DataVizSection = dynamic(() => import("./DataVizSection"), {
  ssr: false,
  loading: () => <PlaceholderCard />,
});
```

**3. `requestIdleCallback` untuk background operations:**
```ts
// stores/budgetStore.ts — wrap non-critical operations
requestIdleCallback(() => {
  budgetActions.syncToLocalStorage();
});
```

---

## 11. SECURITY IMPACT KE PERFORMANCE

### Cookie & Storage Audit

**Auth cookie Supabase:** Session token di-set oleh `@supabase/ssr` — ukuran token JWT standard (~1-2KB base64). **Dikirim di setiap request** ke server.

**Temuan:**
- `DataLoader.tsx` memanggil `/api/auth/session` DAN `SupabaseProvider` di `providers.tsx` juga memanggil `/api/auth/session` — **duplikasi fetch session yang identik!**
- Ini berarti setiap page load terjadi **2x round-trip** ke `/api/auth/session`

### Fix Duplikasi Session Fetch

```tsx
// providers.tsx — SupabaseProvider TIDAK perlu fetch session sendiri
// karena DataLoader sudah melakukan hal yang sama

// Solusi: Gunakan shared state (authStore) sebagai single source of truth
// dan hanya lakukan satu kali fetch dari DataLoader
```

### Minimalisasi Payload Cookie

Verifikasi di browser DevTools → Application → Cookies:
- Hapus cookie non-essential
- Pastikan `SameSite=Lax` pada semua cookies auth (sudah dihandle Supabase)

---

## 12. MONITORING & MEASUREMENT

### Lighthouse CI — Setup di CI/CD

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [push]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build
      - uses: treosh/lighthouse-ci-action@v12
        with:
          urls: |
            http://localhost:3000/beranda
            http://localhost:3000/riwayat
          budgetPath: ./lighthouse-budget.json
          uploadArtifacts: true
```

```json
// lighthouse-budget.json
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.8 }],
        "first-contentful-paint": ["error", { "maxNumericValue": 2000 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }]
      }
    }
  }
}
```

### Real User Monitoring (RUM)

Vercel Analytics sudah terintegrasi — aktifkan di dashboard Vercel:
```tsx
// app/layout.tsx
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### Synthetic Monitoring

```bash
# Install @vercel/speed-insights
npm install @vercel/speed-insights

# Atau gunakan web-vitals untuk custom metrics
npm install web-vitals
```

```ts
// lib/vitals.ts
import { onCLS, onINP, onLCP } from "web-vitals";

export function reportWebVitals() {
  onCLS(console.log);
  onINP(console.log);
  onLCP(console.log);
}
```

---

## 13. PRIORITY ROADMAP

### Tabel Prioritas

| Prioritas | Action Item | Impact | Effort | ETA |
|---|---|---|---|---|
| 🔴 **P0** | Fix duplikasi `/api/auth/session` fetch (DataLoader + SupabaseProvider) | **Tinggi** | Rendah | 1 jam |
| 🔴 **P0** | Tambah `staleTime: 30000` ke TanStack Query config | **Tinggi** | Rendah | 30 menit |
| 🔴 **P0** | Ubah `X-DNS-Prefetch-Control: off` → `on` di `next.config.mjs` | **Tinggi** | Rendah | 5 menit |
| 🔴 **P0** | Tambahkan `Cache-Control: private, max-age=30` pada GET wallets & categories | **Tinggi** | Rendah | 1 jam |
| 🟠 **P1** | Ganti `<img>` dengan `next/image` & konfigurasi `remotePatterns` | **Tinggi** | Rendah | 2 jam |
| 🟠 **P1** | Non-blocking load `Material Symbols Outlined` (preload + onload trick) | **Tinggi** | Rendah | 1 jam |
| 🟠 **P1** | Kurangi `limit: "500"` → `"100"` di `useExpenseByCategory` | **Tinggi** | Rendah | 15 menit |
| 🟠 **P1** | Lazy load `CashFlowChartCard` & `ExpenseChart` (Recharts ~140KB) | **Tinggi** | Sedang | 2 jam |
| 🟠 **P1** | Ganti `framer-motion` dengan CSS animation untuk page transitions | **Tinggi** | Sedang | 3 jam |
| 🟡 **P2** | Tambah `preconnect` ke Supabase domain di `layout.tsx` | **Sedang** | Rendah | 30 menit |
| 🟡 **P2** | Implementasi ISR untuk `/beranda` dan `/statistik` | **Tinggi** | Tinggi | 1–2 hari |
| 🟡 **P2** | Self-host Material Symbols Outlined (subset hanya icons yang digunakan) | **Sedang** | Sedang | 4 jam |
| 🟡 **P2** | Pindahkan `monthly_summary` update ke database trigger | **Sedang** | Sedang | 4 jam |
| 🟡 **P2** | Tambahkan CSS `transition-all` pada sidebar margin untuk smooth toggle | **Rendah** | Rendah | 15 menit |
| 🟢 **P3** | Setup Lighthouse CI di GitHub Actions | **Sedang** | Sedang | 2 jam |
| 🟢 **P3** | Aktifkan Vercel Analytics + Speed Insights | **Sedang** | Rendah | 30 menit |
| 🟢 **P3** | Tambahkan `@next/bundle-analyzer` untuk audit bundle ongoing | **Sedang** | Rendah | 1 jam |
| 🟢 **P3** | Implementasi `prefers-reduced-motion` di globals.css | **Rendah** | Rendah | 30 menit |
| 🔵 **P4** | Migrasi halaman transaksional ke SSR + streaming | **Tinggi** | Tinggi | 3–5 hari |
| 🔵 **P4** | Implementasi database indexes + EXPLAIN ANALYZE audit di Supabase | **Tinggi** | Tinggi | 1–2 hari |
| 🔵 **P4** | Adaptive serving berdasarkan Network Information API | **Sedang** | Tinggi | 2–3 hari |

---

### Estimasi Gain Setelah Implementasi P0 + P1

| Metrik | Sebelum | Setelah P0+P1 | Target |
|---|---|---|---|
| LCP | ~4.5s | ~2.2s | < 2.5s |
| INP | ~350ms | ~150ms | < 200ms |
| CLS | ~0.20 | ~0.08 | < 0.10 |
| Lighthouse Performance | ~60 | ~82 | ≥ 90 |
| Bundle size (gzip) | ~450KB | ~280KB | < 250KB |

---

*Laporan ini berdasarkan inspeksi statis kodebase. Untuk angka pasti, jalankan Lighthouse di Chrome DevTools dengan throttling Mobile Slow 3G dan lakukan Real User Monitoring setelah deploy.*
