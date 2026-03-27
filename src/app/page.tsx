"use client";

import Header from "@/components/layout/Header";
import MobileAppBar from "@/app/_components/mobile/MobileAppBar";
import MobileBottomNav from "@/app/_components/mobile/MobileBottomNav";
import AddTransactionFab from "@/components/shared/AddTransactionFab";
import AuthGate from "@/components/shared/AuthGate";
import DashboardContent from "@/components/shared/DashboardContent";
import Modal from "@/components/shared/Modal";
import TransactionForm from "@/components/shared/TransactionForm";
import WalletFilterModal from "@/components/shared/WalletFilterModal";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useWalletFilter } from "@/hooks/useWalletFilter";
import { budgetActions, useBudgetStore } from "@/store/budgetStore";
import type { Transaction } from "@/types/transaction";
import { useMemo, useState } from "react";

export default function DashboardPage() {
  const profile = useBudgetStore((state) => state.profile);
  const syncLoading = useBudgetStore((state) => state.syncLoading);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [savingTransaction, setSavingTransaction] = useState(false);

  const walletFilter = useWalletFilter();
  const {
    categories,
    wallets,
    totals,
    monthTotals,
    monthIncomeCount,
    monthExpenseCount,
    recent,
    expenseRows,
  } = useDashboardData({ walletIds: walletFilter.selectedWalletIds });

  const greetingName = profile.name?.trim() || "Pengguna";

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
  const filterLabel = useMemo(() => {
    if (walletFilter.selectedWalletIds.length === 0) return "Semua dompet";
    return `${walletFilter.selectedWalletIds.length} dompet`;
  }, [walletFilter.selectedWalletIds.length]);

  return (
    <AuthGate>
      <div className="min-h-screen">
        <div className="hidden md:block">
          <Header />
        </div>
        <div className="md:hidden">
          <MobileAppBar title="Beranda" />
        </div>

        <main className="page-shell space-y-6">
          <section className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-dimmed)]">Halo</p>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="whitespace-pre-line text-[26px] font-bold text-[var(--text-primary)]">
                {`Selamat Datang,\n${greetingName}.`}
              </h1>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2 text-xs text-[var(--text-dimmed)]"
                onClick={walletFilter.openFilter}
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
                {filterLabel}
              </button>
            </div>
          </section>

          <DashboardContent
            totals={totals}
            monthTotals={monthTotals}
            monthIncomeCount={monthIncomeCount}
            monthExpenseCount={monthExpenseCount}
            recent={recent}
            expenseRows={expenseRows}
            categories={categories}
            wallets={wallets}
          />
        </main>

        <div className="[&>*]:bottom-24 md:[&>*]:bottom-6 md:[&>*]:right-6">
          <AddTransactionFab disabled={syncLoading} onClick={() => setShowTransactionModal(true)} />
        </div>
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

        <WalletFilterModal
          open={walletFilter.open}
          wallets={wallets}
          draftWalletIds={walletFilter.draftWalletIds}
          onToggle={walletFilter.toggleWallet}
          onApply={walletFilter.applyFilter}
          onClose={walletFilter.closeFilter}
        />

        <div className="md:hidden">
          <MobileBottomNav />
        </div>
      </div>
    </AuthGate>
  );
}
