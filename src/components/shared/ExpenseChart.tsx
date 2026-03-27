import { formatCurrency } from "@/lib/utils";
import type { CategoryBreakdown } from "@/lib/budget";

interface ExpenseChartProps {
  rows: CategoryBreakdown[];
}

export default function ExpenseChart({ rows }: ExpenseChartProps) {
  return (
    <section className="glass-panel p-4">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">Visual Pengeluaran per Kategori</h2>
      <p className="mt-1 text-xs text-[var(--text-dimmed)]">
        Diagram batang sederhana dari nominal pengeluaran terbesar.
      </p>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--text-dimmed)]">
          Belum ada data pengeluaran pada rentang waktu ini.
        </p>
      ) : null}

      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.category.id}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-[var(--text-primary)]">{row.category.name}</span>
              <span className="text-[var(--text-dimmed)]">
                {formatCurrency(row.amount)} ({row.percent}%)
              </span>
            </div>
            <div className="h-3 rounded-full bg-[var(--bg-card-muted)]">
              <div
                className="h-3 rounded-full"
                style={{
                  width: `${Math.max(row.percent, 4)}%`,
                  backgroundColor: row.category.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
