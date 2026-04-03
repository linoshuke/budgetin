"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { formatCurrency } from "@/utils/format";
import { useElementSize } from "@/hooks/useElementSize";

interface WalletStatCardProps {
  walletName: string;
  data: Array<{ day: string; income: number; expense: number; items?: Array<{ description: string; amount: number; type: string }> }>;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: any; label?: string }) {
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
          <span>{formatCurrency(Math.abs(Number(incomeValue)))}</span>
        </div>
        <div className="flex justify-between gap-4 text-rose-300">
          <span>Pengeluaran</span>
          <span>{formatCurrency(Math.abs(Number(expenseValue)))}</span>
        </div>
      </div>
      {items.length ? (
        <div className="mt-3 space-y-1">
          {items.slice(0, 4).map((item: any, index: number) => (
            <div key={`${item.description}-${index}`} className="flex justify-between gap-4">
              <span className="truncate">{item.description}</span>
              <span className={item.type === "expense" ? "text-rose-300" : "text-emerald-300"}>
                {item.amount.toLocaleString("id-ID")}
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

  return (
    <div className="glass-panel flex flex-col gap-4 p-5">
      <div>
        <p className="text-xs text-[var(--text-dimmed)]">Statistik Dompet</p>
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">{walletName}</h3>
      </div>
      <div ref={ref} className="h-[220px]">
        {size.width > 0 && size.height > 0 ? (
          <BarChart data={data} barGap={8} width={size.width} height={size.height}>
            <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
            <YAxis
              stroke="#94a3b8"
              fontSize={12}
              tickFormatter={(value) => formatCurrency(Math.abs(Number(value)))}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="income" fill="#22c55e" radius={[6, 6, 0, 0]} />
            <Bar dataKey="expense" fill="#f43f5e" radius={[0, 0, 6, 6]} />
          </BarChart>
        ) : null}
      </div>
    </div>
  );
}
