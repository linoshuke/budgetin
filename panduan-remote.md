# 📘 Panduan Kolaborasi Remote — Budgetin

> Dokumen ini berisi tata cara dan aturan pengerjaan remote untuk project **Budgetin**.
> Pastikan semua anggota tim membaca dan memahami panduan ini sebelum mulai berkontribusi.

---

## 📋 Daftar Isi

1. [Tech Stack Project](#-tech-stack-project)
2. [Prasyarat (Tools yang Dibutuhkan)](#-prasyarat-tools-yang-dibutuhkan)
3. [Setup Awal Project](#-setup-awal-project)
4. [Struktur Folder](#-struktur-folder)
5. [Aturan Branching](#-aturan-branching)
6. [Alur Kerja (Workflow)](#-alur-kerja-workflow)
7. [Konvensi Commit Message](#-konvensi-commit-message)
8. [Aturan Pull Request](#-aturan-pull-request)
9. [Aturan Penulisan Kode](#-aturan-penulisan-kode)
10. [Penanganan Konflik (Merge Conflict)](#-penanganan-konflik-merge-conflict)
11. [Perintah Git yang Sering Digunakan](#-perintah-git-yang-sering-digunakan)
12. [Kontak & Komunikasi](#-kontak--komunikasi)

---

## 🛠 Tech Stack Project
  
| Teknologi        | Versi / Detail       |
| ---------------- | -------------------- |
| **Framework**    | Next.js 16           |
| **Bahasa**       | TypeScript           |
| **Styling**      | Tailwind CSS 4       |
| **Backend/DB**   | Supabase             |
| **Package Mgr**  | npm / bun            |
| **Linting**      | ESLint 9             |

---

## 📦 Prasyarat (Tools yang Dibutuhkan)

Pastikan tools berikut sudah terinstall di komputer masing-masing:

1. **Node.js** — versi `22.x` atau lebih baru → [Download](https://nodejs.org/)
2. **Git** — versi terbaru → [Download](https://git-scm.com/)
3. **Code Editor** — disarankan **Visual Studio Code** → [Download](https://code.visualstudio.com/)
4. **Akun GitHub** — Pastikan sudah punya akun dan sudah ditambahkan sebagai **collaborator** di repo.

---

## 🚀 Setup Awal Project

### 1. Clone Repository

```bash
git clone https://github.com/linoshuke/budgetin.git
cd budgetin
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Konfigurasi Environment Variables

Buat file `.env` di root project. Minta file `.env` dari ketua tim (jangan pernah share di GitHub).

```env
# Contoh isi .env (minta value aslinya dari ketua tim)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxxxxx
```

> ⚠️ **PENTING:** File `.env` sudah ada di `.gitignore`.
>     **JANGAN** pernah push file ini ke GitHub.

### 4. Jalankan Project

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser untuk melihat hasilnya.

---

## 📂 Struktur Folder

```
budgetin/
├── src/
│   ├── app/           → Halaman & routing (App Router Next.js)
│   ├── components/    → Komponen UI yang reusable
│   ├── hooks/         → Custom React hooks
│   ├── lib/           → Utility functions & konfigurasi (Supabase, dsb.)
│   ├── store/         → State management
│   ├── styles/        → File CSS / styling global
│   └── types/         → TypeScript type definitions
├── public/            → Asset statis (gambar, ikon, dsb.)
├── .env               → Environment variables (JANGAN di-push!)
├── package.json       → Dependencies & scripts
└── tailwind.config.ts → Konfigurasi Tailwind CSS
```

---

## 🌿 Aturan Branching

### Branch Utama

| Branch     | Fungsi                                           |
| ---------- | ------------------------------------------------ |
| `master`   | Branch utama produksi. **JANGAN langsung push ke sini.** |

### Branch Kerja (Feature Branch)

Setiap fitur atau perbaikan harus dikerjakan di **branch terpisah** dari `master`.

**Format nama branch:**

```
<tipe>/<deskripsi-singkat>
```

**Tipe branch yang digunakan:**

| Tipe       | Kegunaan                         | Contoh                        |
| ---------- | -------------------------------- | ----------------------------- |
| `fitur`    | Fitur baru                       | `fitur/halaman-dashboard`     |
| `fix`      | Perbaikan bug                    | `fix/login-error`             |
| `style`    | Perubahan tampilan / UI          | `style/redesign-navbar`       |
| `docs`     | Dokumentasi                      | `docs/update-readme`          |
| `refactor` | Refactoring kode tanpa ubah fitur| `refactor/optimasi-query`     |

**Contoh:**

```bash
# Buat branch baru dari master
git checkout master
git pull origin master
git checkout -b fitur/halaman-transaksi
```

---

## 🔄 Alur Kerja (Workflow)

Ikuti langkah-langkah ini setiap kali mengerjakan fitur atau perbaikan:

```
┌─────────────────────────────────────────────────────────┐
│  1. Pull perubahan terbaru dari master                  │
│     git checkout master                                 │
│     git pull origin master                              │
│                                                         │
│  2. Buat branch baru                                    │
│     git checkout -b fitur/nama-fitur                    │
│                                                         │
│  3. Kerjakan fitur di branch tersebut                   │
│     (coding, testing, dsb.)                             │
│                                                         │
│  4. Commit perubahan                                    │
│     git add .                                           │
│     git commit -m "feat: deskripsi perubahan"           │
│                                                         │
│  5. Push branch ke GitHub                               │
│     git push origin fitur/nama-fitur                    │
│                                                         │
│  6. Buat Pull Request di GitHub                         │
│     (dari branch fitur → master)                        │
│                                                         │
│  7. Minta review dari ketua tim                  │
│                                                         │
│  8. Setelah disetujui → Merge ke master                 │
└─────────────────────────────────────────────────────────┘
```

---

## 📝 Konvensi Commit Message

Gunakan format **Conventional Commits** agar histori Git rapi dan mudah dibaca.

**Format:**

```
<tipe>: <deskripsi singkat>
```

**Tipe yang digunakan:**

| Tipe       | Kegunaan                                  | Contoh                                      |
| ---------- | ----------------------------------------- | ------------------------------------------- |
| `feat`     | Menambahkan fitur baru                    | `feat: menambahkan halaman dashboard`       |
| `fix`      | Memperbaiki bug                           | `fix: memperbaiki error saat login`         |
| `style`    | Perubahan tampilan / CSS                  | `style: mengubah warna tombol submit`       |
| `docs`     | Perubahan dokumentasi                     | `docs: update panduan remote`               |
| `refactor` | Refactoring kode (tanpa ubah fungsionalitas) | `refactor: memisahkan komponen sidebar`  |
| `chore`    | Tugas maintenance / konfigurasi           | `chore: update dependencies`                |

**Aturan:**

- ✅ Gunakan **bahasa Indonesia** untuk deskripsi
- ✅ Huruf kecil semua (tidak pakai huruf kapital di awal)
- ✅ Singkat dan jelas, maksimal ~72 karakter
- ❌ Jangan pakai titik di akhir

---

## 🔀 Aturan Pull Request

1. **Judul PR** harus jelas dan deskriptif.
   - ✅ `feat: menambahkan halaman riwayat transaksi`
   - ❌ `update` atau `fix bug`
2. **Deskripsi PR** harus menjelaskan:
   - Apa yang diubah?
   - Kenapa diubah?
   - Screenshot (jika ada perubahan UI)
3. **Minimal 1 orang** harus me-review sebelum merge.
4. **Pastikan tidak ada konflik** sebelum request merge.
5. **Jangan merge sendiri** — minta anggota lain untuk merge setelah review.

---

## ✍️ Aturan Penulisan Kode

### Umum

- Gunakan **TypeScript** (`.ts` / `.tsx`) untuk semua file.
- Gunakan **Tailwind CSS** untuk styling, hindari inline style.
- Penamaan file komponen menggunakan **PascalCase** → `TransactionCard.tsx`
- Penamaan file utility/hook menggunakan **camelCase** → `useTransaction.ts`

### Komponen

- Satu komponen per file.
- Letakkan di folder `src/components/`.
- Gunakan **function component** dengan arrow function.

```tsx
// ✅ Benar
const TransactionCard = ({ title, amount }: Props) => {
  return <div>{title}: Rp{amount}</div>;
};

export default TransactionCard;
```

### Types

- Definisikan type/interface di folder `src/types/`.
- Export semua type yang dipakai lintas file.

---

## ⚠️ Penanganan Konflik (Merge Conflict)

Konflik terjadi ketika dua orang mengubah file yang sama di baris yang sama.

### Cara Mengatasi:

```bash
# 1. Pastikan branch kamu up-to-date dengan master
git checkout master
git pull origin master

# 2. Pindah ke branch fitur kamu
git checkout fitur/nama-fitur

# 3. Merge master ke branch kamu
git merge master

# 4. Jika ada konflik, buka file yang konflik
#    Cari tanda berikut dan pilih kode yang benar:
#
#    <<<<<<< HEAD
#    (kode kamu)
#    =======
#    (kode dari master)
#    >>>>>>> master

# 5. Setelah selesai resolve, commit
git add .
git commit -m "fix: resolve merge conflict"
git push origin fitur/nama-fitur
```

> 💡 **Tips:** Gunakan fitur **Source Control** di VS Code untuk mempermudah resolve konflik secara visual.

---

## 💻 Perintah Git yang Sering Digunakan

| Perintah                              | Fungsi                                    |
| ------------------------------------- | ----------------------------------------- |
| `git clone <url>`                     | Clone repository ke komputer lokal        |
| `git checkout master`                 | Pindah ke branch master                   |
| `git pull origin master`              | Tarik perubahan terbaru dari master       |
| `git checkout -b <nama-branch>`       | Buat branch baru dan langsung pindah      |
| `git add .`                           | Tambahkan semua perubahan ke staging      |
| `git commit -m "<pesan>"`             | Commit perubahan dengan pesan             |
| `git push origin <nama-branch>`       | Push branch ke GitHub                     |
| `git branch`                          | Lihat daftar branch lokal                 |
| `git branch -a`                       | Lihat semua branch (lokal + remote)       |
| `git status`                          | Lihat status perubahan file               |
| `git log --oneline -10`               | Lihat 10 commit terakhir                  |
| `git merge <nama-branch>`             | Merge branch lain ke branch saat ini      |
| `git stash`                           | Simpan sementara perubahan yang belum di-commit |
| `git stash pop`                       | Kembalikan perubahan yang di-stash        |

---

> 📅 **Terakhir diperbarui:** 6 Maret 2026
>
> 🚀 Selamat mengerjakan project Budgetin!
