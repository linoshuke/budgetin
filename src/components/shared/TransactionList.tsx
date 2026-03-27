import { formatCurrency, formatDate } from "@/lib/utils";
import type { Transaction } from "@/types/transaction";

interface Props {
  transactions: Transaction[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function TransactionList({ transactions, onEdit, onDelete }: Props) {
  return (
    <section className="glass-panel p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Transaksi Terbaru</h2>
        <p className="text-xs text-slate-400">{transactions.length} transaksi terakhir</p>
      </div>

      <div className="mt-4 divide-y divide-white/5">
        {transactions.map((tx) => (
          <article key={tx.id} className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-white">{tx.category}</p>
              <p className="text-xs text-slate-400">
                {formatDate(tx.date)} {tx.note ? `· ${tx.note}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`text-sm font-semibold ${
                  tx.type === "income" ? "text-emerald-300" : "text-rose-300"
                }`}
              >
                {tx.type === "income" ? "+" : "-"}
                {formatCurrency(tx.amount)}
              </span>
              {onEdit && (
                <button
                  onClick={() => onEdit(tx.id)}
                  className="rounded-lg px-2 py-1 text-xs text-slate-300 transition hover:bg-white/5"
                >
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(tx.id)}
                  className="rounded-lg px-2 py-1 text-xs text-rose-300 transition hover:bg-white/5"
                >
                  Hapus
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
