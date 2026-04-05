"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useWalletStore } from "@/stores/walletStore";
import { useAppSettingsStore } from "@/stores/appSettingsStore";
import type { MonthlySummary } from "@/types";
import { useI18n } from "@/hooks/useI18n";

const MIN_Y = 6;
const MAX_Y = 34;
const MID_Y = (MIN_Y + MAX_Y) / 2;
const HALF_RANGE = (MAX_Y - MIN_Y) / 2;

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function buildMonths(count: number, locale: string) {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat(locale || "id-ID", { month: "short" });
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
  const denom = maxValue || 1;
  const step = values.length > 1 ? 100 / (values.length - 1) : 0;
  return values
    .map((value, index) => {
      const x = step * index;
      const y = MID_Y - (value / denom) * HALF_RANGE;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

function buildAreaPath(values: number[], maxValue: number, baselineY: number = MID_Y) {
  if (!values.length) return "";
  const step = values.length > 1 ? 100 / (values.length - 1) : 0;
  const lastX = step * (values.length - 1);
  const linePath = buildLinePath(values, maxValue);
  return `${linePath} L${lastX.toFixed(2)},${baselineY.toFixed(2)} L0,${baselineY.toFixed(2)} Z`;
}

function calculateChange(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
}

export default function CashFlowChartCard() {
  const { t } = useI18n();
  const { user } = useAuth();
  const selectedWalletIds = useWalletStore((state) => state.selectedWalletIds);
  const dateLocale = useAppSettingsStore((state) => state.dateLocale);
  const [range, setRange] = useState<"6m" | "1y">("6m");
  const monthCount = range === "1y" ? 12 : 6;

  const { data: summaryRows = [] } = useQuery({
    queryKey: ["monthly-summary-series", user?.id ?? "anon", selectedWalletIds.join("-")],
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

  const { months, incomeSeries, expenseSeries, maxValue, trend } = useMemo(() => {
    const months = buildMonths(monthCount, dateLocale ?? "id-ID");
    const totals = new Map<string, { income: number; expense: number }>();

    summaryRows.forEach((row) => {
      const key = `${row.year}-${String(row.month).padStart(2, "0")}`;
      const record = totals.get(key) ?? { income: 0, expense: 0 };
      record.income += Number(row.total_income ?? 0);
      record.expense += Number(row.total_expense ?? 0);
      totals.set(key, record);
    });

    const incomeSeries = months.map((month) => totals.get(month.key)?.income ?? 0);
    const expenseSeries = months.map((month) => -((totals.get(month.key)?.expense ?? 0)));
    const maxValue = Math.max(
      1,
      ...incomeSeries.map((value) => Math.abs(value)),
      ...expenseSeries.map((value) => Math.abs(value)),
    );

    const last = months[months.length - 1];
    const previous = months[months.length - 2];
    const currentTotals = last ? totals.get(last.key) ?? { income: 0, expense: 0 } : { income: 0, expense: 0 };
    const prevTotals = previous ? totals.get(previous.key) ?? { income: 0, expense: 0 } : { income: 0, expense: 0 };
    const incomeDelta = calculateChange(currentTotals.income, prevTotals.income);
    const expenseDelta = calculateChange(currentTotals.expense, prevTotals.expense);

    const trend = {
      income: {
        percent: incomeDelta,
        label: `${incomeDelta >= 0 ? t("home.cashFlow.trendUp") : t("home.cashFlow.trendDown")} ${Math.abs(incomeDelta).toFixed(1)}%`,
        tone: incomeDelta >= 0 ? "primary" : "error",
      },
      expense: {
        percent: expenseDelta,
        label: `${expenseDelta >= 0 ? t("home.cashFlow.trendUp") : t("home.cashFlow.trendDown")} ${Math.abs(expenseDelta).toFixed(1)}%`,
        tone: expenseDelta >= 0 ? "error" : "primary",
      },
    };

    return { months, incomeSeries, expenseSeries, maxValue, trend };
  }, [dateLocale, monthCount, summaryRows, t]);

  const incomePath = useMemo(() => buildLinePath(incomeSeries, maxValue), [incomeSeries, maxValue]);
  const incomeArea = useMemo(() => buildAreaPath(incomeSeries, maxValue, MID_Y), [incomeSeries, maxValue]);
  const expensePath = useMemo(() => buildLinePath(expenseSeries, maxValue), [expenseSeries, maxValue]);

  return (
    <div className="relative flex flex-col overflow-hidden rounded-xl bg-surface-container-low p-8 lg:col-span-2">
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-headline text-lg font-bold">{t("home.cashFlow.title")}</h3>
          <p className="text-xs text-on-surface-variant">{t("home.cashFlow.desc")}</p>
          <div className="mt-2 flex items-center gap-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#7cebff]" />
              {t("common.income")}
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#adc6ff]" />
              {t("common.expense")}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-wider">
            <span
              className={`rounded-full px-2 py-1 ${
                trend.income.tone === "primary"
                  ? "bg-primary/10 text-primary"
                  : "bg-error/10 text-error"
              }`}
            >
              {t("common.income")} {trend.income.label} {t("home.vsLastMonth")}
            </span>
            <span
              className={`rounded-full px-2 py-1 ${
                trend.expense.tone === "error"
                  ? "bg-error/10 text-error"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {t("common.expense")} {trend.expense.label} {t("home.vsLastMonth")}
            </span>
          </div>
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
            {t("home.cashFlow.range.6m")}
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
            {t("home.cashFlow.range.1y")}
          </button>
        </div>
      </div>
      <div className="relative flex-grow">
        <svg className="h-64 w-full" preserveAspectRatio="none" viewBox="0 0 100 40">
          <line className="text-outline-variant/30" stroke="currentColor" strokeWidth="0.1" x1="0" x2="100" y1="0" y2="0" />
          <line className="text-outline-variant/30" stroke="currentColor" strokeWidth="0.1" x1="0" x2="100" y1="10" y2="10" />
          <line className="text-outline-variant/30" stroke="currentColor" strokeWidth="0.1" x1="0" x2="100" y1="20" y2="20" />
          <line className="text-outline-variant/30" stroke="currentColor" strokeWidth="0.1" x1="0" x2="100" y1="30" y2="30" />
          <line className="text-outline-variant/40" stroke="currentColor" strokeWidth="0.2" x1="0" x2="100" y1={MID_Y} y2={MID_Y} />
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
