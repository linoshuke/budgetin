"use client";

import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import AddTransactionFab from "@/components/shared/AddTransactionFab";
import MonthlySummary from "@/components/shared/MonthlySummary";
import StatCard from "@/components/shared/StatCard";
import TransactionList from "@/components/shared/TransactionList";
import { calculateTotals, filterTransactionsByMonth, getRecentTransactions } from "@/lib/budget";
import { formatCurrency, monthKey } from "@/lib/utils";
import { useBudgetStore } from "@/store/budgetStore";
import { useMemo } from "react";

export default function DashboardPage() {
  const transactions = useBudgetStore((state) => state.transactions);
  const categories = useBudgetStore((state) => state.categories);

  const totals = useMemo(() => calculateTotals(transactions), [transactions]);
  const activeMonth = monthKey(new Date());
  const monthTransactions = useMemo(
    () => filterTransactionsByMonth(transactions, activeMonth),
    [transactions, activeMonth],
  );
  const monthTotals = useMemo(() => calculateTotals(monthTransactions), [monthTransactions]);
  const recent = useMemo(() => getRecentTransactions(transactions, 8), [transactions]);

  return (
    <div className="min-h-screen">
      <Header />

      <div className="page-shell grid grid-cols-1 gap-6 lg:grid-cols-[280px,1fr]">
        <Sidebar categories={categories} totals={totals} />

        <main className="space-y-6">
          <section className="card-grid">
            <StatCard
              title="Saldo Total"
              value={formatCurrency(totals.balance)}
              helper="Pemasukan dikurangi pengeluaran"
              accent="teal"
            />
            <StatCard
              title="Pemasukan Bulan Ini"
              value={formatCurrency(monthTotals.income)}
              helper={`${monthTransactions.filter((item) => item.type === "income").length} transaksi`}
              accent="emerald"
            />
            <StatCard
              title="Pengeluaran Bulan Ini"
              value={formatCurrency(monthTotals.expense)}
              helper={`${monthTransactions.filter((item) => item.type === "expense").length} transaksi`}
              accent="rose"
            />
          </section>

          <MonthlySummary income={monthTotals.income} expense={monthTotals.expense} />

          <TransactionList
            title="Recent Transactions"
            subtitle="Menampilkan 8 transaksi terbaru"
            transactions={recent}
            categories={categories}
          />
        </main>
      </div>

      <AddTransactionFab />
    </div>
  );
}
