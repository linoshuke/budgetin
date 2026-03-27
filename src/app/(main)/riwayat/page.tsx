"use client";

import { useEffect } from "react";
import FilterSection from "@/components/history/FilterSection";
import TransactionList from "@/components/history/TransactionList";
import LockWidget from "@/components/LockWidget";
import WalletSelectionDialog from "@/components/modals/WalletSelectionDialog";
import { useTransactions } from "@/hooks/useTransactions";
import { useAuth } from "@/hooks/useAuth";
import { useTransactionStore } from "@/stores/transactionStore";
import { useUIStore } from "@/stores/uiStore";

export default function HistoryPage() {
  const { isGuest } = useAuth();
  const { query } = useTransactions();
  const transactions = useTransactionStore((state) => state.transactions);
  const pushToast = useUIStore((state) => state.pushToast);

  useEffect(() => {
    if (query.error) {
      pushToast({
        title: "Gagal memuat transaksi",
        description: "Periksa koneksi Anda lalu coba lagi.",
        variant: "error",
      });
    }
  }, [query.error, pushToast]);

  return (
    <div className="grid gap-6 desktop:grid-cols-[280px_1fr]">
      <div className="space-y-4 desktop:sticky desktop:top-24">
        <FilterSection />
        {isGuest ? <LockWidget message="Masuk untuk melihat riwayat lengkap." /> : null}
      </div>
      <div>
        <TransactionList
          transactions={transactions}
          loading={query.isLoading}
          error={query.error}
          onRetry={() => query.refetch()}
        />
      </div>
      <WalletSelectionDialog />
    </div>
  );
}
