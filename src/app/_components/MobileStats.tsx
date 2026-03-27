"use client";

import MobileAppBar from "@/app/_components/MobileAppBar";
import LockWidget from "@/app/_components/LockWidget";
import { monthKey } from "@/lib/utils";
import { useBudgetStore } from "@/store/budgetStore";
import type { Transaction } from "@/types/transaction";
import { useEffect, useMemo, useRef, useState } from "react";

type DailyStat = { day: number; income: number; expense: number };

function buildDailyStats(dates: Date, transactions: Transaction[], walletId: string) {
  const targetMonth = monthKey(dates);
  const map = new Map<number, DailyStat>();

  transactions.forEach((tx) => {
    if (tx.walletId !== walletId) return;
    if (monthKey(tx.date) !== targetMonth) return;
    const day = new Date(tx.date).getDate();
    const record = map.get(day) ?? { day, income: 0, expense: 0 };
    if (tx.type === "income") record.income += tx.amount;
    else record.expense += tx.amount;
    map.set(day, record);
  });

  return [...map.values()].sort((a, b) => a.day - b.day);
}

export default function MobileStats() {
  const isAuthenticated = useBudgetStore((state) => state.isAuthenticated);
  const wallets = useBudgetStore((state) => state.wallets);
  const transactions = useBudgetStore((state) => state.transactions);

  const [activeIndex, setActiveIndex] = useState(0);
  const [tooltip, setTooltip] = useState<{
    walletId: string;
    day: number;
    income: number;
    expense: number;
  } | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onScroll = () => {
      const width = track.clientWidth || 1;
      const idx = Math.round(track.scrollLeft / width);
      setActiveIndex(Math.min(Math.max(idx, 0), wallets.length - 1));
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, [wallets.length]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <MobileAppBar title="Statistik" />
        <LockWidget />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <MobileAppBar title="Statistik Bulanan" />

      <div className="px-4 pb-24 pt-4">
        {wallets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border-soft)] p-6 text-center text-sm text-[var(--text-dimmed)]">
            Belum ada dompet untuk ditampilkan.
          </div>
        ) : (
          <>
            <div
              ref={trackRef}
              className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto"
            >
              {wallets.map((wallet) => {
                const dailyStats = buildDailyStats(new Date(), transactions, wallet.id);
                const maxValue = dailyStats.reduce(
                  (max, row) => Math.max(max, row.income, row.expense),
                  0,
                );
                return (
                  <div key={wallet.id} className="w-full snap-center shrink-0">
                    <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4 shadow-sm">
                      <div className="space-y-1">
                        <h2 className="text-xl font-bold text-[var(--text-primary)]">{wallet.name}</h2>
                        <p className="text-xs text-[var(--text-dimmed)]">Ringkasan transaksi bulan ini</p>
                      </div>

                      <div className="mt-4 flex items-center gap-4 text-xs text-[var(--text-dimmed)]">
                        <span className="inline-flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-400" />
                          Pemasukan
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-rose-400" />
                          Pengeluaran
                        </span>
                      </div>

                      {dailyStats.length === 0 ? (
                        <div className="flex h-40 flex-col items-center justify-center gap-2 text-sm text-[var(--text-dimmed)]">
                          <svg viewBox="0 0 24 24" width={32} height={32} aria-hidden="true">
                            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
                            <path d="M8 12h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                          </svg>
                          Belum ada transaksi bulan ini.
                        </div>
                      ) : (
                        <div className="mt-6 h-40 overflow-x-auto">
                          <div className="flex h-full items-end gap-2">
                            {dailyStats.map((row) => {
                              const incomeHeight = maxValue ? (row.income / maxValue) * 100 : 0;
                              const expenseHeight = maxValue ? (row.expense / maxValue) * 100 : 0;
                              return (
                                <button
                                  key={row.day}
                                  type="button"
                                  className="flex flex-col items-center gap-1"
                                  onClick={() =>
                                    setTooltip((prev) =>
                                      prev && prev.walletId === wallet.id && prev.day === row.day
                                        ? null
                                        : {
                                            walletId: wallet.id,
                                            day: row.day,
                                            income: row.income,
                                            expense: row.expense,
                                          },
                                    )
                                  }
                                >
                                  <div className="flex h-28 items-end gap-1">
                                    <div
                                      className="w-2 rounded-full bg-emerald-400"
                                      style={{ height: `${Math.max(incomeHeight, 4)}%` }}
                                    />
                                    <div
                                      className="w-2 rounded-full bg-rose-400"
                                      style={{ height: `${Math.max(expenseHeight, 4)}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] text-[var(--text-dimmed)]">{row.day}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {tooltip && tooltip.walletId === wallet.id ? (
                        <div className="mt-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-muted)] px-3 py-2 text-xs text-[var(--text-primary)]">
                          <p className="font-semibold">Hari {tooltip.day}</p>
                          <p className="text-emerald-400">Pemasukan: {tooltip.income.toLocaleString("id-ID")}</p>
                          <p className="text-rose-400">Pengeluaran: {tooltip.expense.toLocaleString("id-ID")}</p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-center gap-2">
              {wallets.map((wallet, index) => (
                <div
                  key={wallet.id}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === activeIndex ? "w-6 bg-indigo-500" : "w-2 bg-[var(--border-soft)]"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
