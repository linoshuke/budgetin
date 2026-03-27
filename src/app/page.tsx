"use client";

import MobileAppShell from "@/app/_components/MobileAppShell";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import AddTransactionFab from "@/components/shared/AddTransactionFab";
import AuthGate from "@/components/shared/AuthGate";
import Modal from "@/components/shared/Modal";
import MonthlySummary from "@/components/shared/MonthlySummary";
import StatCard from "@/components/shared/StatCard";
import TransactionForm from "@/components/shared/TransactionForm";
import TransactionList from "@/components/shared/TransactionList";
import { calculateTotals, filterTransactionsByMonth, getRecentTransactions } from "@/lib/budget";
import { formatCurrency, monthKey } from "@/lib/utils";
import { budgetActions, useBudgetStore } from "@/store/budgetStore";
import type { Transaction } from "@/types/transaction";
import { useMemo, useState } from "react";

export default function DashboardPage() {
  const transactions = useBudgetStore((state) => state.transactions);
  const categories = useBudgetStore((state) => state.categories);
  const wallets = useBudgetStore((state) => state.wallets);
  const syncLoading = useBudgetStore((state) => state.syncLoading);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [savingTransaction, setSavingTransaction] = useState(false);

  const totals = useMemo(() => calculateTotals(transactions), [transactions]);
  const activeMonth = monthKey(new Date());
  const monthTransactions = useMemo(
    () => filterTransactionsByMonth(transactions, activeMonth),
    [transactions, activeMonth],
  );
  const monthTotals = useMemo(() => calculateTotals(monthTransactions), [monthTransactions]);
  const recent = useMemo(() => getRecentTransactions(transactions, 8), [transactions]);

  const handleSubmit = async (payload: Omit<Transaction, "id">) => {
    try {
      setSavingTransaction(true);
      await budgetActions.addTransaction(payload);
      setShowTransactionModal(false);
    } catch (err) {
      console.error("Gagal menyimpan transaksi:", err);
    } finally {
      setSavingTransaction(false);
    }
  };

  const formDisabled = syncLoading || savingTransaction;

  return (
    <AuthGate>
      <div className="min-h-screen">
        <div className="hidden md:block">
          <Header />

          <main className="page-shell space-y-6">
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

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr,280px]">
              <div className="space-y-6">
                <MonthlySummary income={monthTotals.income} expense={monthTotals.expense} />

                <TransactionList
                  title="Recent Transactions"
                  subtitle="Menampilkan 8 transaksi terbaru"
                  transactions={recent}
                  categories={categories}
                  wallets={wallets}
                  disabled={syncLoading}
                />
              </div>
              <Sidebar totals={totals} />
            </section>
          </main>

          <AddTransactionFab disabled={syncLoading} onClick={() => setShowTransactionModal(true)} />
          <Modal
            open={showTransactionModal}
            title="Catat Transaksi"
            onClose={() => setShowTransactionModal(false)}
            sizeClassName="max-w-4xl"
          >
            <TransactionForm
              key={showTransactionModal ? "transaction-modal" : "transaction-hidden"}
              categories={categories}
              wallets={wallets}
              onSubmit={handleSubmit}
              onCreateWallet={(payload) => budgetActions.addWallet(payload)}
              submitLabel="Simpan Transaksi"
              onCancel={() => setShowTransactionModal(false)}
              disabled={formDisabled}
            />
          </Modal>
        </div>

        <div className="md:hidden">
          <MobileAppShell />
        </div>
      </div>
    </AuthGate>
  );
}
