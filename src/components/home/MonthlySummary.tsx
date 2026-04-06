"use client";

import Skeleton from "@/components/ui/Skeleton";
import { useMonthlySummary } from "@/hooks/useTransactions";
import { useWalletStore } from "@/stores/walletStore";
import { useTransactionStore } from "@/stores/transactionStore";
import { useI18n } from "@/hooks/useI18n";
import SensitiveCurrency from "@/components/shared/SensitiveCurrency";

function calculateChange(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
}

export default function MonthlySummary() {
  const { t } = useI18n();
  const selectedWalletIds = useWalletStore((state) => state.selectedWalletIds);
  const { currentMonth } = useTransactionStore();
  const summary = useMonthlySummary(selectedWalletIds);
  const prevMonth =
    currentMonth.month === 1
      ? { year: currentMonth.year - 1, month: 12 }
      : { year: currentMonth.year, month: currentMonth.month - 1 };
  const prevSummary = useMonthlySummary(selectedWalletIds, prevMonth);

  if (summary.isLoading || prevSummary.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[120px] w-full rounded-xl" />
        <Skeleton className="h-[120px] w-full rounded-xl" />
      </div>
    );
  }

  const income = summary.data?.total_income ?? 0;
  const expense = summary.data?.total_expense ?? 0;
  const prevIncome = prevSummary.data?.total_income ?? 0;
  const prevExpense = prevSummary.data?.total_expense ?? 0;
  const incomeDelta = calculateChange(income, prevIncome);
  const expenseDelta = calculateChange(expense, prevExpense);
  const incomeTone = incomeDelta >= 0 ? "primary" : "error";
  const expenseTone = expenseDelta >= 0 ? "error" : "primary";
  const incomeLabel = `${incomeDelta >= 0 ? "+" : ""}${incomeDelta.toFixed(1)}% ${t("home.vsLastMonth")}`;
  const expenseLabel = `${expenseDelta >= 0 ? "+" : ""}${expenseDelta.toFixed(1)}% ${t("home.vsLastMonth")}`;
  const incomeIcon = incomeDelta >= 0 ? "arrow_upward" : "arrow_downward";
  const expenseIcon = expenseDelta >= 0 ? "arrow_upward" : "arrow_downward";

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between rounded-xl bg-surface-container-low p-6 transition-all hover:bg-surface-container">
        <div className="flex items-start justify-between">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${incomeTone === "primary" ? "bg-primary/10" : "bg-error/10"}`}>
            <span
              className={`material-symbols-outlined ${incomeTone === "primary" ? "text-primary" : "text-error"}`}
              data-icon={incomeIcon}
            >
              {incomeIcon}
            </span>
          </div>
          <span
            className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${
              incomeTone === "primary" ? "bg-primary/5 text-primary" : "bg-error/5 text-error"
            }`}
          >
            {incomeLabel}
          </span>
        </div>
        <div className="mt-4">
          <div className="text-xs font-medium text-on-surface-variant">{t("home.incomeThisMonth")}</div>
          <div className="mt-1 text-2xl font-bold text-on-surface">
            <SensitiveCurrency value={income} eyeClassName="h-7 w-7 border-outline-variant/20 bg-surface-container-low/30 hover:bg-surface-container" />
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-between rounded-xl bg-surface-container-low p-6 transition-all hover:bg-surface-container">
        <div className="flex items-start justify-between">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${expenseTone === "error" ? "bg-error/10" : "bg-primary/10"}`}>
            <span
              className={`material-symbols-outlined ${expenseTone === "error" ? "text-error" : "text-primary"}`}
              data-icon={expenseIcon}
            >
              {expenseIcon}
            </span>
          </div>
          <span
            className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${
              expenseTone === "error" ? "bg-error/5 text-error" : "bg-primary/5 text-primary"
            }`}
          >
            {expenseLabel}
          </span>
        </div>
        <div className="mt-4">
          <div className="text-xs font-medium text-on-surface-variant">{t("home.expenseThisMonth")}</div>
          <div className="mt-1 text-2xl font-bold text-on-surface">
            <SensitiveCurrency value={expense} eyeClassName="h-7 w-7 border-outline-variant/20 bg-surface-container-low/30 hover:bg-surface-container" />
          </div>
        </div>
      </div>
    </div>
  );
}
