"use client";

import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { formatDate, toCsvRow } from "@/lib/utils";
import { budgetActions, useBudgetStore } from "@/store/budgetStore";
import { useMemo, useState } from "react";

export default function ProfilePage() {
  const profile = useBudgetStore((state) => state.profile);
  const transactions = useBudgetStore((state) => state.transactions);
  const categories = useBudgetStore((state) => state.categories);
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);

  const categoryMap = useMemo(
    () => new Map(categories.map((item) => [item.id, item.name])),
    [categories],
  );

  const exportCsv = () => {
    const header = ["Tanggal", "Jenis", "Kategori", "Nominal", "Catatan"];
    const rows = transactions.map((item) => [
      formatDate(item.date, true),
      item.type === "income" ? "Pemasukan" : "Pengeluaran",
      categoryMap.get(item.categoryId) ?? "Tanpa kategori",
      item.amount,
      item.note ?? "",
    ]);

    const csv = [toCsvRow(header), ...rows.map((row) => toCsvRow(row))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `budgetin-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen">
      <Header />

      <main className="page-shell space-y-6">
        <section className="space-y-2">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Profil dan Pengaturan</h1>
          <p className="text-sm text-[var(--text-dimmed)]">
            Atur data akun, ubah tampilan light/dark mode, dan export riwayat transaksi.
          </p>
        </section>

        <section className="glass-panel space-y-4 p-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Detail Akun</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-[var(--text-dimmed)]">Nama</label>
              <Input value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-[var(--text-dimmed)]">Email</label>
              <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
          </div>

          <Button onClick={async () => {
            try {
              await budgetActions.updateProfile({ name: name.trim(), email: email.trim() });
            } catch (err) {
              console.error("Gagal menyimpan profil:", err);
            }
          }}>
            Simpan Profil
          </Button>
        </section>

        <section className="glass-panel space-y-4 p-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Pengaturan Tampilan</h2>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={profile.theme === "dark" ? "primary" : "outline"}
              onClick={async () => {
                try { await budgetActions.setTheme("dark"); } catch (err) { console.error(err); }
              }}
            >
              Dark Mode
            </Button>
            <Button
              variant={profile.theme === "light" ? "primary" : "outline"}
              onClick={async () => {
                try { await budgetActions.setTheme("light"); } catch (err) { console.error(err); }
              }}
            >
              Light Mode
            </Button>
          </div>
        </section>

        <section className="glass-panel space-y-3 p-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Export Data</h2>
          <p className="text-sm text-[var(--text-dimmed)]">
            Download riwayat transaksi ke file CSV untuk analisis lanjutan.
          </p>
          <Button variant="outline" onClick={exportCsv}>
            Export ke CSV
          </Button>
        </section>
      </main>
    </div>
  );
}
