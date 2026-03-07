import { useSyncExternalStore } from "react";
import type { Category } from "@/types/category";
import type { UserProfile } from "@/types/profile";
import type { Transaction } from "@/types/transaction";
import type { Wallet } from "@/types/wallet";

export interface BudgetState {
  transactions: Transaction[];
  categories: Category[];
  wallets: Wallet[];
  profile: UserProfile;
  loading: boolean;
}

const initialState: BudgetState = {
  transactions: [],
  categories: [],
  wallets: [],
  profile: {
    name: "",
    email: "",
    theme: "dark",
  },
  loading: false,
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

// ─── API helpers ──────────────────────────────────────────────

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Actions ──────────────────────────────────────────────────

export const budgetActions = {
  /** Load semua data dari API (dipanggil sekali saat app mount) */
  async loadFromApi() {
    setState((c) => ({ ...c, loading: true }));

    try {
      const [transactions, categories, profile] = await Promise.all([
        apiFetch<Transaction[]>("/api/transactions"),
        apiFetch<Category[]>("/api/categories"),
        apiFetch<UserProfile>("/api/profiles"),
      ]);

      let wallets: Wallet[] = [];
      try {
        wallets = await apiFetch<Wallet[]>("/api/wallets");
      } catch (walletError) {
        console.warn("Wallet data is not available yet:", walletError);
      }

      setState(() => ({ transactions, categories, wallets, profile, loading: false }));
    } catch (err) {
      console.error("Failed to load data from API:", err);
      setState((c) => ({ ...c, loading: false }));
    }
  },

  async addTransaction(payload: Omit<Transaction, "id">) {
    const created = await apiFetch<Transaction>("/api/transactions", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    setState((c) => ({
      ...c,
      transactions: [created, ...c.transactions],
    }));
  },

  async updateTransaction(id: string, payload: Omit<Transaction, "id">) {
    const updated = await apiFetch<Transaction>(`/api/transactions/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    setState((c) => ({
      ...c,
      transactions: c.transactions.map((item) =>
        item.id === id ? updated : item
      ),
    }));
  },

  async deleteTransaction(id: string) {
    await apiFetch(`/api/transactions/${id}`, { method: "DELETE" });

    setState((c) => ({
      ...c,
      transactions: c.transactions.filter((item) => item.id !== id),
    }));
  },

  async addCategory(payload: Omit<Category, "id" | "isDefault">) {
    const created = await apiFetch<Category>("/api/categories", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    setState((c) => ({
      ...c,
      categories: [...c.categories, created],
    }));
  },

  async addWallet(payload: Omit<Wallet, "id" | "isDefault">) {
    const created = await apiFetch<Wallet>("/api/wallets", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    setState((c) => ({
      ...c,
      wallets: [...c.wallets, created],
    }));

    return created;
  },

  async updateProfile(payload: Partial<Omit<UserProfile, "theme">>) {
    const updated = await apiFetch<UserProfile>("/api/profiles", {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    setState((c) => ({
      ...c,
      profile: updated,
    }));
  },

  async setTheme(theme: UserProfile["theme"]) {
    const updated = await apiFetch<UserProfile>("/api/profiles", {
      method: "PUT",
      body: JSON.stringify({ theme }),
    });

    setState((c) => ({
      ...c,
      profile: updated,
    }));
  },
};

// ─── Hook ─────────────────────────────────────────────────────

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
