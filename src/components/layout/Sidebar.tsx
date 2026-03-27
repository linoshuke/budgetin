import { formatCurrency } from "@/lib/utils";
import type { Totals } from "@/lib/budget";
import Link from "next/link";
import type { Route } from "next";

interface SidebarProps {
  totals: Totals;
}

export default function Sidebar({ totals }: SidebarProps) {
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
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Navigasi Cepat</h2>
        <div className="mt-3 space-y-2 text-sm">
          <QuickLink href="/transactions" label="Kelola wallet" />
          <QuickLink href="/categories" label="Kelola kategori" />
          <QuickLink href="/reports" label="Buka laporan bulanan" />
        </div>
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

function QuickLink({ href, label }: { href: Route; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-muted)] px-3 py-2 text-[var(--text-primary)] transition hover:border-[var(--border-strong)]"
    >
      <span>{label}</span>
      <span className="text-xs text-[var(--text-dimmed)]">Buka</span>
    </Link>
  );
}
