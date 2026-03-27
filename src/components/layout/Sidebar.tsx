import { formatCurrency } from "@/lib/utils";
import type { Totals } from "@/store/budgetStore";

type Category = {
  name: string;
  icon: string;
  color: string;
};

interface SidebarProps {
  categories: Category[];
  totals: Totals;
}

export default function Sidebar({ categories, totals }: SidebarProps) {
  return (
    <aside className="glass-panel h-fit space-y-4 p-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">Ringkasan</p>
        <div className="mt-3 space-y-2">
          <SummaryRow label="Saldo" value={formatCurrency(totals.balance)} />
          <SummaryRow label="Pemasukan" value={formatCurrency(totals.income)} color="#34d399" />
          <SummaryRow label="Pengeluaran" value={formatCurrency(totals.expense)} color="#fb7185" />
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">Kategori</p>
        <ul className="mt-3 space-y-2">
          {categories.map((cat) => (
            <li
              key={cat.name}
              className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm"
            >
              <span className="flex items-center gap-2">
                <span style={{ color: cat.color }}>{cat.icon}</span>
                {cat.name}
              </span>
              <span className="text-xs text-slate-400">aktif</span>
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
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm">
      <span className="text-slate-300">{label}</span>
      <span style={{ color: color ?? "inherit" }} className="font-semibold">
        {value}
      </span>
    </div>
  );
}
