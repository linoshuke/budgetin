"use client";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { formatCurrency, getIsoDateToday } from "@/lib/utils";
import type { Category } from "@/types/category";
import type { Transaction, TransactionType } from "@/types/transaction";
import { useMemo, useState } from "react";

interface TransactionFormProps {
  categories: Category[];
  initialValue?: Transaction;
  onSubmit: (payload: Omit<Transaction, "id">) => void;
  onCancel?: () => void;
  submitLabel?: string;
}

export default function TransactionForm({
  categories,
  initialValue,
  onSubmit,
  onCancel,
  submitLabel = "Simpan Transaksi",
}: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>(initialValue?.type ?? "expense");
  const [amountInput, setAmountInput] = useState(initialValue ? String(initialValue.amount) : "");
  const [categoryId, setCategoryId] = useState(initialValue?.categoryId ?? "");
  const [date, setDate] = useState(initialValue?.date ?? getIsoDateToday());
  const [note, setNote] = useState(initialValue?.note ?? "");

  const filteredCategories = useMemo(() => (
    categories.filter((item) => item.type === "both" || item.type === type)
  ), [categories, type]);

  const selectedCategoryId = filteredCategories.some((item) => item.id === categoryId)
    ? categoryId
    : (filteredCategories[0]?.id ?? "");

  const amount = Number(amountInput || "0");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedCategoryId || amount <= 0) return;

    onSubmit({
      type,
      amount,
      categoryId: selectedCategoryId,
      date,
      note: note.trim(),
    });

    if (!initialValue) {
      setAmountInput("");
      setNote("");
      setDate(getIsoDateToday());
    }
  };

  return (
    <form id="transaction-form" className="glass-panel space-y-4 p-4" onSubmit={handleSubmit}>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant={type === "income" ? "primary" : "outline"}
          onClick={() => setType("income")}
        >
          Pemasukan
        </Button>
        <Button
          type="button"
          variant={type === "expense" ? "primary" : "outline"}
          onClick={() => setType("expense")}
        >
          Pengeluaran
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm text-[var(--text-dimmed)]">Nominal</label>
          <Input
            inputMode="numeric"
            placeholder="Contoh: 150000"
            value={amountInput}
            onChange={(event) => setAmountInput(event.target.value.replace(/\D/g, ""))}
            required
          />
          <p className="text-xs text-[var(--text-dimmed)]">Preview: {formatCurrency(amount)}</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-[var(--text-dimmed)]">Kategori</label>
          <select
            value={selectedCategoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-muted)] px-3 py-2 text-sm text-[var(--text-primary)]"
            required
          >
            {filteredCategories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-[var(--text-dimmed)]">Tanggal</label>
          <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-[var(--text-dimmed)]">Catatan (opsional)</label>
          <Input
            placeholder="Contoh: Bensin untuk perjalanan kantor"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit">{submitLabel}</Button>
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Batal
          </Button>
        ) : null}
      </div>
    </form>
  );
}
