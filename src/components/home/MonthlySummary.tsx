"use client";

import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";
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
    <div className="glass-panel space-y-4 p-5">
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">Ringkasan Bulan Ini</h3>
      <div className="grid gap-4 tablet:grid-cols-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
            <ArrowUpRight size={18} />
          </div>
          <div>
            <p className="text-xs text-[var(--text-dimmed)]">Pemasukan</p>
            <p className="text-base font-semibold text-emerald-300">{formatCurrency(income)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/15 text-rose-300">
            <ArrowDownRight size={18} />
          </div>
          <div>
            <p className="text-xs text-[var(--text-dimmed)]">Pengeluaran</p>
            <p className="text-base font-semibold text-rose-300">{formatCurrency(expense)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/15 text-sky-300">
            <Wallet size={18} />
          </div>
          <div>
            <p className="text-xs text-[var(--text-dimmed)]">Saldo Bersih</p>
            <p className="text-base font-semibold text-sky-300">{formatCurrency(balance)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
