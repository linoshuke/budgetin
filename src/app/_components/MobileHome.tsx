"use client";

import MobileAppBar from "@/app/_components/MobileAppBar";
import Modal from "@/components/shared/Modal";
import { calculateTotals, filterTransactionsByMonth, summarizeByCategory } from "@/lib/budget";
import { formatCurrency, monthKey } from "@/lib/utils";
import { useBudgetStore } from "@/store/budgetStore";
import { useMemo, useState } from "react";

const chartPalette = [
  "#3b82f6",
  "#ef4444",
  "#22c55e",
  "#f97316",
  "#a855f7",
  "#14b8a6",
  "#ec4899",
  "#f59e0b",
];

export default function MobileHome() {
  const profile = useBudgetStore((state) => state.profile);
  const wallets = useBudgetStore((state) => state.wallets);
  const categories = useBudgetStore((state) => state.categories);
  const transactions = useBudgetStore((state) => state.transactions);
  const loading = useBudgetStore((state) => state.loading);
  const syncLoading = useBudgetStore((state) => state.syncLoading);

  const [showWalletFilter, setShowWalletFilter] = useState(false);
  const [selectedWalletIds, setSelectedWalletIds] = useState<string[]>([]);
  const [draftWalletIds, setDraftWalletIds] = useState<string[]>([]);

  const activeTransactions = useMemo(() => {
    if (selectedWalletIds.length === 0) return transactions;
    return transactions.filter((item) => selectedWalletIds.includes(item.walletId));
  }, [transactions, selectedWalletIds]);

  const totals = useMemo(() => calculateTotals(activeTransactions), [activeTransactions]);
  const currentMonth = monthKey(new Date());
  const monthTransactions = useMemo(
    () => filterTransactionsByMonth(activeTransactions, currentMonth),
    [activeTransactions, currentMonth],
  );
  const monthTotals = useMemo(() => calculateTotals(monthTransactions), [monthTransactions]);
  const expenseRows = useMemo(
    () => summarizeByCategory(monthTransactions, categories, "expense"),
    [monthTransactions, categories],
  );

  const greetingName = profile.name?.trim() || "Pengguna";
  const isLoading = loading || syncLoading;

  const openFilter = () => {
    setDraftWalletIds(selectedWalletIds);
    setShowWalletFilter(true);
  };

  const toggleWallet = (id: string) => {
    setDraftWalletIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const applyWalletFilter = () => {
    setSelectedWalletIds(draftWalletIds);
    setShowWalletFilter(false);
  };

  const totalExpense = expenseRows.reduce((sum, row) => sum + row.amount, 0);
  let offset = 0;
  const gradientStops = expenseRows.slice(0, chartPalette.length).map((row, index) => {
    const value = totalExpense > 0 ? (row.amount / totalExpense) * 100 : 0;
    const start = offset;
    const end = offset + value;
    offset = end;
    return `${chartPalette[index]} ${start}% ${end}%`;
  });

  const chartStyle =
    totalExpense > 0
      ? { background: `conic-gradient(${gradientStops.join(",")})` }
      : { background: "conic-gradient(#94a3b8 0% 100%)" };

  return (
    <div className="min-h-screen">
      <MobileAppBar title="Beranda" />

      <div className="space-y-6 px-4 pb-24 pt-4">
        <h2 className="whitespace-pre-line text-[26px] font-bold text-[var(--text-primary)]">
          {`Selamat Datang,\n${greetingName}.`}
        </h2>

        <button
          type="button"
          className="relative h-[180px] w-full rounded-2xl bg-gradient-to-br from-indigo-400 to-indigo-700 p-5 text-left shadow-lg"
          onClick={openFilter}
        >
          <p className="text-base font-medium text-white/70">Total Saldo</p>
          {isLoading ? (
            <div className="mt-6 flex items-center gap-3 text-white/80">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span className="text-sm">Memuat saldo...</span>
            </div>
          ) : (
            <p className="mt-2 text-[32px] font-bold text-white" style={{ letterSpacing: "1.2px" }}>
              {formatCurrency(totals.balance)}
            </p>
          )}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/15 px-3 py-1 text-[12px] text-white/70">
            Tap untuk pilih dompet
          </div>
        </button>

        <section className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4 shadow-sm">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">Ringkasan Bulanan</h3>
          {isLoading ? (
            <div className="flex h-[78px] items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="space-y-1">
                <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                  <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true">
                    <path d="M12 5v14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M6 11l6-6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </div>
                <p className="text-[12px] text-[var(--text-dimmed)]">Pemasukan</p>
                <p className="text-sm font-bold text-[var(--text-primary)]">
                  {formatCurrency(monthTotals.income)}
                </p>
              </div>
              <div className="space-y-1">
                <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-rose-500/15 text-rose-400">
                  <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true">
                    <path d="M12 19V5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M6 13l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </div>
                <p className="text-[12px] text-[var(--text-dimmed)]">Pengeluaran</p>
                <p className="text-sm font-bold text-[var(--text-primary)]">
                  {formatCurrency(monthTotals.expense)}
                </p>
              </div>
              <div className="space-y-1">
                <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-sky-500/15 text-sky-400">
                  <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true">
                    <rect
                      x="6"
                      y="7"
                      width="12"
                      height="10"
                      rx="2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                  </svg>
                </div>
                <p className="text-[12px] text-[var(--text-dimmed)]">Sisa</p>
                <p className="text-sm font-bold text-[var(--text-primary)]">
                  {formatCurrency(monthTotals.balance)}
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-[12px] font-bold uppercase tracking-wide text-white/80">
              Pengeluaran Bulan Ini
            </h3>
            <span className="text-[11px] text-[var(--text-dimmed)]">Kategori</span>
          </div>
          {isLoading ? (
            <div className="flex h-[160px] items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            </div>
          ) : totalExpense === 0 ? (
            <div className="flex h-[160px] flex-col items-center justify-center gap-2 text-center text-[var(--text-dimmed)]">
              <svg viewBox="0 0 24 24" width={32} height={32} aria-hidden="true">
                <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
                <path d="M8 12h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <p className="text-sm">Belum ada pengeluaran bulan ini.</p>
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-4">
              <div className="relative h-28 w-28 rounded-full" style={chartStyle}>
                <div className="absolute inset-4 rounded-full bg-[var(--bg-card)]" />
              </div>
              <div className="flex-1 space-y-2 text-xs text-[var(--text-dimmed)]">
                {expenseRows.slice(0, 4).map((row, index) => (
                  <div key={row.category.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: chartPalette[index] }}
                      />
                      <span className="text-[var(--text-primary)]">{row.category.name}</span>
                    </div>
                    <span>{row.percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      <Modal open={showWalletFilter} title="Pilih Dompet" onClose={() => setShowWalletFilter(false)} sizeClassName="max-w-md">
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-dimmed)]">
            Pilih satu atau lebih dompet untuk menghitung saldo dan ringkasan.
          </p>
          <div className="space-y-2">
            {wallets.map((wallet) => (
              <label key={wallet.id} className="flex items-center gap-3 text-sm text-[var(--text-primary)]">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-indigo-600"
                  checked={draftWalletIds.includes(wallet.id)}
                  onChange={() => toggleWallet(wallet.id)}
                />
                {wallet.name}
              </label>
            ))}
            {wallets.length === 0 ? (
              <p className="text-sm text-[var(--text-dimmed)]">Belum ada dompet yang tersimpan.</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
              onClick={applyWalletFilter}
            >
              Terapkan
            </button>
            <button
              type="button"
              className="rounded-lg border border-[var(--border-soft)] px-4 py-2 text-sm text-[var(--text-dimmed)]"
              onClick={() => setShowWalletFilter(false)}
            >
              Batal
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
