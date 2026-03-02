import { formatCurrency } from "@/lib/utils";

interface Props {
  income: number;
  expense: number;
}

export default function MonthlySummary({ income, expense }: Props) {
  const total = Math.max(income + expense, 1);
  const incomePercent = Math.round((income / total) * 100);
  const expensePercent = 100 - incomePercent;

  return (
    <section className="glass-panel p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Ringkasan Bulan Ini</h2>
        <p className="text-xs text-slate-400">Pemasukan vs Pengeluaran</p>
      </div>

      <div className="mt-4 space-y-3">
        <Bar
          label="Pemasukan"
          value={income}
          percent={incomePercent}
          color="from-emerald-400 to-emerald-500"
        />
        <Bar
          label="Pengeluaran"
          value={expense}
          percent={expensePercent}
          color="from-rose-400 to-rose-500"
        />
      </div>
    </section>
  );
}

function Bar({
  label,
  value,
  percent,
  color,
}: {
  label: string;
  value: number;
  percent: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm text-slate-300">
        <span>{label}</span>
        <span className="font-semibold text-white">{formatCurrency(value)}</span>
      </div>
      <div className="mt-2 h-3 rounded-full bg-white/5">
        <div
          className={`h-3 rounded-full bg-gradient-to-r ${color}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
