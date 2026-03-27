"use client";

import Header from "@/components/layout/Header";
import AuthGate from "@/components/shared/AuthGate";
import Button from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useBudgetStore } from "@/store/budgetStore";
import type { Transaction } from "@/types/transaction";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

type FilterKey = "all" | "week" | "month";

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "Semua" },
  { key: "week", label: "1 Minggu Terakhir" },
  { key: "month", label: "1 Bulan Terakhir" },
];

function filterByRange(transactions: Transaction[], filter: FilterKey): Transaction[] {
  if (filter === "all") return transactions;

  const now = new Date();
  const cutoff = new Date(now);
  if (filter === "week") {
    cutoff.setDate(cutoff.getDate() - 7);
  } else {
    cutoff.setDate(cutoff.getDate() - 30);
  }

  return transactions.filter((t) => new Date(t.date) >= cutoff);
}

function groupByDate(transactions: Transaction[]): Map<string, Transaction[]> {
  const sorted = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const groups = new Map<string, Transaction[]>();
  for (const tx of sorted) {
    const key = tx.date.slice(0, 10); // YYYY-MM-DD
    const arr = groups.get(key);
    if (arr) {
      arr.push(tx);
    } else {
      groups.set(key, [tx]);
    }
  }
  return groups;
}

export default function WalletDetailPage() {
  const params = useParams<{ id: string }>();
  const walletId = params.id;

  const wallets = useBudgetStore((s) => s.wallets);
  const allTransactions = useBudgetStore((s) => s.transactions);
  const categories = useBudgetStore((s) => s.categories);

  const wallet = wallets.find((w) => w.id === walletId);

  const walletTransactions = useMemo(
    () => allTransactions.filter((t) => t.walletId === walletId),
    [allTransactions, walletId],
  );

  const balance = useMemo(() => {
    return walletTransactions.reduce((sum, t) => {
      return sum + (t.type === "income" ? t.amount : -t.amount);
    }, 0);
  }, [walletTransactions]);

  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  const filtered = useMemo(
    () => filterByRange(walletTransactions, activeFilter),
    [walletTransactions, activeFilter],
  );

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  if (!wallet) {
    return (
      <AuthGate>
        <div className="min-h-screen">
          <Header />
          <main className="page-shell space-y-6">
            <Link
              href="/transactions"
              className="inline-flex items-center gap-1 text-sm text-teal-400 transition-colors hover:text-teal-300"
            >
              ← Kembali ke Wallet
            </Link>
            <section className="glass-panel p-6 text-center">
              <p className="text-[var(--text-dimmed)]">Dompet tidak ditemukan.</p>
            </section>
          </main>
        </div>
      </AuthGate>
    );
  }

  return (
    <AuthGate>
      <div className="min-h-screen">
        <Header />

        <main className="page-shell space-y-6">
          {/* Back link */}
          <Link
            href="/transactions"
            className="inline-flex items-center gap-1 text-sm text-teal-400 transition-colors hover:text-teal-300"
          >
            ← Kembali ke Wallet
          </Link>

          {/* Wallet header */}
          <section className="glass-panel p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
                {wallet.name}
              </h1>
              {wallet.isDefault ? (
                <span className="rounded-full border border-teal-500/40 bg-teal-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-teal-300">
                  Default
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-[var(--text-dimmed)]">Total saldo</p>
            <p className="text-xl font-bold text-[var(--text-primary)]">
              {formatCurrency(balance)}
            </p>
          </section>

          {/* Filter bar */}
          <section className="flex flex-wrap items-center gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  activeFilter === f.key
                    ? "bg-teal-500/15 text-teal-300"
                    : "border border-[var(--border-soft)] text-[var(--text-dimmed)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                }`}
                onClick={() => setActiveFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
            <span className="ml-auto text-xs text-[var(--text-dimmed)]">
              {filtered.length} transaksi
            </span>
          </section>

          {/* Transaction list grouped by date */}
          {filtered.length === 0 ? (
            <section className="glass-panel p-6 text-center">
              <p className="text-sm text-[var(--text-dimmed)]">
                {activeFilter === "all"
                  ? "Belum ada transaksi di dompet ini."
                  : "Tidak ada transaksi dalam periode ini."}
              </p>
            </section>
          ) : (
            <section className="space-y-4">
              {Array.from(grouped.entries()).map(([dateKey, txs]) => (
                <div key={dateKey} className="glass-panel overflow-hidden">
                  {/* Date header */}
                  <div className="border-b border-[var(--border-soft)] bg-[var(--bg-card-muted)] px-4 py-2">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                      {formatDate(dateKey, true)}
                    </h3>
                  </div>

                  {/* Transactions */}
                  <div className="divide-y divide-[var(--border-soft)] px-4">
                    {txs.map((tx) => {
                      const category = categoryMap.get(tx.categoryId);
                      return (
                        <article
                          key={tx.id}
                          className="flex flex-wrap items-center justify-between gap-3 py-3"
                        >
                          <div>
                            <p className="text-sm font-semibold text-[var(--text-primary)]">
                              {category?.name ?? "Tanpa kategori"}
                            </p>
                            <p className="text-xs text-[var(--text-dimmed)]">
                              {tx.note || "Tidak ada catatan"}
                            </p>
                          </div>
                          <span
                            className={`text-sm font-semibold ${
                              tx.type === "income"
                                ? "text-emerald-400"
                                : "text-rose-400"
                            }`}
                          >
                            {tx.type === "income" ? "+" : "-"}
                            {formatCurrency(tx.amount)}
                          </span>
                        </article>
                      );
                    })}
                  </div>
                </div>
              ))}
            </section>
          )}
        </main>
      </div>
    </AuthGate>
  );
}
