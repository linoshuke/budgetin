"use client";

import Header from "@/components/layout/Header";
import AuthGate from "@/components/shared/AuthGate";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { budgetActions, useBudgetStore } from "@/store/budgetStore";
import type { CategoryType } from "@/types/category";
import { FormEvent, useMemo, useState } from "react";

export default function CategoriesPage() {
  const categories = useBudgetStore((state) => state.categories);
  const transactions = useBudgetStore((state) => state.transactions);

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [color, setColor] = useState("#0ea5e9");
  const [type, setType] = useState<CategoryType>("expense");

  const usageCount = useMemo(() => {
    const counts = new Map<string, number>();
    transactions.forEach((item) => {
      counts.set(item.categoryId, (counts.get(item.categoryId) ?? 0) + 1);
    });
    return counts;
  }, [transactions]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;

    try {
      await budgetActions.addCategory({
        name: name.trim(),
        icon: icon.trim() || "NEW",
        color,
        type,
      });

      setName("");
      setIcon("");
      setColor("#0ea5e9");
      setType("expense");
    } catch (err) {
      console.error("Gagal menambah kategori:", err);
    }
  };

  return (
    <AuthGate>
      <div className="min-h-screen">
        <Header />

        <main className="page-shell space-y-6">
          <section className="space-y-2">
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Manajemen Kategori</h1>
            <p className="text-sm text-[var(--text-dimmed)]">
              Kategori default sudah tersedia. Tambahkan kategori kustom untuk kebutuhan pribadi.
            </p>
          </section>

        <form className="glass-panel grid gap-4 p-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm text-[var(--text-dimmed)]">Nama kategori</label>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Contoh: Investasi"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-[var(--text-dimmed)]">Kode ikon (teks pendek)</label>
            <Input
              value={icon}
              onChange={(event) => setIcon(event.target.value.toUpperCase().slice(0, 5))}
              placeholder="Contoh: FUND"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-[var(--text-dimmed)]">Tipe kategori</label>
            <select
              value={type}
              onChange={(event) => setType(event.target.value as CategoryType)}
              className="w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-muted)] px-3 py-2 text-sm text-[var(--text-primary)]"
            >
              <option value="expense">Pengeluaran</option>
              <option value="income">Pemasukan</option>
              <option value="both">Keduanya</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-[var(--text-dimmed)]">Warna kategori</label>
            <Input type="color" value={color} onChange={(event) => setColor(event.target.value)} />
          </div>

          <div className="sm:col-span-2">
            <Button type="submit">Tambah Kategori Kustom</Button>
          </div>
        </form>

        <section className="glass-panel p-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Daftar Kategori</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {categories.map((category) => (
              <article
                key={category.id}
                className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-muted)] p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex min-w-10 justify-center rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white"
                      style={{ backgroundColor: category.color }}
                    >
                      {category.icon}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{category.name}</p>
                      <p className="text-xs text-[var(--text-dimmed)]">
                        {category.type === "income" ? "Pemasukan" : category.type === "expense" ? "Pengeluaran" : "Keduanya"}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-[var(--text-dimmed)]">
                    {category.isDefault ? "Default" : "Custom"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-[var(--text-dimmed)]">
                  Dipakai di {usageCount.get(category.id) ?? 0} transaksi.
                </p>
              </article>
            ))}
          </div>
        </section>
        </main>
      </div>
    </AuthGate>
  );
}
