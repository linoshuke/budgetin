import { useSyncExternalStore } from "react";
import type { Category } from "@/types/category";
import type { UserProfile } from "@/types/profile";
import type { Transaction } from "@/types/transaction";

export interface BudgetState {
  transactions: Transaction[];
  categories: Category[];
  profile: UserProfile;
}

const defaultCategories: Category[] = [
  { id: "food", name: "Makanan", icon: "FOOD", color: "#f97316", type: "expense", isDefault: true },
  { id: "transport", name: "Transportasi", icon: "MOVE", color: "#06b6d4", type: "expense", isDefault: true },
  { id: "bills", name: "Tagihan", icon: "BILL", color: "#f43f5e", type: "expense", isDefault: true },
  { id: "salary", name: "Gaji", icon: "PAY", color: "#22c55e", type: "income", isDefault: true },
  { id: "bonus", name: "Bonus", icon: "PLUS", color: "#6366f1", type: "income", isDefault: true },
];

const seedTransactions: Transaction[] = [
  {
    id: "tx-1",
    type: "income",
    amount: 8500000,
    categoryId: "salary",
    date: "2026-03-01",
    note: "Gaji bulanan",
  },
  {
    id: "tx-2",
    type: "expense",
    amount: 240000,
    categoryId: "food",
    date: "2026-03-02",
    note: "Belanja mingguan",
  },
  {
    id: "tx-3",
    type: "expense",
    amount: 180000,
    categoryId: "transport",
    date: "2026-03-02",
    note: "Bahan bakar",
  },
  {
    id: "tx-4",
    type: "expense",
    amount: 520000,
    categoryId: "bills",
    date: "2026-03-03",
    note: "Internet dan listrik",
  },
  {
    id: "tx-5",
    type: "income",
    amount: 1250000,
    categoryId: "bonus",
    date: "2026-02-22",
    note: "Bonus proyek",
  },
];

const initialState: BudgetState = {
  transactions: seedTransactions,
  categories: defaultCategories,
  profile: {
    name: "Rafi Budgetin",
    email: "rafi@budgetin.id",
    theme: "dark",
  },
};

let state: BudgetState = initialState;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

function setState(updater: (current: BudgetState) => BudgetState) {
  state = updater(state);
  emitChange();
}

function createId(prefix: string) {
  const randomId = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
  return `${prefix}-${randomId}`;
}

export const budgetActions = {
  addTransaction(payload: Omit<Transaction, "id">) {
    setState((current) => ({
      ...current,
      transactions: [{ id: createId("tx"), ...payload }, ...current.transactions],
    }));
  },
  updateTransaction(id: string, payload: Omit<Transaction, "id">) {
    setState((current) => ({
      ...current,
      transactions: current.transactions.map((item) => (
        item.id === id ? { ...item, ...payload } : item
      )),
    }));
  },
  deleteTransaction(id: string) {
    setState((current) => ({
      ...current,
      transactions: current.transactions.filter((item) => item.id !== id),
    }));
  },
  addCategory(payload: Omit<Category, "id" | "isDefault">) {
    setState((current) => ({
      ...current,
      categories: [
        ...current.categories,
        { id: createId("cat"), ...payload, isDefault: false },
      ],
    }));
  },
  updateProfile(payload: Partial<Omit<UserProfile, "theme">>) {
    setState((current) => ({
      ...current,
      profile: { ...current.profile, ...payload },
    }));
  },
  setTheme(theme: UserProfile["theme"]) {
    setState((current) => ({
      ...current,
      profile: { ...current.profile, theme },
    }));
  },
};

export function useBudgetStore<T>(selector: (current: BudgetState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(initialState),
  );
}

export function getBudgetState() {
  return state;
}
