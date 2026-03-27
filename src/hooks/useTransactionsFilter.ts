import { useMemo, useState } from "react";
import {
  filterTransactionsByDateRange,
  filterTransactionsByMonth,
  sortTransactionsByDate,
} from "@/lib/budget";
import { getMonthLabel, monthKey } from "@/lib/utils";
import type { Transaction } from "@/types/transaction";

export type PeriodMode = "daily" | "monthly" | "range";

function isSameDate(date: string, compare: Date) {
  const d = new Date(date);
  return (
    d.getFullYear() === compare.getFullYear() &&
    d.getMonth() === compare.getMonth() &&
    d.getDate() === compare.getDate()
  );
}

export function useTransactionsFilter(
  transactions: Transaction[],
  walletIds: string[] = [],
  initialPeriod: PeriodMode = "daily",
) {
  const [period, setPeriod] = useState<PeriodMode>(initialPeriod);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filteredTransactions = useMemo(() => {
    let items = transactions;
    if (walletIds.length > 0) {
      items = items.filter((item) => walletIds.includes(item.walletId));
    }

    if (period === "daily") {
      const today = new Date();
      return items.filter((item) => isSameDate(item.date, today));
    }

    if (period === "monthly") {
      const key = monthKey(selectedMonth);
      return filterTransactionsByMonth(items, key);
    }

    return filterTransactionsByDateRange(items, fromDate, toDate);
  }, [transactions, walletIds, period, selectedMonth, fromDate, toDate]);

  const sortedTransactions = useMemo(
    () => sortTransactionsByDate(filteredTransactions),
    [filteredTransactions],
  );

  const monthLabel = getMonthLabel(monthKey(selectedMonth));
  const nextMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1);
  const now = new Date();
  const canGoNext =
    nextMonth.getFullYear() < now.getFullYear() ||
    (nextMonth.getFullYear() === now.getFullYear() && nextMonth.getMonth() <= now.getMonth());

  const goPrevMonth = () =>
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1));

  const goNextMonth = () => {
    if (!canGoNext) return;
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1));
  };

  return {
    period,
    setPeriod,
    selectedMonth,
    setSelectedMonth,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    monthLabel,
    canGoNext,
    goPrevMonth,
    goNextMonth,
    filteredTransactions: sortedTransactions,
  };
}
