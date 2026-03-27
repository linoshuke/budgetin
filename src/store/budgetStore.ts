import { useMemo, useState } from "react";
import type { Transaction, TransactionType } from "@/types/transaction";

const seedTransactions: Transaction[] = [
  { id: "t1", type: "income", amount: 4500000, category: "Gaji", date: "2026-03-01", note: "Gaji utama" },
  { id: "t2", type: "expense", amount: 250000, category: "Makanan", date: "2026-03-02", note: "Sarapan tim" },
  { id: "t3", type: "expense", amount: 120000, category: "Transportasi", date: "2026-03-02", note: "Bensin" },
  { id: "t4", type: "income", amount: 750000, category: "Freelance", date: "2026-02-28", note: "Proyek desain" },
  { id: "t5", type: "expense", amount: 310000, category: "Tagihan", date: "2026-02-27", note: "Internet" },
  { id: "t6", type: "expense", amount: 185000, category: "Hiburan", date: "2026-02-26", note: "Streaming" },
  { id: "t7", type: "income", amount: 500000, category: "Bonus", date: "2026-02-25" },
];

export type Totals = {
  income: number;
  expense: number;
  balance: number;
};

export function useBudgetStore() {
  const [transactions, setTransactions] = useState<Transaction[]>(seedTransactions);

  const addTransaction = (payload: Omit<Transaction, "id">) => {
    const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`;
    setTransactions((prev) => [{ id, ...payload }, ...prev]);
  };

  const updateTransaction = (id: string, data: Partial<Transaction>) => {
    setTransactions((prev) => prev.map((tx) => (tx.id === id ? { ...tx, ...data } : tx)));
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
  };

  const totals = useMemo<Totals>(() => {
    const income = transactions
      .filter((tx) => tx.type === "income")
      .reduce((sum, tx) => sum + tx.amount, 0);
    const expense = transactions
      .filter((tx) => tx.type === "expense")
      .reduce((sum, tx) => sum + tx.amount, 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const recent = useMemo(() => {
    return [...transactions].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 8);
  }, [transactions]);

  return { transactions, totals, recent, addTransaction, updateTransaction, deleteTransaction };
}

export function createEmptyTransaction(type: TransactionType): Transaction {
  return {
    id: "",
    type,
    amount: 0,
    category: "",
    date: new Date().toISOString().slice(0, 10),
    note: "",
  };
}
