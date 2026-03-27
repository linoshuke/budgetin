"use client";

import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import AddTransactionFab from "@/components/shared/AddTransactionFab";
import MonthlySummary from "@/components/shared/MonthlySummary";
import StatCard from "@/components/shared/StatCard";
import TransactionList from "@/components/shared/TransactionList";
import { useTransactions } from "@/hooks/useTransactions";
import { formatCurrency } from "@/lib/utils";
import { useBudgetStore } from "@/store/budgetStore";

export default function Home() {
  const { transactions, totals, recent } = useBudgetStore();
  const incomes = useTransactions(transactions, "income");
  const expenses = useTransactions(transactions, "expense");

  return (
    <div className="relative min-h-screen">
      <Header />

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 pb-24 pt-10 lg:grid-cols-[240px,1fr]">
        <Sidebar
          categories={[
            { name: "Makanan", icon: "🍔", color: "#f97316" },
            { name: "Transportasi", icon: "🚗", color: "#22d3ee" },
            { name: "Tagihan", icon: "💡", color: "#a855f7" },
            { name: "Gaji", icon: "💰", color: "#34d399" },
            { name: "Hiburan", icon: "🎬", color: "#f472b6" },
          ]}
          totals={totals}
        />

        <main className="space-y-6">
          <section className="card-grid">
            <StatCard
              title="Saldo Total"
              value={formatCurrency(totals.balance)}
              helper="Total Pemasukan - Pengeluaran"
              trend={totals.balance >= 0 ? "positif" : "negatif"}
            />
            <StatCard
              title="Pemasukan"
              value={formatCurrency(totals.income)}
              helper={`${incomes.length} sumber bulan ini`}
              accent="emerald"
            />
            <StatCard
              title="Pengeluaran"
              value={formatCurrency(totals.expense)}
              helper={`${expenses.length} transaksi`}
              accent="rose"
            />
          </section>

          <MonthlySummary income={totals.income} expense={totals.expense} />

          <TransactionList
            transactions={recent}
            onEdit={(id) => console.log("Edit transaksi", id)}
            onDelete={(id) => console.log("Hapus transaksi", id)}
          />
        </main>
      </div>

      <AddTransactionFab />
    </div>
  );
}
