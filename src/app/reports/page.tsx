"use client";

import Header from "@/components/layout/Header";
import MobileAppBar from "@/app/_components/mobile/MobileAppBar";
import MobileBottomNav from "@/app/_components/mobile/MobileBottomNav";
import AuthGate from "@/components/shared/AuthGate";
import ExpenseChart from "@/components/shared/ExpenseChart";
import MonthlySummary from "@/components/shared/MonthlySummary";
import Button from "@/components/ui/Button";
import {
  calculateTotals,
  filterTransactionsByDateRange,
  filterTransactionsByMonth,
  summarizeByCategory,
} from "@/lib/budget";
import { formatCurrency, getMonthLabel, monthKey } from "@/lib/utils";
import { useBudgetStore } from "@/store/budgetStore";
import type { Transaction } from "@/types/transaction";
import { useMemo, useState } from "react";

type FilterMode = "this_month" | "last_month" | "custom";

type DailyStat = { day: number; income: number; expense: number };

type TooltipState = {
  walletId: string;
  day: number;
  income: number;
  expense: number;
} | null;

function getLastMonthKey(referenceDate: Date) {
  return monthKey(new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 1, 1));
}

function buildDailyStats(referenceDate: Date, transactions: Transaction[], walletId: string) {
  const targetMonth = monthKey(referenceDate);
  const map = new Map<number, DailyStat>();

  transactions.forEach((tx) => {
    if (tx.walletId !== walletId) return;
    if (monthKey(tx.date) !== targetMonth) return;
    const day = new Date(tx.date).getDate();
    const record = map.get(day) ?? { day, income: 0, expense: 0 };
    if (tx.type === "income") record.income += tx.amount;
    else record.expense += tx.amount;
    map.set(day, record);
  });

  return [...map.values()].sort((a, b) => a.day - b.day);
}

export default function ReportsPage() {
  const transactions = useBudgetStore((state) => state.transactions);
  const categories = useBudgetStore((state) => state.categories);
  const wallets = useBudgetStore((state) => state.wallets);

  const [mode, setMode] = useState<FilterMode>("this_month");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [tooltip, setTooltip] = useState<TooltipState>(null);

  const thisMonth = monthKey(new Date());
  const lastMonth = getLastMonthKey(new Date());

  const filteredTransactions = useMemo(() => {
    if (mode === "this_month") {
      return filterTransactionsByMonth(transactions, thisMonth);
    }
    if (mode === "last_month") {
      return filterTransactionsByMonth(transactions, lastMonth);
    }
    return filterTransactionsByDateRange(transactions, fromDate, toDate);
  }, [mode, transactions, thisMonth, lastMonth, fromDate, toDate]);

  const totals = useMemo(() => calculateTotals(filteredTransactions), [filteredTransactions]);
  const expenseRows = useMemo(
    () => summarizeByCategory(filteredTransactions, categories, "expense"),
    [filteredTransactions, categories],
  );

  const statsReferenceDate = useMemo(() => {
    if (mode === "last_month") {
      return new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
    }
    if (mode === "custom" && fromDate) {
      return new Date(fromDate);
    }
    return new Date();
  }, [mode, fromDate]);

  const statsMonthLabel = getMonthLabel(monthKey(statsReferenceDate));

  return (
    <AuthGate>
      <div className="min-h-screen">
        <div className="hidden md:block">
          <Header />
        </div>
        <div className="md:hidden">
          <MobileAppBar title="Analitik" />
        </div>

        <main className="page-shell space-y-6">
          <section className="space-y-2">
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Laporan dan Analitik</h1>
            <p className="text-sm text-[var(--text-dimmed)]">
              Pilih rentang waktu untuk melihat pengeluaran terbesar dan ringkasan performa keuangan.
            </p>
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <aside className="space-y-6 lg:col-span-3">
              <section className="glass-panel space-y-4 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant={mode === "this_month" ? "primary" : "outline"}
                    onClick={() => setMode("this_month")}
                  >
                    Bulan Ini
                  </Button>
                  <Button
                    variant={mode === "last_month" ? "primary" : "outline"}
                    onClick={() => setMode("last_month")}
                  >
                    Bulan Lalu
                  </Button>
                  <Button
                    variant={mode === "custom" ? "primary" : "outline"}
                    onClick={() => setMode("custom")}
                  >
                    Rentang Kustom
                  </Button>
                </div>

                {mode === "custom" ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1 text-sm text-[var(--text-dimmed)]">
                      Dari tanggal
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(event) => setFromDate(event.target.value)}
                        className="w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-muted)] px-3 py-2 text-[var(--text-primary)]"
                      />
                    </label>
                    <label className="space-y-1 text-sm text-[var(--text-dimmed)]">
                      Sampai tanggal
                      <input
                        type="date"
                        value={toDate}
                        onChange={(event) => setToDate(event.target.value)}
                        className="w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-muted)] px-3 py-2 text-[var(--text-primary)]"
                      />
                    </label>
                  </div>
                ) : (
                  <p className="text-sm text-[var(--text-dimmed)]">
                    Filter aktif: {mode === "this_month" ? getMonthLabel(thisMonth) : getMonthLabel(lastMonth)}
                  </p>
                )}
              </section>
            </aside>

            <section className="space-y-6 lg:col-span-9">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <MonthlySummary income={totals.income} expense={totals.expense} />
                <ExpenseChart rows={expenseRows} />
              </div>

              <section className="glass-panel p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">Statistik Harian per Dompet</h2>
                    <p className="text-xs text-[var(--text-dimmed)]">Periode: {statsMonthLabel}</p>
                  </div>
                  <span className="text-xs text-[var(--text-dimmed)]">Pemasukan vs Pengeluaran</span>
                </div>

                {wallets.length === 0 ? (
                  <div className="mt-4 rounded-xl border border-dashed border-[var(--border-soft)] p-6 text-center text-sm text-[var(--text-dimmed)]">
                    Belum ada dompet untuk ditampilkan.
                  </div>
                ) : (
                  <>
                    <div className="mt-4 md:hidden">
                      <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto">
                        {wallets.map((wallet) => {
                          const dailyStats = buildDailyStats(statsReferenceDate, transactions, wallet.id);
                          const maxValue = dailyStats.reduce(
                            (max, row) => Math.max(max, row.income, row.expense),
                            0,
                          );
                          return (
                            <div key={wallet.id} className="w-full snap-center shrink-0">
                              <WalletStatCard
                                walletName={wallet.name}
                                dailyStats={dailyStats}
                                maxValue={maxValue}
                                tooltip={tooltip}
                                onToggleTooltip={setTooltip}
                                walletId={wallet.id}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-4 hidden grid-cols-1 gap-4 md:grid md:grid-cols-2 xl:grid-cols-3">
                      {wallets.map((wallet) => {
                        const dailyStats = buildDailyStats(statsReferenceDate, transactions, wallet.id);
                        const maxValue = dailyStats.reduce(
                          (max, row) => Math.max(max, row.income, row.expense),
                          0,
                        );
                        return (
                          <WalletStatCard
                            key={wallet.id}
                            walletName={wallet.name}
                            dailyStats={dailyStats}
                            maxValue={maxValue}
                            tooltip={tooltip}
                            onToggleTooltip={setTooltip}
                            walletId={wallet.id}
                          />
                        );
                      })}
                    </div>
                  </>
                )}
              </section>

              <section className="glass-panel p-4">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Detail per Kategori</h2>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {expenseRows.map((row) => (
                    <div
                      key={row.category.id}
                      className="flex items-center justify-between rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-muted)] px-3 py-2 text-sm"
                    >
                      <span className="text-[var(--text-primary)]">{row.category.name}</span>
                      <span className="text-[var(--text-dimmed)]">
                        {formatCurrency(row.amount)} ({row.count} transaksi)
                      </span>
                    </div>
                  ))}
                  {expenseRows.length === 0 ? (
                    <p className="text-sm text-[var(--text-dimmed)]">
                      Tidak ada pengeluaran pada filter ini.
                    </p>
                  ) : null}
                </div>
              </section>
            </section>
          </div>
        </main>

        <div className="md:hidden">
          <MobileBottomNav />
        </div>
      </div>
    </AuthGate>
  );
}

function WalletStatCard({
  walletName,
  dailyStats,
  maxValue,
  tooltip,
  onToggleTooltip,
  walletId,
}: {
  walletName: string;
  dailyStats: DailyStat[];
  maxValue: number;
  tooltip: TooltipState;
  onToggleTooltip: (next: TooltipState) => void;
  walletId: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4 shadow-sm">
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-[var(--text-primary)]">{walletName}</h3>
        <p className="text-xs text-[var(--text-dimmed)]">Ringkasan transaksi periode ini</p>
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-[var(--text-dimmed)]">
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Pemasukan
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-rose-400" />
          Pengeluaran
        </span>
      </div>

      {dailyStats.length === 0 ? (
        <div className="mt-4 flex h-36 flex-col items-center justify-center gap-2 text-sm text-[var(--text-dimmed)]">
          <svg viewBox="0 0 24 24" width={32} height={32} aria-hidden="true">
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="M8 12h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          Belum ada transaksi bulan ini.
        </div>
      ) : (
        <div className="mt-6 h-36 overflow-x-auto">
          <div className="flex h-full items-end gap-2">
            {dailyStats.map((row) => {
              const incomeHeight = maxValue ? (row.income / maxValue) * 100 : 0;
              const expenseHeight = maxValue ? (row.expense / maxValue) * 100 : 0;
              return (
                <button
                  key={row.day}
                  type="button"
                  className="flex flex-col items-center gap-1"
                  onClick={() =>
                    onToggleTooltip(
                      tooltip && tooltip.walletId === walletId && tooltip.day === row.day
                        ? null
                        : {
                            walletId,
                            day: row.day,
                            income: row.income,
                            expense: row.expense,
                          },
                    )
                  }
                >
                  <div className="flex h-24 items-end gap-1">
                    <div
                      className="w-2 rounded-full bg-emerald-400"
                      style={{ height: `${Math.max(incomeHeight, 4)}%` }}
                    />
                    <div
                      className="w-2 rounded-full bg-rose-400"
                      style={{ height: `${Math.max(expenseHeight, 4)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-[var(--text-dimmed)]">{row.day}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {tooltip && tooltip.walletId === walletId ? (
        <div className="mt-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-muted)] px-3 py-2 text-xs text-[var(--text-primary)]">
          <p className="font-semibold">Hari {tooltip.day}</p>
          <p className="text-emerald-400">Pemasukan: {tooltip.income.toLocaleString("id-ID")}</p>
          <p className="text-rose-400">Pengeluaran: {tooltip.expense.toLocaleString("id-ID")}</p>
        </div>
      ) : null}
    </div>
  );
}
