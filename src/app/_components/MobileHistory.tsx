"use client";

import MobileAppBar from "@/app/_components/MobileAppBar";
import LockWidget from "@/app/_components/LockWidget";
import Modal from "@/components/shared/Modal";
import { filterTransactionsByMonth, sortTransactionsByDate } from "@/lib/budget";
import { formatCurrency, formatDate, getMonthLabel, monthKey } from "@/lib/utils";
import { useBudgetStore } from "@/store/budgetStore";
import { useMemo, useState } from "react";

type PeriodMode = "daily" | "monthly";

function isSameDate(date: string, compare: Date) {
  const d = new Date(date);
  return (
    d.getFullYear() === compare.getFullYear() &&
    d.getMonth() === compare.getMonth() &&
    d.getDate() === compare.getDate()
  );
}

export default function MobileHistory() {
  const isAuthenticated = useBudgetStore((state) => state.isAuthenticated);
  const wallets = useBudgetStore((state) => state.wallets);
  const categories = useBudgetStore((state) => state.categories);
  const transactions = useBudgetStore((state) => state.transactions);
  const loading = useBudgetStore((state) => state.loading);
  const syncLoading = useBudgetStore((state) => state.syncLoading);

  const [period, setPeriod] = useState<PeriodMode>("daily");
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [showWalletFilter, setShowWalletFilter] = useState(false);
  const [selectedWalletIds, setSelectedWalletIds] = useState<string[]>([]);
  const [draftWalletIds, setDraftWalletIds] = useState<string[]>([]);

  const walletMap = useMemo(
    () => new Map(wallets.map((wallet) => [wallet.id, wallet.name])),
    [wallets],
  );
  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  const filteredTransactions = useMemo(() => {
    let items = transactions;
    if (selectedWalletIds.length > 0) {
      items = items.filter((item) => selectedWalletIds.includes(item.walletId));
    }
    if (period === "daily") {
      const today = new Date();
      return items.filter((item) => isSameDate(item.date, today));
    }
    const key = monthKey(selectedMonth);
    return filterTransactionsByMonth(items, key);
  }, [transactions, selectedWalletIds, period, selectedMonth]);

  const sortedTransactions = useMemo(
    () => sortTransactionsByDate(filteredTransactions),
    [filteredTransactions],
  );

  const isLoading = loading || syncLoading;
  const monthLabel = getMonthLabel(monthKey(selectedMonth));
  const nextMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1);
  const now = new Date();
  const canGoNext =
    nextMonth.getFullYear() < now.getFullYear() ||
    (nextMonth.getFullYear() === now.getFullYear() && nextMonth.getMonth() <= now.getMonth());

  const openWalletFilter = () => {
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <MobileAppBar title="Riwayat" />
        <LockWidget />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <MobileAppBar title="Riwayat" />

      <div className="space-y-4 px-4 pb-24 pt-3">
        <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-1">
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              className={`rounded-lg py-2 text-sm font-semibold ${
                period === "daily"
                  ? "bg-[var(--bg-card-muted)] text-[var(--text-primary)]"
                  : "text-[var(--text-dimmed)]"
              }`}
              onClick={() => setPeriod("daily")}
            >
              Harian
            </button>
            <button
              type="button"
              className={`rounded-lg py-2 text-sm font-semibold ${
                period === "monthly"
                  ? "bg-[var(--bg-card-muted)] text-[var(--text-primary)]"
                  : "text-[var(--text-dimmed)]"
              }`}
              onClick={() => setPeriod("monthly")}
            >
              Bulanan
            </button>
          </div>
        </div>

        {period === "monthly" ? (
          <div className="flex items-center justify-between rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2">
            <button
              type="button"
              className="rounded-lg p-2 text-[var(--text-dimmed)] hover:text-[var(--text-primary)]"
              onClick={() =>
                setSelectedMonth(
                  new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1),
                )
              }
            >
              ◀
            </button>
            <span className="text-sm font-semibold text-[var(--text-primary)]">{monthLabel}</span>
            <button
              type="button"
              className="rounded-lg p-2 text-[var(--text-dimmed)] hover:text-[var(--text-primary)] disabled:opacity-40"
              onClick={() =>
                canGoNext
                  ? setSelectedMonth(
                      new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1),
                    )
                  : null
              }
              disabled={!canGoNext}
            >
              ▶
            </button>
          </div>
        ) : null}

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2 text-xs text-[var(--text-dimmed)]"
          onClick={openWalletFilter}
        >
          <svg viewBox="0 0 24 24" width={16} height={16} aria-hidden="true">
            <path
              d="M4 6h16M7 12h10M10 18h4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          Filter dompet
        </button>

        {isLoading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          </div>
        ) : sortedTransactions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border-soft)] p-6 text-center text-sm text-[var(--text-dimmed)]">
            Tidak ada transaksi pada periode ini.
          </div>
        ) : (
          <div className="space-y-3">
            {sortedTransactions.map((item) => {
              const category = categoryMap.get(item.categoryId);
              const isIncome = item.type === "income";
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-full"
                        style={{
                          backgroundColor: `${category?.color ?? "#94a3b8"}20`,
                          color: category?.color ?? "#94a3b8",
                        }}
                      >
                        <span className="text-xs font-semibold">
                          {(category?.name ?? "Lainnya").slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          {category?.name ?? "Tanpa kategori"}
                        </p>
                        <p className="text-xs text-[var(--text-dimmed)]">
                          {walletMap.get(item.walletId) ?? "Dompet"} · {formatDate(item.date, true)}
                        </p>
                      </div>
                    </div>
                    <div className={`text-sm font-semibold ${isIncome ? "text-emerald-400" : "text-rose-400"}`}>
                      {isIncome ? "+" : "-"}
                      {formatCurrency(item.amount)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={showWalletFilter} title="Filter Dompet" onClose={() => setShowWalletFilter(false)} sizeClassName="max-w-md">
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-dimmed)]">
            Pilih dompet yang ingin ditampilkan pada daftar transaksi.
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
