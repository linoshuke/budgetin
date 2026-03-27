"use client";

import Skeleton from "@/components/ui/Skeleton";
import { useMonthlySummary } from "@/hooks/useTransactions";
import { useWalletStore } from "@/stores/walletStore";
import { formatCurrency } from "@/utils/format";

export default function MonthlySummary() {
  const selectedWalletIds = useWalletStore((state) => state.selectedWalletIds);
  const summary = useMonthlySummary(selectedWalletIds);

  if (summary.isLoading) {
    return <Skeleton className="h-[140px] w-full" />;
  }

  const income = summary.data?.total_income ?? 0;
  const expense = summary.data?.total_expense ?? 0;
  const balance = income - expense;

  return (
    <div className="glass-panel grid gap-4 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[var(--text-dimmed)]">Pemasukan</p>
          <p className="text-lg font-semibold text-emerald-300">{formatCurrency(income)}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-dimmed)]">Pengeluaran</p>
          <p className="text-lg font-semibold text-rose-300">{formatCurrency(expense)}</p>
        </div>
      </div>
      <div className="border-t border-white/10 pt-3">
        <p className="text-xs text-[var(--text-dimmed)]">Saldo Bersih</p>
        <p className="text-xl font-semibold text-sky-300">{formatCurrency(balance)}</p>
      </div>
    </div>
  );
}
