"use client";

import Header from "@/components/layout/Header";
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
import { useMemo, useState } from "react";

type FilterMode = "this_month" | "last_month" | "custom";

function getLastMonthKey(referenceDate: Date) {
  return monthKey(new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 1, 1));
}

export default function ReportsPage() {
  const transactions = useBudgetStore((state) => state.transactions);
  const categories = useBudgetStore((state) => state.categories);
  const [mode, setMode] = useState<FilterMode>("this_month");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

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

  return (
    <div className="min-h-screen">
      <Header />

      <main className="page-shell space-y-6">
        <section className="space-y-2">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Laporan dan Analitik</h1>
          <p className="text-sm text-[var(--text-dimmed)]">
            Pilih rentang waktu untuk melihat pengeluaran terbesar dan ringkasan performa keuangan.
          </p>
        </section>

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

        <MonthlySummary income={totals.income} expense={totals.expense} />
        <ExpenseChart rows={expenseRows} />

        <section className="glass-panel p-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Detail per Kategori</h2>
          <div className="mt-4 space-y-2">
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
      </main>
    </div>
  );
}
