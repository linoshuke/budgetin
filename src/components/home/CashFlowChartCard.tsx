"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useWalletStore } from "@/stores/walletStore";
import type { MonthlySummary } from "@/types";

const MIN_Y = 6;
const MAX_Y = 34;

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function buildMonths(count: number) {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("id-ID", { month: "short" });
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (count - 1 - index), 1);
    return {
      key: monthKey(date),
      label: formatter.format(date),
    };
  });
}

function buildLinePath(values: number[], maxValue: number) {
  if (!values.length) return "";
  const range = MAX_Y - MIN_Y;
  const denom = maxValue || 1;
  const step = values.length > 1 ? 100 / (values.length - 1) : 0;
  return values
    .map((value, index) => {
      const x = step * index;
      const y = MAX_Y - (Math.max(value, 0) / denom) * range;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

function buildAreaPath(values: number[], maxValue: number) {
  if (!values.length) return "";
  const step = values.length > 1 ? 100 / (values.length - 1) : 0;
  const lastX = step * (values.length - 1);
  const linePath = buildLinePath(values, maxValue);
  return `${linePath} L${lastX.toFixed(2)},40 L0,40 Z`;
}

export default function CashFlowChartCard() {
  const { user } = useAuth();
  const selectedWalletIds = useWalletStore((state) => state.selectedWalletIds);
  const [range, setRange] = useState<"6m" | "1y">("6m");
  const monthCount = range === "1y" ? 12 : 6;

  const { data: summaryRows = [] } = useQuery({
    queryKey: ["monthly-summary-series", user?.id ?? "guest", selectedWalletIds.join("-")],
    enabled: Boolean(user),
    queryFn: async () => {
      if (!user) return [];
      const params = new URLSearchParams();
      if (selectedWalletIds.length) {
        params.set("walletIds", selectedWalletIds.join(","));
      }

      const response = await fetch(`/api/monthly-summary?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return (await response.json()) as MonthlySummary[];
    },
  });

  const { months, incomeSeries, expenseSeries, maxValue } = useMemo(() => {
    const months = buildMonths(monthCount);
    const totals = new Map<string, { income: number; expense: number }>();

    summaryRows.forEach((row) => {
      const key = `${row.year}-${String(row.month).padStart(2, "0")}`;
      const record = totals.get(key) ?? { income: 0, expense: 0 };
      record.income += Number(row.total_income ?? 0);
      record.expense += Number(row.total_expense ?? 0);
      totals.set(key, record);
    });

    const incomeSeries = months.map((month) => totals.get(month.key)?.income ?? 0);
    const expenseSeries = months.map((month) => totals.get(month.key)?.expense ?? 0);
    const maxValue = Math.max(1, ...incomeSeries, ...expenseSeries);

    return { months, incomeSeries, expenseSeries, maxValue };
  }, [monthCount, summaryRows]);

  const incomePath = useMemo(() => buildLinePath(incomeSeries, maxValue), [incomeSeries, maxValue]);
  const incomeArea = useMemo(() => buildAreaPath(incomeSeries, maxValue), [incomeSeries, maxValue]);
  const expensePath = useMemo(() => buildLinePath(expenseSeries, maxValue), [expenseSeries, maxValue]);

  return (
    <div className="relative flex flex-col overflow-hidden rounded-xl bg-surface-container-low p-8 lg:col-span-2">
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-headline text-lg font-bold">Monthly Cash Flow</h3>
          <p className="text-xs text-on-surface-variant">Comparative analysis of inflow and outflow</p>
        </div>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setRange("6m")}
            className={`rounded-md px-3 py-1.5 text-[10px] font-bold ${
              range === "6m"
                ? "bg-surface-container-highest text-on-surface"
                : "text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            6 MONTHS
          </button>
          <button
            type="button"
            onClick={() => setRange("1y")}
            className={`rounded-md px-3 py-1.5 text-[10px] font-bold ${
              range === "1y"
                ? "bg-surface-container-highest text-on-surface"
                : "text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            YEARLY
          </button>
        </div>
      </div>
      <div className="relative flex-grow">
        <svg className="h-64 w-full" preserveAspectRatio="none" viewBox="0 0 100 40">
          <line className="text-outline-variant/30" stroke="currentColor" strokeWidth="0.1" x1="0" x2="100" y1="0" y2="0" />
          <line className="text-outline-variant/30" stroke="currentColor" strokeWidth="0.1" x1="0" x2="100" y1="10" y2="10" />
          <line className="text-outline-variant/30" stroke="currentColor" strokeWidth="0.1" x1="0" x2="100" y1="20" y2="20" />
          <line className="text-outline-variant/30" stroke="currentColor" strokeWidth="0.1" x1="0" x2="100" y1="30" y2="30" />
          {incomeArea ? <path d={incomeArea} fill="url(#chart-glow)" opacity="0.15" /> : null}
          {incomePath ? (
            <path
              d={incomePath}
              fill="none"
              stroke="#7cebff"
              strokeLinecap="round"
              strokeWidth="0.8"
            />
          ) : null}
          {expensePath ? (
            <path
              d={expensePath}
              fill="none"
              opacity="0.6"
              stroke="#adc6ff"
              strokeLinecap="round"
              strokeWidth="0.5"
            />
          ) : null}
          <defs>
            <linearGradient id="chart-glow" x1="0%" x2="0%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#7cebff" />
              <stop offset="100%" stopColor="#7cebff" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
        <div className="mt-4 flex justify-between text-[10px] font-medium uppercase tracking-tighter text-on-surface-variant">
          {months.map((month) => (
            <span key={month.key}>{month.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
