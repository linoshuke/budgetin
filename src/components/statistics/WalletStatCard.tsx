"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { useElementSize } from "@/hooks/useElementSize";
import { useAppSettingsStore } from "@/stores/appSettingsStore";
import { useEffect, useMemo, useState } from "react";

interface WalletStatCardProps {
  walletName: string;
  data: Array<{ day: string; income: number; expense: number; items?: Array<{ description: string; amount: number; type: string }> }>;
}

function maskDigits(input: string) {
  return input.replace(/\d/g, "•");
}

function CustomTooltip({
  active,
  payload,
  label,
  formatValue,
}: {
  active?: boolean;
  payload?: any;
  label?: string;
  formatValue: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const incomeValue = payload.find((entry: any) => entry.dataKey === "income")?.value ?? 0;
  const expenseValue = payload.find((entry: any) => entry.dataKey === "expense")?.value ?? 0;
  const items = payload[0]?.payload?.items ?? [];
  return (
    <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-3 text-xs text-[var(--text-primary)] shadow-xl">
      <p className="font-semibold">Hari {label}</p>
      <div className="mt-2 grid gap-1">
        <div className="flex justify-between gap-4 text-emerald-300">
          <span>Pemasukan</span>
          <span className="tnum">{formatValue(Math.abs(Number(incomeValue)))}</span>
        </div>
        <div className="flex justify-between gap-4 text-rose-300">
          <span>Pengeluaran</span>
          <span className="tnum">{formatValue(Math.abs(Number(expenseValue)))}</span>
        </div>
      </div>
      {items.length ? (
        <div className="mt-3 space-y-1">
          {items.slice(0, 4).map((item: any, index: number) => (
            <div key={`${item.description}-${index}`} className="flex justify-between gap-4">
              <span className="truncate">{item.description}</span>
              <span className={item.type === "expense" ? "text-rose-300" : "text-emerald-300"}>
                <span className="tnum">{formatValue(Math.abs(Number(item.amount)))}</span>
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-1 text-[var(--text-dimmed)]">Tidak ada transaksi.</p>
      )}
    </div>
  );
}

export default function WalletStatCard({ walletName, data }: WalletStatCardProps) {
  const { ref, size } = useElementSize<HTMLDivElement>();
  const privacyHideAmounts = useAppSettingsStore((state) => state.privacyHideAmounts);
  const currency = useAppSettingsStore((state) => state.currency);
  const numberLocale = useAppSettingsStore((state) => state.numberLocale);
  const [reveal, setReveal] = useState(false);

  useEffect(() => {
    if (!privacyHideAmounts) setReveal(false);
  }, [privacyHideAmounts]);

  useEffect(() => {
    if (!reveal) return undefined;
    const timer = window.setTimeout(() => setReveal(false), 4000);
    return () => window.clearTimeout(timer);
  }, [reveal]);

  const formatter = useMemo(() => {
    return new Intl.NumberFormat(numberLocale ?? "id-ID", {
      style: "currency",
      currency: currency ?? "IDR",
      maximumFractionDigits: 0,
    });
  }, [currency, numberLocale]);

  const formatValue = useMemo(() => {
    return (value: number) => {
      const formatted = formatter.format(Number.isFinite(value) ? value : 0);
      if (privacyHideAmounts && !reveal) return maskDigits(formatted);
      return formatted;
    };
  }, [formatter, privacyHideAmounts, reveal]);

  return (
    <div className="glass-panel flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-[var(--text-dimmed)]">Statistik Dompet</p>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">{walletName}</h3>
        </div>
        {privacyHideAmounts ? (
          <button
            type="button"
            onClick={() => setReveal((current) => !current)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-muted)] text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-card)]"
            aria-label={reveal ? "Sembunyikan nominal" : "Tampilkan nominal"}
            aria-pressed={reveal}
            title={reveal ? "Sembunyikan nominal" : "Tampilkan nominal"}
          >
            <span className="material-symbols-outlined text-base leading-none">
              {reveal ? "visibility_off" : "visibility"}
            </span>
          </button>
        ) : null}
      </div>
      <div ref={ref} className="h-[220px]">
        {size.width > 0 && size.height > 0 ? (
          <BarChart data={data} barGap={8} width={size.width} height={size.height}>
            <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
            <YAxis
              stroke="#94a3b8"
              fontSize={12}
              tickFormatter={(value) => formatValue(Math.abs(Number(value)))}
            />
            <Tooltip content={<CustomTooltip formatValue={formatValue} />} />
            <Legend />
            <Bar dataKey="income" fill="#22c55e" radius={[6, 6, 0, 0]} />
            <Bar dataKey="expense" fill="#f43f5e" radius={[0, 0, 6, 6]} />
          </BarChart>
        ) : null}
      </div>
    </div>
  );
}
