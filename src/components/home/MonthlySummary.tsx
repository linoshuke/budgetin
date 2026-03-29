"use client";

import Skeleton from "@/components/ui/Skeleton";
import { useMonthlySummary } from "@/hooks/useTransactions";
import { useWalletStore } from "@/stores/walletStore";
import { formatCurrency } from "@/utils/format";

export default function MonthlySummary() {
  const selectedWalletIds = useWalletStore((state) => state.selectedWalletIds);
  const summary = useMonthlySummary(selectedWalletIds);

  if (summary.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[120px] w-full rounded-xl" />
        <Skeleton className="h-[120px] w-full rounded-xl" />
      </div>
    );
  }

  const income = summary.data?.total_income ?? 0;
  const expense = summary.data?.total_expense ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between rounded-xl bg-surface-container-low p-6 transition-all hover:bg-surface-container">
        <div className="flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <span className="material-symbols-outlined text-primary" data-icon="arrow_downward">
              arrow_downward
            </span>
          </div>
          <span className="rounded bg-primary/5 px-2 py-1 text-[10px] font-bold uppercase text-primary">Stabil</span>
        </div>
        <div className="mt-4">
          <div className="text-xs font-medium text-on-surface-variant">Pemasukan Bulan Ini</div>
          <div className="tnum mt-1 text-2xl font-bold text-on-surface">{formatCurrency(income)}</div>
        </div>
      </div>
      <div className="flex flex-col justify-between rounded-xl bg-surface-container-low p-6 transition-all hover:bg-surface-container">
        <div className="flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-error/10">
            <span className="material-symbols-outlined text-error" data-icon="arrow_upward">
              arrow_upward
            </span>
          </div>
          <span className="rounded bg-error/5 px-2 py-1 text-[10px] font-bold uppercase text-error">+4% vs prev</span>
        </div>
        <div className="mt-4">
          <div className="text-xs font-medium text-on-surface-variant">Pengeluaran Bulan Ini</div>
          <div className="tnum mt-1 text-2xl font-bold text-on-surface">{formatCurrency(expense)}</div>
        </div>
      </div>
    </div>
  );
}
