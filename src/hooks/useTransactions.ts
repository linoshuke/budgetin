import { useMemo } from "react";
import type { Transaction, TransactionType } from "@/types/transaction";

export function useTransactions(transactions: Transaction[], type?: TransactionType) {
  return useMemo(() => {
    if (!type) return transactions;
    return transactions.filter((tx) => tx.type === type);
  }, [transactions, type]);
}
