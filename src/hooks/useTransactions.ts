import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTransactionStore, type DateRange } from "@/stores/transactionStore";
import { useWalletStore } from "@/stores/walletStore";
import type { MonthlySummary, Transaction } from "@/types";
import { guestTransactions } from "@/utils/sample-data";
import { getMonthRange } from "@/utils/date";

interface TransactionQueryOptions {
  walletId?: string;
  dateRange?: DateRange;
  month?: { year: number; month: number };
}

export function useTransactions(options: TransactionQueryOptions = {}) {
  const { user, isGuest } = useAuth();
  const queryClient = useQueryClient();
  const { dateRange, currentMonth, setTransactions } = useTransactionStore();
  const selectedWalletIds = useWalletStore((state) => state.selectedWalletIds);

  const range = options.dateRange ?? dateRange;
  const month = options.month ?? currentMonth;
  const walletIds = options.walletId ? [options.walletId] : selectedWalletIds;

  const query = useQuery({
    queryKey: ["transactions", options.walletId ?? "all", range, month.year, month.month, user?.id ?? "guest"],
    queryFn: async () => {
      const { start, end } = getMonthRange(month.year, month.month);
      if (!user) {
        let data = guestTransactions;
        if (walletIds.length) {
          data = data.filter((item) => walletIds.includes(item.wallet_id));
        }
        data = data.filter((item) => item.date.slice(0, 10) >= start && item.date.slice(0, 10) <= end);
        return data;
      }

      let builder = supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (walletIds.length) {
        builder = builder.in("wallet_id", walletIds);
      }

      builder = builder.gte("date", start).lte("date", end);

      const { data, error } = await builder;
      if (error) throw error;
      return (data ?? []) as Transaction[];
    },
  });

  useEffect(() => {
    if (query.data) {
      setTransactions(query.data);
    }
  }, [query.data, setTransactions]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("transactions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions", filter: `user_id=eq.${user.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["transactions"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, user]);

  return {
    query,
    dateRange: range,
    currentMonth: month,
    walletIds,
    isGuest,
  };
}

export function useMonthlySummary(walletIds: string[] = []) {
  const { user } = useAuth();
  const { currentMonth } = useTransactionStore();
  const { start, end } = getMonthRange(currentMonth.year, currentMonth.month);

  return useQuery({
    queryKey: ["monthlySummary", user?.id ?? "guest", currentMonth.year, currentMonth.month, walletIds.join("-")],
    queryFn: async () => {
      if (!user) {
        const byWallet = guestTransactions
          .filter((item) => !walletIds.length || walletIds.includes(item.wallet_id))
          .filter((item) => item.date.slice(0, 10) >= start && item.date.slice(0, 10) <= end);
        const income = byWallet
          .filter((item) => item.type === "income")
          .reduce((acc, item) => acc + item.amount, 0);
        const expense = byWallet
          .filter((item) => item.type === "expense")
          .reduce((acc, item) => acc + item.amount, 0);
        return { total_income: income, total_expense: expense };
      }

      let builder = supabase
        .from("monthly_summary")
        .select("*")
        .eq("user_id", user.id)
        .eq("year", currentMonth.year)
        .eq("month", currentMonth.month);

      if (walletIds.length) {
        builder = builder.in("wallet_id", walletIds);
      }

      const { data, error } = await builder;
      if (error) throw error;

      const summary = (data ?? []) as MonthlySummary[];
      const totalIncome = summary.reduce((acc, item) => acc + Number(item.total_income ?? 0), 0);
      const totalExpense = summary.reduce((acc, item) => acc + Number(item.total_expense ?? 0), 0);

      return { total_income: totalIncome, total_expense: totalExpense };
    },
  });
}

export function useExpenseByCategory(walletIds: string[] = []) {
  const { user } = useAuth();
  const { currentMonth } = useTransactionStore();
  const { start, end } = getMonthRange(currentMonth.year, currentMonth.month);

  return useQuery({
    queryKey: ["expenseByCategory", user?.id ?? "guest", currentMonth.year, currentMonth.month, walletIds.join("-")],
    queryFn: async () => {
      if (!user) {
        const categories: Record<string, number> = {};
        guestTransactions
          .filter((item) => item.type === "expense")
          .filter((item) => item.date.slice(0, 10) >= start && item.date.slice(0, 10) <= end)
          .forEach((item) => {
            categories[item.description] = (categories[item.description] ?? 0) + item.amount;
          });
        return Object.entries(categories).map(([name, value]) => ({ name, value }));
      }

      let builder = supabase
        .from("transactions")
        .select("description, amount, type")
        .eq("user_id", user.id)
        .eq("type", "expense")
        .gte("date", start)
        .lte("date", end);

      if (walletIds.length) {
        builder = builder.in("wallet_id", walletIds);
      }

      const { data, error } = await builder;
      if (error) throw error;

      const totals: Record<string, number> = {};
      (data ?? []).forEach((item) => {
        const key = item.description || "Lainnya";
        totals[key] = (totals[key] ?? 0) + Number(item.amount ?? 0);
      });

      return Object.entries(totals).map(([name, value]) => ({ name, value }));
    },
  });
}
