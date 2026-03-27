import Button from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Category } from "@/types/category";
import type { Transaction } from "@/types/transaction";
import type { Wallet } from "@/types/wallet";

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  wallets: Wallet[];
  title?: string;
  subtitle?: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  disabled?: boolean;
}

export default function TransactionList({
  transactions,
  categories,
  wallets,
  title = "Transaksi Terakhir",
  subtitle,
  onEdit,
  onDelete,
  disabled = false,
}: TransactionListProps) {
  const categoryMap = new Map(categories.map((item) => [item.id, item]));
  const walletMap = new Map(wallets.map((item) => [item.id, item]));

  return (
    <section className="glass-panel p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
        <span className="text-xs text-[var(--text-dimmed)]">
          {subtitle ?? `${transactions.length} transaksi`}
        </span>
      </div>

      {transactions.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--text-dimmed)]">
          Belum ada transaksi. Tambahkan transaksi baru dari menu Transaksi.
        </p>
      ) : null}

      <div className="mt-4 divide-y divide-[var(--border-soft)]">
        {transactions.map((transaction) => {
          const category = categoryMap.get(transaction.categoryId);
          return (
            <article key={transaction.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {category?.name ?? "Tanpa kategori"}
                </p>
                <p className="text-xs text-[var(--text-dimmed)]">
                  {formatDate(transaction.date, true)}
                  {` - ${walletMap.get(transaction.walletId)?.name ?? "Tanpa dompet"}`}
                  {transaction.note ? ` - ${transaction.note}` : ""}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-semibold ${
                    transaction.type === "income" ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {transaction.type === "income" ? "+" : "-"}
                  {formatCurrency(transaction.amount)}
                </span>

                {onEdit ? (
                  <Button variant="ghost" onClick={() => onEdit(transaction.id)} disabled={disabled}>
                    Edit
                  </Button>
                ) : null}

                {onDelete ? (
                  <Button variant="ghost" className="text-rose-400" onClick={() => onDelete(transaction.id)} disabled={disabled}>
                    Hapus
                  </Button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
