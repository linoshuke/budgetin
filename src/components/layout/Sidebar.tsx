import { formatCurrency } from "@/lib/utils";
import type { Totals } from "@/lib/budget";
import type { Category } from "@/types/category";

interface SidebarProps {
  categories: Category[];
  totals: Totals;
}

export default function Sidebar({ categories, totals }: SidebarProps) {
  return (
    <aside className="glass-panel h-fit space-y-4 p-4">
      <div>
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Ringkasan Cepat</h2>
        <div className="mt-3 space-y-2 text-sm">
          <SummaryRow label="Saldo Total" value={formatCurrency(totals.balance)} />
          <SummaryRow label="Pemasukan" value={formatCurrency(totals.income)} valueClass="text-emerald-400" />
          <SummaryRow label="Pengeluaran" value={formatCurrency(totals.expense)} valueClass="text-rose-400" />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Kategori Aktif</h2>
        <ul className="mt-3 space-y-2">
          {categories.slice(0, 6).map((category) => (
            <li
              key={category.id}
              className="flex items-center justify-between rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-muted)] px-3 py-2 text-sm"
            >
              <span className="flex items-center gap-2 text-[var(--text-primary)]">
                <span
                  className="inline-flex min-w-10 justify-center rounded-md px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
                  style={{ backgroundColor: category.color }}
                >
                  {category.icon}
                </span>
                {category.name}
              </span>
              <span className="text-xs text-[var(--text-dimmed)]">
                {category.isDefault ? "Default" : "Custom"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

function SummaryRow({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-muted)] px-3 py-2">
      <span className="text-[var(--text-dimmed)]">{label}</span>
      <span className={valueClass ?? "text-[var(--text-primary)]"}>{value}</span>
    </div>
  );
}
