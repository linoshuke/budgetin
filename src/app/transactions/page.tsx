"use client";

import Header from "@/components/layout/Header";
import AuthGate from "@/components/shared/AuthGate";
import TransactionForm from "@/components/shared/TransactionForm";
import TransactionList from "@/components/shared/TransactionList";
import { getRecentTransactions } from "@/lib/budget";
import { budgetActions, useBudgetStore } from "@/store/budgetStore";
import type { Transaction } from "@/types/transaction";
import type { Wallet } from "@/types/wallet";
import { useMemo, useState } from "react";

export default function TransactionsPage() {
  const transactions = useBudgetStore((state) => state.transactions);
  const categories = useBudgetStore((state) => state.categories);
  const wallets = useBudgetStore((state) => state.wallets);
  const [editingId, setEditingId] = useState<string | null>(null);

  const sortedTransactions = useMemo(
    () => getRecentTransactions(transactions, 100),
    [transactions],
  );
  const editingTransaction = useMemo(
    () => transactions.find((item) => item.id === editingId),
    [transactions, editingId],
  );

  const handleSubmit = async (payload: Omit<Transaction, "id">) => {
    try {
      if (editingId) {
        await budgetActions.updateTransaction(editingId, payload);
        setEditingId(null);
        return;
      }
      await budgetActions.addTransaction(payload);
    } catch (err) {
      console.error("Gagal menyimpan transaksi:", err);
    }
  };

  return (
    <AuthGate>
      <div className="min-h-screen">
        <Header />

        <main className="page-shell space-y-6">
          <section className="space-y-2">
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Modul Pencatatan Transaksi</h1>
            <p className="text-sm text-[var(--text-dimmed)]">
              Tambah, edit, atau hapus transaksi agar dashboard selalu terbarui.
            </p>
          </section>

          <TransactionForm
            key={editingId ?? "new-transaction"}
            categories={categories}
            wallets={wallets}
            initialValue={editingTransaction}
            onSubmit={handleSubmit}
            onCreateWallet={(payload: Omit<Wallet, "id" | "isDefault">) => budgetActions.addWallet(payload)}
            submitLabel={editingId ? "Perbarui Transaksi" : "Tambah Transaksi"}
            onCancel={editingId ? () => setEditingId(null) : undefined}
          />

          <TransactionList
            title="Semua Transaksi"
            subtitle={`${sortedTransactions.length} data`}
            transactions={sortedTransactions}
            categories={categories}
            wallets={wallets}
            onEdit={setEditingId}
            onDelete={async (id) => {
              try {
                await budgetActions.deleteTransaction(id);
                if (editingId === id) {
                  setEditingId(null);
                }
              } catch (err) {
                console.error("Gagal menghapus transaksi:", err);
              }
            }}
          />
        </main>
      </div>
    </AuthGate>
  );
}
