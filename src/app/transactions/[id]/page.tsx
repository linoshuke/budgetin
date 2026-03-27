"use client";

import LockWidget from "@/app/_components/LockWidget";
import Modal from "@/components/shared/Modal";
import { filterTransactionsByMonth, sortTransactionsByDate } from "@/lib/budget";
import { formatCurrency, formatDate, getMonthLabel, monthKey } from "@/lib/utils";
import { budgetActions, useBudgetStore } from "@/store/budgetStore";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type PeriodMode = "daily" | "monthly";

function isSameDate(date: string, compare: Date) {
  const d = new Date(date);
  return (
    d.getFullYear() === compare.getFullYear() &&
    d.getMonth() === compare.getMonth() &&
    d.getDate() === compare.getDate()
  );
}

function formatAmountInput(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return new Intl.NumberFormat("id-ID").format(Number(digits));
}

export default function WalletDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string | string[] }>();
  const rawId = params?.id;
  const walletId = Array.isArray(rawId) ? rawId[0] : rawId;

  const isAuthenticated = useBudgetStore((state) => state.isAuthenticated);
  const wallets = useBudgetStore((state) => state.wallets);
  const transactions = useBudgetStore((state) => state.transactions);
  const categories = useBudgetStore((state) => state.categories);

  const wallet = wallets.find((item) => item.id === walletId);
  const [period, setPeriod] = useState<PeriodMode>("daily");
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [showAddModal, setShowAddModal] = useState(false);

  const [note, setNote] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [formError, setFormError] = useState("");

  const walletTransactions = useMemo(() => {
    if (!walletId) return [];
    const filtered = transactions.filter((item) => item.walletId === walletId);
    if (period === "daily") {
      return filtered.filter((item) => isSameDate(item.date, new Date()));
    }
    const key = monthKey(selectedMonth);
    return filterTransactionsByMonth(filtered, key);
  }, [transactions, walletId, period, selectedMonth]);

  const sortedTransactions = useMemo(
    () => sortTransactionsByDate(walletTransactions),
    [walletTransactions],
  );

  const balance = useMemo(() => {
    if (!walletId) return 0;
    return transactions
      .filter((item) => item.walletId === walletId)
      .reduce((total, item) => (item.type === "income" ? total + item.amount : total - item.amount), 0);
  }, [transactions, walletId]);

  const monthLabel = getMonthLabel(monthKey(selectedMonth));
  const nextMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1);
  const now = new Date();
  const canGoNext =
    nextMonth.getFullYear() < now.getFullYear() ||
    (nextMonth.getFullYear() === now.getFullYear() && nextMonth.getMonth() <= now.getMonth());

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <header className="flex items-center gap-2 px-4 py-3">
          <button type="button" className="text-sm text-[var(--text-dimmed)]" onClick={() => router.back()}>
            ← Kembali
          </button>
        </header>
        <LockWidget />
      </div>
    );
  }

  if (!wallet || !walletId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-lg font-semibold text-[var(--text-primary)]">Dompet tidak ditemukan.</p>
        <button
          type="button"
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
          onClick={() => router.back()}
        >
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 bg-transparent px-4 py-3">
        <button type="button" className="text-sm text-[var(--text-dimmed)]" onClick={() => router.back()}>
          ← Kembali
        </button>
      </header>

      <div className="space-y-4 px-4 pb-28">
        <div className="rounded-2xl bg-gradient-to-br from-blue-700 to-blue-900 p-5 text-white shadow-lg shadow-blue-900/30">
          <h1 className="text-lg font-semibold">{wallet.name}</h1>
          <p className="text-sm text-white/70">Total saldo</p>
          <p className="mt-1 text-[30px] font-bold" style={{ letterSpacing: "1.1px" }}>
            {formatCurrency(balance)}
          </p>

          <div className="mt-4 rounded-xl bg-white/10 p-1">
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                className={`rounded-lg py-2 text-sm font-semibold ${
                  period === "daily" ? "bg-white text-blue-700" : "text-white/70"
                }`}
                onClick={() => setPeriod("daily")}
              >
                Harian
              </button>
              <button
                type="button"
                className={`rounded-lg py-2 text-sm font-semibold ${
                  period === "monthly" ? "bg-white text-blue-700" : "text-white/70"
                }`}
                onClick={() => setPeriod("monthly")}
              >
                Bulanan
              </button>
            </div>
          </div>
        </div>

        {period === "monthly" ? (
          <div className="flex items-center justify-between rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2">
            <button
              type="button"
              className="rounded-lg p-2 text-[var(--text-dimmed)] hover:text-[var(--text-primary)]"
              onClick={() =>
                setSelectedMonth(
                  new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1),
                )
              }
            >
              ◀
            </button>
            <span className="text-sm font-semibold text-[var(--text-primary)]">{monthLabel}</span>
            <button
              type="button"
              className="rounded-lg p-2 text-[var(--text-dimmed)] hover:text-[var(--text-primary)] disabled:opacity-40"
              onClick={() =>
                canGoNext
                  ? setSelectedMonth(
                      new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1),
                    )
                  : null
              }
              disabled={!canGoNext}
            >
              ▶
            </button>
          </div>
        ) : null}

        <div className="flex items-center gap-2 text-[var(--text-primary)]">
          <span className="text-lg">🧾</span>
          <h2 className="text-lg font-semibold">Riwayat Transaksi</h2>
        </div>

        {sortedTransactions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border-soft)] p-6 text-center text-sm text-[var(--text-dimmed)]">
            Tidak ada transaksi pada periode ini.
          </div>
        ) : (
          <div className="space-y-3">
            {sortedTransactions.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {item.note?.trim() || "Transaksi"}
                    </p>
                    <p className="text-xs text-[var(--text-dimmed)]">{formatDate(item.date, true)}</p>
                  </div>
                  <div className={`text-sm font-semibold ${item.type === "income" ? "text-emerald-400" : "text-rose-400"}`}>
                    {item.type === "income" ? "+" : "-"}
                    {formatCurrency(item.amount)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        className="fixed bottom-[84px] right-4 z-30 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg"
        onClick={() => setShowAddModal(true)}
      >
        + Transaksi
      </button>

      <Modal open={showAddModal} title="Tambah Transaksi" onClose={() => setShowAddModal(false)} sizeClassName="max-w-md">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-[var(--text-dimmed)]">Deskripsi</label>
            <input
              className="w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-muted)] px-3 py-2 text-sm text-[var(--text-primary)]"
              placeholder="Contoh: Belanja, Gaji..."
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-[var(--text-dimmed)]">Jumlah</label>
            <input
              className="w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-muted)] px-3 py-2 text-sm text-[var(--text-primary)]"
              inputMode="numeric"
              placeholder="0"
              value={amountInput}
              onChange={(event) => setAmountInput(formatAmountInput(event.target.value))}
            />
          </div>
          <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-1">
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                className={`rounded-lg py-2 text-sm font-semibold ${
                  type === "expense" ? "bg-[var(--bg-card-muted)] text-[var(--text-primary)]" : "text-[var(--text-dimmed)]"
                }`}
                onClick={() => setType("expense")}
              >
                Pengeluaran
              </button>
              <button
                type="button"
                className={`rounded-lg py-2 text-sm font-semibold ${
                  type === "income" ? "bg-[var(--bg-card-muted)] text-[var(--text-primary)]" : "text-[var(--text-dimmed)]"
                }`}
                onClick={() => setType("income")}
              >
                Pemasukan
              </button>
            </div>
          </div>

          {formError ? <p className="text-xs text-rose-400">{formError}</p> : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
              onClick={async () => {
                const rawAmount = Number(amountInput.replace(/\D/g, ""));
                if (!rawAmount) {
                  setFormError("Jumlah wajib diisi.");
                  return;
                }
                const category = categories.find(
                  (item) => item.type === type || item.type === "both",
                );
                if (!category) {
                  setFormError("Kategori belum tersedia.");
                  return;
                }
                setFormError("");
                await budgetActions.addTransaction({
                  type,
                  amount: rawAmount,
                  categoryId: category.id,
                  walletId: wallet.id,
                  date: new Date().toISOString(),
                  note: note.trim(),
                });
                setAmountInput("");
                setNote("");
                setShowAddModal(false);
              }}
            >
              Simpan
            </button>
            <button
              type="button"
              className="rounded-lg border border-[var(--border-soft)] px-4 py-2 text-sm text-[var(--text-dimmed)]"
              onClick={() => setShowAddModal(false)}
            >
              Batal
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
