"use client";

import Header from "@/components/layout/Header";
import MobileAppBar from "@/app/_components/mobile/MobileAppBar";
import MobileBottomNav from "@/app/_components/mobile/MobileBottomNav";
import AuthGate from "@/components/shared/AuthGate";
import StatCard from "@/components/shared/StatCard";
import TransactionList from "@/components/shared/TransactionList";
import WalletFilterModal from "@/components/shared/WalletFilterModal";
import Modal from "@/components/shared/Modal";
import TransactionForm from "@/components/shared/TransactionForm";
import Button from "@/components/ui/Button";
import { useTransactionsFilter } from "@/hooks/useTransactionsFilter";
import { useWalletFilter } from "@/hooks/useWalletFilter";
import { budgetActions, useBudgetStore } from "@/store/budgetStore";
import { calculateTotals } from "@/lib/budget";
import { formatCurrency, formatDate, toCsvRow } from "@/lib/utils";
import type { Transaction } from "@/types/transaction";
import { useMemo, useState } from "react";

export default function TransactionsPage() {
  const transactions = useBudgetStore((state) => state.transactions);
  const categories = useBudgetStore((state) => state.categories);
  const wallets = useBudgetStore((state) => state.wallets);
  const syncLoading = useBudgetStore((state) => state.syncLoading);

  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [savingTransaction, setSavingTransaction] = useState(false);

  const walletFilter = useWalletFilter();
  const filter = useTransactionsFilter(transactions, walletFilter.selectedWalletIds, "daily");

  const filterLabel = useMemo(() => {
    if (walletFilter.selectedWalletIds.length === 0) return "Semua dompet";
    return `${walletFilter.selectedWalletIds.length} dompet dipilih`;
  }, [walletFilter.selectedWalletIds.length]);

  const totals = useMemo(
    () => calculateTotals(filter.filteredTransactions),
    [filter.filteredTransactions],
  );

  const periodLabel = useMemo(() => {
    if (filter.period === "daily") return "Hari ini";
    if (filter.period === "monthly") return filter.monthLabel;
    if (filter.fromDate || filter.toDate) {
      const from = filter.fromDate ? filter.fromDate : "Awal";
      const to = filter.toDate ? filter.toDate : "Akhir";
      return `${from} - ${to}`;
    }
    return "Rentang kustom";
  }, [filter.period, filter.monthLabel, filter.fromDate, filter.toDate]);

  const categoryMap = useMemo(
    () => new Map(categories.map((item) => [item.id, item.name])),
    [categories],
  );
  const walletMap = useMemo(
    () => new Map(wallets.map((item) => [item.id, item.name])),
    [wallets],
  );

  const exportCsv = () => {
    const header = ["Tanggal", "Jenis", "Kategori", "Dompet", "Nominal", "Catatan"];
    const rows = filter.filteredTransactions.map((item) => [
      formatDate(item.date, true),
      item.type === "income" ? "Pemasukan" : "Pengeluaran",
      categoryMap.get(item.categoryId) ?? "Tanpa kategori",
      walletMap.get(item.walletId) ?? "Tanpa dompet",
      item.amount,
      item.note ?? "",
    ]);

    const csv = [toCsvRow(header), ...rows.map((row) => toCsvRow(row))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `budgetin-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

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
        </div>
        <div className="md:hidden">
          <MobileAppBar title="Transaksi" />
        </div>

        <main className="page-shell space-y-6">
          <section className="space-y-2">
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Riwayat Transaksi</h1>
            <p className="text-sm text-[var(--text-dimmed)]">
              Pantau transaksi harian, bulanan, atau rentang tanggal khusus dengan filter dompet yang konsisten.
            </p>
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <aside className="space-y-4 lg:col-span-4">
              <section className="glass-panel space-y-4 p-4">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    className={`rounded-lg py-2 text-sm font-semibold ${
                      filter.period === "daily"
                        ? "bg-[var(--bg-card-muted)] text-[var(--text-primary)]"
                        : "text-[var(--text-dimmed)]"
                    }`}
                    onClick={() => filter.setPeriod("daily")}
                  >
                    Harian
                  </button>
                  <button
                    type="button"
                    className={`rounded-lg py-2 text-sm font-semibold ${
                      filter.period === "monthly"
                        ? "bg-[var(--bg-card-muted)] text-[var(--text-primary)]"
                        : "text-[var(--text-dimmed)]"
                    }`}
                    onClick={() => filter.setPeriod("monthly")}
                  >
                    Bulanan
                  </button>
                  <button
                    type="button"
                    className={`rounded-lg py-2 text-sm font-semibold ${
                      filter.period === "range"
                        ? "bg-[var(--bg-card-muted)] text-[var(--text-primary)]"
                        : "text-[var(--text-dimmed)]"
                    }`}
                    onClick={() => filter.setPeriod("range")}
                  >
                    Rentang
                  </button>
                </div>

                {filter.period === "monthly" ? (
                  <div className="flex items-center justify-between rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2">
                    <button
                      type="button"
                      className="rounded-lg p-2 text-[var(--text-dimmed)] hover:text-[var(--text-primary)]"
                      onClick={filter.goPrevMonth}
                    >
                      {"<"}
                    </button>
                    <span className="text-sm font-semibold text-[var(--text-primary)]">{filter.monthLabel}</span>
                    <button
                      type="button"
                      className="rounded-lg p-2 text-[var(--text-dimmed)] hover:text-[var(--text-primary)] disabled:opacity-40"
                      onClick={filter.goNextMonth}
                      disabled={!filter.canGoNext}
                    >
                      {">"}
                    </button>
                  </div>
                ) : null}

                {filter.period === "range" ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1 text-sm text-[var(--text-dimmed)]">
                      Dari tanggal
                      <input
                        type="date"
                        value={filter.fromDate}
                        onChange={(event) => filter.setFromDate(event.target.value)}
                        className="w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-muted)] px-3 py-2 text-[var(--text-primary)]"
                      />
                    </label>
                    <label className="space-y-1 text-sm text-[var(--text-dimmed)]">
                      Sampai tanggal
                      <input
                        type="date"
                        value={filter.toDate}
                        onChange={(event) => filter.setToDate(event.target.value)}
                        className="w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-muted)] px-3 py-2 text-[var(--text-primary)]"
                      />
                    </label>
                  </div>
                ) : null}
              </section>

              <section className="glass-panel space-y-3 p-4">
                <p className="text-sm font-semibold text-[var(--text-primary)]">Filter Dompet</p>
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
                <p className="text-xs text-[var(--text-dimmed)]">
                  {walletFilter.selectedWalletIds.length === 0
                    ? "Menampilkan semua transaksi dari semua dompet."
                    : "Filter berlaku untuk semua transaksi di halaman ini."}
                </p>
              </section>
            </aside>

            <section className="space-y-6 lg:col-span-8">
              <section className="glass-panel space-y-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-dimmed)]">Ringkasan</p>
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">Total Transaksi</h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button onClick={() => setShowTransactionModal(true)} disabled={formDisabled}>
                      Catat Transaksi
                    </Button>
                    <Button variant="outline" onClick={exportCsv} disabled={filter.filteredTransactions.length === 0}>
                      Ekspor CSV
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-[var(--text-dimmed)]">
                  <span>Periode: {periodLabel}</span>
                  <span>{filter.filteredTransactions.length} transaksi</span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <StatCard
                    title="Pemasukan"
                    value={formatCurrency(totals.income)}
                    helper="Total transaksi pemasukan"
                    accent="emerald"
                  />
                  <StatCard
                    title="Pengeluaran"
                    value={formatCurrency(totals.expense)}
                    helper="Total transaksi pengeluaran"
                    accent="rose"
                  />
                </div>
              </section>

              <TransactionList
                title="Daftar Transaksi"
                subtitle={`${filter.filteredTransactions.length} transaksi`}
                emptyMessage="Tidak ada transaksi pada periode ini."
                transactions={filter.filteredTransactions}
                categories={categories}
                wallets={wallets}
                disabled={syncLoading}
              />
            </section>
          </div>
        </main>

        <WalletFilterModal
          open={walletFilter.open}
          wallets={wallets}
          draftWalletIds={walletFilter.draftWalletIds}
          onToggle={walletFilter.toggleWallet}
          onApply={walletFilter.applyFilter}
          onClose={walletFilter.closeFilter}
        />

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

        <div className="md:hidden">
          <MobileBottomNav />
        </div>
      </div>
    </AuthGate>
  );
}
