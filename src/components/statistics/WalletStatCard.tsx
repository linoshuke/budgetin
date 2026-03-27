"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";

interface WalletStatCardProps {
  walletName: string;
  data: Array<{ day: string; income: number; expense: number; items?: Array<{ description: string; amount: number; type: string }> }>;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: any; label?: string }) {
  if (!active || !payload?.length) return null;
  const items = payload[0]?.payload?.items ?? [];
  return (
    <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-3 text-xs text-[var(--text-primary)] shadow-xl">
      <p className="font-semibold">Hari {label}</p>
      {items.length ? (
        <div className="mt-2 space-y-1">
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
  return (
    <div className="glass-panel flex flex-col gap-4 p-5">
      <div>
        <p className="text-xs text-[var(--text-dimmed)]">Statistik Dompet</p>
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">{walletName}</h3>
      </div>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={8}>
            <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="income" fill="#22c55e" radius={[6, 6, 0, 0]} />
            <Bar dataKey="expense" fill="#f43f5e" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
