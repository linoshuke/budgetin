"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AuthGate from "@/components/shared/AuthGate";
import MainHeader from "@/components/navigation/MainHeader";
import Sidebar from "@/components/navigation/Sidebar";
import BottomNav from "@/components/navigation/BottomNav";
import WalletFilterModal from "@/components/shared/WalletFilterModal";
import Modal from "@/components/shared/Modal";
import TransactionForm from "@/components/shared/TransactionForm";
import { useTransactionsFilter } from "@/hooks/useTransactionsFilter";
import { useWalletFilter } from "@/hooks/useWalletFilter";
import { budgetActions, useBudgetStore } from "@/store/budgetStore";
import { useUIStore } from "@/stores/uiStore";
import { useAppSettingsStore } from "@/stores/appSettingsStore";
import { calculateTotals } from "@/lib/budget";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Transaction } from "@/types/transaction";
import { TRANSACTIONS_CHANGED_EVENT } from "@/lib/transaction-events";

const pageSize = 50;

type ActivityTab = "all" | "pending" | "scheduled";

function isSameDay(date: Date, compare: Date) {
  return (
    date.getFullYear() === compare.getFullYear() &&
    date.getMonth() === compare.getMonth() &&
    date.getDate() === compare.getDate()
  );
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function resolveIcon(type: Transaction["type"]) {
  return type === "income" ? "payments" : "local_cafe";
}

function resolveActivityStatus(transaction: Transaction): ActivityTab {
  const note = (transaction.note ?? "").toLowerCase();
  if (note.includes("#pending")) return "pending";
  if (note.includes("#scheduled")) return "scheduled";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const txDate = new Date(transaction.date);
  txDate.setHours(0, 0, 0, 0);

  if (txDate > today) return "scheduled";
  if (isSameDay(txDate, today)) return "pending";
  return "all";
}

export default function TransactionsPage() {
  const categories = useBudgetStore((state) => state.categories);
  const wallets = useBudgetStore((state) => state.wallets);
  const loading = useBudgetStore((state) => state.loading);
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);
  const defaultPeriod = useAppSettingsStore((state) => state.defaultPeriod);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pageOffset, setPageOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingPage, setLoadingPage] = useState(false);
  const [loadError, setLoadError] = useState("");
  const loadingRef = useRef(false);

  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [savingTransaction, setSavingTransaction] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [activeActivityTab, setActiveActivityTab] = useState<ActivityTab>("all");
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  const walletFilter = useWalletFilter();
  const filter = useTransactionsFilter(transactions, walletFilter.selectedWalletIds, defaultPeriod);

  const buildDateRange = useCallback(() => {
    if (filter.period === "daily") {
      const today = new Date().toISOString().slice(0, 10);
      return { dateFrom: today, dateTo: today };
    }

    if (filter.period === "monthly") {
      const year = filter.selectedMonth.getFullYear();
      const month = filter.selectedMonth.getMonth();
      const start = new Date(year, month, 1).toISOString().slice(0, 10);
      const end = new Date(year, month + 1, 0).toISOString().slice(0, 10);
      return { dateFrom: start, dateTo: end };
    }

    return { dateFrom: filter.fromDate, dateTo: filter.toDate };
  }, [filter.fromDate, filter.period, filter.selectedMonth, filter.toDate]);

  const fetchPage = useCallback(
    async (offset: number, reset = false) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoadingPage(true);
      setLoadError("");

      try {
        const params = new URLSearchParams({
          limit: String(pageSize),
          offset: String(offset),
        });
        const { dateFrom, dateTo } = buildDateRange();
        if (dateFrom) params.set("dateFrom", dateFrom);
        if (dateTo) params.set("dateTo", dateTo);
        if (walletFilter.selectedWalletIds.length) {
          params.set("walletIds", walletFilter.selectedWalletIds.join(","));
        }
        if (selectedCategoryIds.length) {
          params.set("categoryIds", selectedCategoryIds.join(","));
        }

        const response = await fetch(`/api/transactions?${params.toString()}`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = (await response.json()) as {
          items: Transaction[];
          hasMore: boolean;
          nextOffset: number | null;
        };

        const items = payload.items ?? [];
        setTransactions((prev) => (reset ? items : [...prev, ...items]));
        setHasMore(Boolean(payload.hasMore));
        if (payload.nextOffset !== null) {
          setPageOffset(payload.nextOffset);
        } else {
          setPageOffset(reset ? items.length : offset + items.length);
        }
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Gagal memuat transaksi.");
      } finally {
        loadingRef.current = false;
        setLoadingPage(false);
      }
    },
    [buildDateRange, selectedCategoryIds, walletFilter.selectedWalletIds],
  );

  const refreshTransactions = useCallback(() => {
    setTransactions([]);
    setPageOffset(0);
    setHasMore(true);
    void fetchPage(0, true);
  }, [fetchPage]);

  useEffect(() => {
    refreshTransactions();
  }, [
    refreshTransactions,
    filter.period,
    filter.selectedMonth,
    filter.fromDate,
    filter.toDate,
    walletFilter.selectedWalletIds.join("|"),
    selectedCategoryIds.join("|"),
  ]);

  useEffect(() => {
    const handleChanged = () => refreshTransactions();
    window.addEventListener(TRANSACTIONS_CHANGED_EVENT, handleChanged);
    return () => window.removeEventListener(TRANSACTIONS_CHANGED_EVENT, handleChanged);
  }, [refreshTransactions]);

  const categoryMap = useMemo(
    () => new Map(categories.map((item) => [item.id, item])),
    [categories],
  );
  const walletMap = useMemo(
    () => new Map(wallets.map((item) => [item.id, item.name])),
    [wallets],
  );

  const totals = useMemo(
    () => calculateTotals(filter.filteredTransactions),
    [filter.filteredTransactions],
  );

  const spendingTrend = useMemo(() => {
    const trendMonth = filter.period === "monthly" ? filter.selectedMonth : new Date();
    const monthStart = new Date(trendMonth.getFullYear(), trendMonth.getMonth(), 1);
    const nextMonthStart = new Date(trendMonth.getFullYear(), trendMonth.getMonth() + 1, 1);
    const prevMonthStart = new Date(trendMonth.getFullYear(), trendMonth.getMonth() - 1, 1);

    const walletSet = new Set(walletFilter.selectedWalletIds);
    const categorySet = new Set(selectedCategoryIds);

    let currentExpense = 0;
    let previousExpense = 0;

    transactions.forEach((item) => {
      if (walletSet.size && !walletSet.has(item.walletId)) return;
      if (categorySet.size && !categorySet.has(item.categoryId)) return;

      const date = new Date(item.date);
      if (date >= monthStart && date < nextMonthStart) {
        if (item.type === "expense") currentExpense += item.amount;
        return;
      }
      if (date >= prevMonthStart && date < monthStart) {
        if (item.type === "expense") previousExpense += item.amount;
      }
    });

    const delta = currentExpense - previousExpense;
    const percent =
      previousExpense === 0
        ? currentExpense === 0
          ? 0
          : 100
        : (delta / Math.abs(previousExpense)) * 100;

    return {
      percent,
      increase: delta > 0,
      label: `${percent >= 0 ? "+" : ""}${percent.toFixed(1)}% vs bulan lalu`,
    };
  }, [filter.period, filter.selectedMonth, selectedCategoryIds, transactions, walletFilter.selectedWalletIds]);

  const largestExpense = useMemo(() => {
    const expenseItems = filter.filteredTransactions.filter((item) => item.type === "expense");
    if (!expenseItems.length) return null;
    return expenseItems.reduce((max, item) => (item.amount > max.amount ? item : max), expenseItems[0]);
  }, [filter.filteredTransactions]);

  const searchKey = searchQuery.trim().toLowerCase();
  const visibleTransactions = useMemo(() => {
    let items = filter.filteredTransactions;

    if (activeActivityTab !== "all") {
      items = items.filter((item) => resolveActivityStatus(item) === activeActivityTab);
    }

    if (selectedCategoryIds.length > 0) {
      items = items.filter((item) => selectedCategoryIds.includes(item.categoryId));
    }

    if (!searchKey) return items;

    return items.filter((item) => {
      const categoryName = categoryMap.get(item.categoryId)?.name ?? "";
      const walletName = walletMap.get(item.walletId) ?? "";
      const note = item.note ?? "";
      return [categoryName, walletName, note].some((field) => field.toLowerCase().includes(searchKey));
    });
  }, [
    activeActivityTab,
    categoryMap,
    filter.filteredTransactions,
    searchKey,
    selectedCategoryIds,
    walletMap,
  ]);

  const pagedTransactions = visibleTransactions;

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const handleSubmit = async (payload: Omit<Transaction, "id">) => {
    try {
      setSavingTransaction(true);
      if (editingTransaction) {
        await budgetActions.updateTransaction(editingTransaction.id, payload);
      } else {
        await budgetActions.addTransaction(payload);
      }
      setShowTransactionModal(false);
      setEditingTransaction(null);
    } catch (err) {
      console.error("Gagal menyimpan transaksi:", err);
    } finally {
      setSavingTransaction(false);
    }
  };

  const formDisabled = loading || savingTransaction;

  return (
    <AuthGate>
      <div className="min-h-screen bg-surface text-on-surface">
        <Sidebar />
        <main className={sidebarCollapsed ? "min-h-screen lg:ml-20" : "min-h-screen lg:ml-64"}>
          <MainHeader
            title="Transactions"
            tabs={[
              { key: "all", label: "All Activity" },
              { key: "pending", label: "Pending" },
              { key: "scheduled", label: "Scheduled" },
            ]}
            activeTab={activeActivityTab}
            onTabChange={(key) => setActiveActivityTab(key as ActivityTab)}
          />

          <section className="flex flex-col gap-6 px-6 py-6 md:px-8">
            <div className="flex flex-col items-center gap-4 rounded-xl bg-surface-container-low p-4 md:flex-row md:justify-between">
              <div className="relative w-full md:w-96">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-500">
                  search
                </span>
                <input
                  className="w-full rounded-lg border-none bg-surface-container py-3 pl-12 pr-4 text-on-surface placeholder-slate-500 transition-all focus:bg-surface-container-high focus:ring-1 focus:ring-primary"
                  placeholder="Search transactions..."
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </div>
              <div className="flex w-full items-center gap-3 md:w-auto">
                <button
                  type="button"
                  onClick={() => setShowDateFilter((prev) => !prev)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-outline-variant/10 bg-surface-container px-4 py-3 text-on-surface transition-all hover:bg-surface-container-highest md:flex-none"
                >
                  <span className="material-symbols-outlined text-lg">calendar_today</span>
                  <span className="text-sm font-medium">Date</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCategoryFilter(true)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-outline-variant/10 bg-surface-container px-4 py-3 text-on-surface transition-all hover:bg-surface-container-highest md:flex-none"
                >
                  <span className="material-symbols-outlined text-lg">category</span>
                  <span className="text-sm font-medium">Category</span>
                </button>
                <button
                  type="button"
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-outline-variant/10 bg-surface-container px-4 py-3 text-on-surface transition-all hover:bg-surface-container-highest md:flex-none"
                >
                  <span className="material-symbols-outlined text-lg">filter_list</span>
                  <span className="text-sm font-medium">Amount</span>
                </button>
              </div>
            </div>

            {showDateFilter ? (
              <div className="space-y-4 rounded-xl bg-surface-container-low p-4">
                <div className="grid grid-cols-3 gap-2">
                  {(["daily", "monthly", "range"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      className={`rounded-lg py-2 text-sm font-semibold ${
                        filter.period === mode
                          ? "bg-surface-container-highest text-on-surface"
                          : "text-on-surface-variant"
                      }`}
                      onClick={() => filter.setPeriod(mode)}
                    >
                      {mode === "daily" ? "Harian" : mode === "monthly" ? "Bulanan" : "Rentang"}
                    </button>
                  ))}
                </div>

                {filter.period === "monthly" ? (
                  <div className="flex items-center justify-between rounded-xl border border-outline-variant/10 bg-surface-container px-3 py-2">
                    <button
                      type="button"
                      className="rounded-lg p-2 text-on-surface-variant hover:text-on-surface"
                      onClick={filter.goPrevMonth}
                    >
                      {"<"}
                    </button>
                    <span className="text-sm font-semibold text-on-surface">{filter.monthLabel}</span>
                    <button
                      type="button"
                      className="rounded-lg p-2 text-on-surface-variant hover:text-on-surface disabled:opacity-40"
                      onClick={filter.goNextMonth}
                      disabled={!filter.canGoNext}
                    >
                      {">"}
                    </button>
                  </div>
                ) : null}

                {filter.period === "range" ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1 text-sm text-on-surface-variant">
                      Dari tanggal
                      <input
                        type="date"
                        value={filter.fromDate}
                        onChange={(event) => filter.setFromDate(event.target.value)}
                        className="w-full rounded-lg border border-outline-variant/10 bg-surface-container px-3 py-2 text-on-surface"
                      />
                    </label>
                    <label className="space-y-1 text-sm text-on-surface-variant">
                      Sampai tanggal
                      <input
                        type="date"
                        value={filter.toDate}
                        onChange={(event) => filter.setToDate(event.target.value)}
                        className="w-full rounded-lg border border-outline-variant/10 bg-surface-container px-3 py-2 text-on-surface"
                      />
                    </label>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-xl border border-outline-variant/5 bg-surface-container p-6">
                <p className="mb-2 font-headline text-xs font-bold uppercase tracking-widest text-slate-500">
                  Monthly Spending
                </p>
                <div className="flex items-end justify-between">
                  <h2 className="tnum font-headline text-3xl font-extrabold text-on-surface">
                    {formatCurrency(totals.expense)}
                  </h2>
                  <span
                    className={`flex items-center gap-1 text-sm font-bold ${
                      spendingTrend.increase ? "text-error" : "text-primary"
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {spendingTrend.increase ? "trending_up" : "trending_down"}
                    </span>
                    {spendingTrend.label}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-outline-variant/5 bg-surface-container p-6">
                <p className="mb-2 font-headline text-xs font-bold uppercase tracking-widest text-slate-500">
                  Largest Expense
                </p>
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="tnum font-headline text-3xl font-extrabold text-on-surface">
                      {formatCurrency(largestExpense?.amount ?? 0)}
                    </h2>
                    <p className="text-sm text-slate-400">
                      {largestExpense ? categoryMap.get(largestExpense.categoryId)?.name ?? "Tanpa kategori" : "-"}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-3xl text-primary-container">home</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingTransaction(null);
                  setShowTransactionModal(true);
                }}
                className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border border-outline-variant/5 bg-surface-container-low p-6 transition-all hover:bg-surface-container-highest"
              >
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 transition-transform group-hover:scale-110">
                  <span className="material-symbols-outlined text-primary">add</span>
                </div>
                <p className="font-headline font-bold text-primary">New Transaction</p>
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-outline-variant/5 bg-surface-container-low">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-[#1a202a]/50 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <th className="px-8 py-5">Date</th>
                      <th className="px-6 py-5">Description</th>
                      <th className="px-6 py-5">Category</th>
                      <th className="px-6 py-5">Account</th>
                      <th className="px-6 py-5 text-right">Amount</th>
                      <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/5">
                        {pagedTransactions.map((transaction) => {
                          const category = categoryMap.get(transaction.categoryId);
                          const walletName = walletMap.get(transaction.walletId) ?? "Tanpa dompet";
                          const description = transaction.note || category?.name || "Transaksi";
                          const subtitle = transaction.note ? category?.name ?? "Tanpa kategori" : "Activity";
                          const iconName = resolveIcon(transaction.type);
                      const tone = transaction.type === "income" ? "primary" : "tertiary";
                      return (
                        <tr key={transaction.id} className="group cursor-default transition-all hover:bg-[#1a202a]">
                          <td className="px-8 py-6">
                            <div className="flex flex-col">
                              <span className="tnum font-semibold text-on-surface">
                                {formatDate(transaction.date, true)}
                              </span>
                              <span className="text-xs text-slate-500">{formatTime(transaction.date)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-6">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-highest text-primary">
                                  <span className="material-symbols-outlined icon-fill">
                                    {iconName}
                                  </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="font-medium text-on-surface">{description}</span>
                                <span className="text-xs text-slate-500">{subtitle}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-6">
                            <span
                              className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                                tone === "primary"
                                  ? "border-primary/30 bg-primary/20 text-primary-fixed"
                                  : "border-tertiary/20 bg-tertiary/5 text-tertiary"
                              }`}
                            >
                              {category?.name ?? "Uncategorized"}
                            </span>
                          </td>
                          <td className="px-6 py-6">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-sm text-slate-400">credit_card</span>
                              <span className="text-sm text-slate-400">{walletName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-6 text-right">
                            <span
                              className={`tnum font-bold ${
                                transaction.type === "income" ? "text-primary" : "text-on-surface"
                              }`}
                            >
                              {transaction.type === "income" ? "+" : "-"}
                              {formatCurrency(transaction.amount)}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                              <button
                                type="button"
                                className="p-2 text-slate-400 transition-colors hover:text-primary"
                                onClick={() => {
                                  setEditingTransaction(transaction);
                                  setShowTransactionModal(true);
                                }}
                              >
                                <span className="material-symbols-outlined text-lg">edit</span>
                              </button>
                              <button
                                type="button"
                                className="p-2 text-slate-400 transition-colors hover:text-error"
                                onClick={async () => {
                                  const confirmed = window.confirm("Hapus transaksi ini?");
                                  if (!confirmed) return;
                                  await budgetActions.deleteTransaction(transaction.id);
                                }}
                              >
                                <span className="material-symbols-outlined text-lg">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 py-4">
              <p className="text-sm font-medium text-slate-500">
                Menampilkan {pagedTransactions.length} transaksi
              </p>
              <div className="flex flex-wrap items-center gap-3">
                {loadError ? (
                  <span className="text-xs text-error">{loadError}</span>
                ) : null}
                {hasMore ? (
                  <button
                    type="button"
                    onClick={() => fetchPage(pageOffset, false)}
                    disabled={loadingPage}
                    className="rounded-lg border border-primary/20 px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary/10 disabled:opacity-60"
                  >
                    {loadingPage ? "Memuat..." : "Load More"}
                  </button>
                ) : (
                  <span className="text-xs text-on-surface-variant">Semua data sudah ditampilkan</span>
                )}
              </div>
            </div>
          </section>
        </main>
        <BottomNav />

        <WalletFilterModal
          open={walletFilter.open}
          wallets={wallets}
          draftWalletIds={walletFilter.draftWalletIds}
          onToggle={walletFilter.toggleWallet}
          onApply={walletFilter.applyFilter}
          onClose={walletFilter.closeFilter}
        />

        <Modal
          open={showCategoryFilter}
          title="Filter Kategori"
          onClose={() => setShowCategoryFilter(false)}
          sizeClassName="max-w-lg"
        >
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-dimmed)]">
              Pilih kategori yang ingin ditampilkan. Kosongkan pilihan untuk menampilkan semua kategori.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {categories.map((category) => {
                const checked = selectedCategoryIds.includes(category.id);
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryIds((prev) =>
                        checked ? prev.filter((id) => id !== category.id) : [...prev, category.id],
                      );
                    }}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors ${
                      checked
                        ? "border-primary/30 bg-primary/10 text-on-surface"
                        : "border-outline-variant/10 bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                    }`}
                  >
                    <span>{category.name}</span>
                    <span className="material-symbols-outlined text-base">
                      {checked ? "check_circle" : "radio_button_unchecked"}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategoryIds([])}
                className="rounded-lg border border-outline-variant/20 px-3 py-2 text-sm text-on-surface-variant hover:text-on-surface"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setShowCategoryFilter(false)}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary"
              >
                Terapkan
              </button>
            </div>
          </div>
        </Modal>

        <Modal
          open={showTransactionModal}
          title={editingTransaction ? "Edit Transaksi" : "Catat Transaksi"}
          onClose={() => {
            setShowTransactionModal(false);
            setEditingTransaction(null);
          }}
          sizeClassName="max-w-4xl"
        >
          <TransactionForm
            key={editingTransaction?.id ?? (showTransactionModal ? "transaction-modal" : "transaction-hidden")}
            categories={categories}
            wallets={wallets}
            onSubmit={handleSubmit}
            onCreateWallet={(payload) => budgetActions.addWallet(payload)}
            submitLabel={editingTransaction ? "Simpan Perubahan" : "Simpan Transaksi"}
            onCancel={() => {
              setShowTransactionModal(false);
              setEditingTransaction(null);
            }}
            disabled={formDisabled}
            initialValue={editingTransaction ?? undefined}
          />
        </Modal>
      </div>
    </AuthGate>
  );
}
