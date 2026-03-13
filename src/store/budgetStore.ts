import { useSyncExternalStore } from "react";
import type { Category } from "@/types/category";
import type { UserProfile } from "@/types/profile";
import type { Transaction } from "@/types/transaction";
import type { Wallet } from "@/types/wallet";
import {
  buildGuestSnapshot,
  clearGuestSnapshot,
  generateClientId,
  hasGuestData,
  readGuestSnapshot,
  writeGuestSnapshot,
} from "@/lib/guest-storage";

export interface BudgetState {
  transactions: Transaction[];
  categories: Category[];
  wallets: Wallet[];
  profile: UserProfile;
  loading: boolean;
  isAuthenticated: boolean;
  guestPending: boolean;
  syncLoading: boolean;
  syncError: string | null;
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
  isAuthenticated: false,
  guestPending: false,
  syncLoading: false,
  syncError: null,
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

function hasGuestDataFromState(next: BudgetState) {
  return (
    next.transactions.length > 0 ||
    next.categories.length > 0 ||
    next.wallets.length > 0
  );
}

function persistGuestSnapshot(next: BudgetState) {
  const snapshot = buildGuestSnapshot({
    transactions: next.transactions,
    categories: next.categories,
    wallets: next.wallets,
    profile: next.profile,
  });
  writeGuestSnapshot(snapshot);
}

// API helpers
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

// Actions
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

      setState((c) => ({
        ...c,
        transactions,
        categories,
        wallets,
        profile,
        loading: false,
      }));
    } catch (err) {
      console.error("Failed to load data from API:", err);
      setState((c) => ({ ...c, loading: false }));
    }
  },

  loadFromGuest() {
    setState((c) => ({ ...c, loading: true }));

    const snapshot = readGuestSnapshot();
    if (!snapshot) {
      setState((c) => ({
        ...c,
        transactions: [],
        categories: [],
        wallets: [],
        profile: initialState.profile,
        loading: false,
        guestPending: false,
        syncError: null,
      }));
      return;
    }

    setState((c) => ({
      ...c,
      transactions: snapshot.transactions,
      categories: snapshot.categories,
      wallets: snapshot.wallets,
      profile: snapshot.profile,
      loading: false,
      guestPending: hasGuestData(snapshot),
      syncError: null,
    }));
  },

  setAuthState(isAuthenticated: boolean) {
    setState((c) => ({ ...c, isAuthenticated }));
  },

  setGuestPending(guestPending: boolean) {
    setState((c) => ({ ...c, guestPending }));
  },

  async syncGuestData() {
    if (state.syncLoading) return;

    const snapshot = readGuestSnapshot();
    if (!snapshot || !hasGuestData(snapshot)) {
      setState((c) => ({ ...c, guestPending: false, syncError: null }));
      return;
    }

    setState((c) => ({ ...c, syncLoading: true, syncError: null }));

    try {
      const categoryMap = new Map(snapshot.categories.map((item) => [item.id, item]));
      const walletMap = new Map(snapshot.wallets.map((item) => [item.id, item]));

      const payload = {
        categories: snapshot.categories.map((item) => ({
          clientId: item.id,
          name: item.name,
          icon: item.icon,
          color: item.color,
          type: item.type,
        })),
        wallets: snapshot.wallets.map((item) => ({
          clientId: item.id,
          name: item.name,
        })),
        transactions: snapshot.transactions.map((item) => {
          const category = categoryMap.get(item.categoryId);
          const wallet = walletMap.get(item.walletId);
          return {
            clientId: item.id,
            type: item.type,
            amount: item.amount,
            categoryName: category?.name ?? "Tanpa kategori",
            categoryType: (category?.type ?? item.type),
            walletName: wallet?.name ?? "",
            date: item.date,
            note: item.note ?? "",
          };
        }),
      };

      await apiFetch<{ status: string }>("/api/sync", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      clearGuestSnapshot();
      setState((c) => ({ ...c, guestPending: false, syncLoading: false, syncError: null }));
      await budgetActions.loadFromApi();
    } catch (err) {
      console.error("Failed to sync guest data:", err);
      setState((c) => ({
        ...c,
        syncLoading: false,
        syncError: err instanceof Error ? err.message : "Gagal menyinkronkan data.",
      }));
    }
  },

  async addTransaction(payload: Omit<Transaction, "id">) {
    if (!state.isAuthenticated) {
      const created: Transaction = {
        id: generateClientId(),
        ...payload,
      };

      const next = {
        ...state,
        transactions: [created, ...state.transactions],
      };
      const guestPending = hasGuestDataFromState(next);

      setState(() => ({ ...next, guestPending }));
      persistGuestSnapshot(next);
      return;
    }

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
    if (!state.isAuthenticated) {
      const next = {
        ...state,
        transactions: state.transactions.map((item) =>
          item.id === id ? { ...item, ...payload } : item,
        ),
      };
      const guestPending = hasGuestDataFromState(next);
      setState(() => ({ ...next, guestPending }));
      persistGuestSnapshot(next);
      return;
    }

    const updated = await apiFetch<Transaction>(`/api/transactions/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    setState((c) => ({
      ...c,
      transactions: c.transactions.map((item) =>
        item.id === id ? updated : item,
      ),
    }));
  },

  async deleteTransaction(id: string) {
    if (!state.isAuthenticated) {
      const next = {
        ...state,
        transactions: state.transactions.filter((item) => item.id !== id),
      };
      const guestPending = hasGuestDataFromState(next);
      setState(() => ({ ...next, guestPending }));
      persistGuestSnapshot(next);
      return;
    }

    await apiFetch(`/api/transactions/${id}`, { method: "DELETE" });

    setState((c) => ({
      ...c,
      transactions: c.transactions.filter((item) => item.id !== id),
    }));
  },

  async addCategory(payload: Omit<Category, "id" | "isDefault">) {
    if (!state.isAuthenticated) {
      const created: Category = {
        id: generateClientId(),
        isDefault: false,
        ...payload,
      };
      const next = {
        ...state,
        categories: [...state.categories, created],
      };
      const guestPending = hasGuestDataFromState(next);
      setState(() => ({ ...next, guestPending }));
      persistGuestSnapshot(next);
      return;
    }

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
    if (!state.isAuthenticated) {
      const created: Wallet = {
        id: generateClientId(),
        isDefault: false,
        ...payload,
      };
      const next = {
        ...state,
        wallets: [...state.wallets, created],
      };
      const guestPending = hasGuestDataFromState(next);
      setState(() => ({ ...next, guestPending }));
      persistGuestSnapshot(next);
      return created;
    }

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
    if (!state.isAuthenticated) {
      const next = {
        ...state,
        profile: { ...state.profile, ...payload },
      };
      const guestPending = hasGuestDataFromState(next);
      setState(() => ({ ...next, guestPending }));
      persistGuestSnapshot(next);
      return;
    }

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
    if (!state.isAuthenticated) {
      const next = {
        ...state,
        profile: { ...state.profile, theme },
      };
      const guestPending = hasGuestDataFromState(next);
      setState(() => ({ ...next, guestPending }));
      persistGuestSnapshot(next);
      return;
    }

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

// Hook
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
