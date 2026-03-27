import { formatCurrency } from "@/lib/utils";

interface Props {
  income: number;
  expense: number;
}

export default function MonthlySummary({ income, expense }: Props) {
  const total = Math.max(income + expense, 1);
  const incomePercent = Math.round((income / total) * 100);
  const expensePercent = Math.round((expense / total) * 100);

  return (
    <section className="glass-panel p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Ringkasan Bulan Ini</h2>
        <span className="text-xs text-[var(--text-dimmed)]">Pemasukan vs Pengeluaran</span>
      </div>

      <div className="mt-4 space-y-4">
        <SummaryBar
          label="Pemasukan"
          value={formatCurrency(income)}
          percent={incomePercent}
          barClass="from-emerald-500 to-emerald-400"
        />
        <SummaryBar
          label="Pengeluaran"
          value={formatCurrency(expense)}
          percent={expensePercent}
          barClass="from-rose-500 to-rose-400"
        />
      </div>
    </section>
  );
}

function SummaryBar({
  label,
  value,
  percent,
  barClass,
}: {
  label: string;
  value: string;
  percent: number;
  barClass: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-[var(--text-dimmed)]">{label}</span>
        <span className="font-semibold text-[var(--text-primary)]">{value}</span>
      </div>
      <div className="h-3 rounded-full bg-[var(--bg-card-muted)]">
        <div
          className={`h-3 rounded-full bg-gradient-to-r ${barClass}`}
          style={{ width: `${Math.max(percent, 2)}%` }}
        />
      </div>
    </div>
  );
}
