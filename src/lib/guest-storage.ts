import type { Category } from "@/types/category";
import type { UserProfile } from "@/types/profile";
import type { Transaction } from "@/types/transaction";
import type { Wallet } from "@/types/wallet";

export const GUEST_STORAGE_KEY = "budgetin:guest:v1";
const GUEST_VERSION = 1;

export interface GuestSnapshot {
  version: number;
  transactions: Transaction[];
  categories: Category[];
  wallets: Wallet[];
  profile: UserProfile;
  meta: {
    updatedAt: string;
  };
}

const defaultProfile: UserProfile = {
  name: "",
  email: "",
  theme: "dark",
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function generateClientId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function buildGuestSnapshot(data: {
  transactions: Transaction[];
  categories: Category[];
  wallets: Wallet[];
  profile: UserProfile;
}): GuestSnapshot {
  return {
    version: GUEST_VERSION,
    transactions: data.transactions,
    categories: data.categories,
    wallets: data.wallets,
    profile: data.profile,
    meta: {
      updatedAt: new Date().toISOString(),
    },
  };
}

function isGuestSnapshot(value: unknown): value is GuestSnapshot {
  if (!value || typeof value !== "object") return false;
  const snapshot = value as GuestSnapshot;
  return (
    snapshot.version === GUEST_VERSION &&
    Array.isArray(snapshot.transactions) &&
    Array.isArray(snapshot.categories) &&
    Array.isArray(snapshot.wallets)
  );
}

export function readGuestSnapshot(): GuestSnapshot | null {
  if (!canUseStorage()) return null;

  const raw = window.localStorage.getItem(GUEST_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!isGuestSnapshot(parsed)) return null;

    return {
      ...parsed,
      profile: parsed.profile ?? defaultProfile,
      meta: parsed.meta ?? { updatedAt: new Date().toISOString() },
    } satisfies GuestSnapshot;
  } catch {
    return null;
  }
}

export function hasGuestData(snapshot: GuestSnapshot | null) {
  if (!snapshot) return false;
  return (
    snapshot.transactions.length > 0 ||
    snapshot.categories.length > 0 ||
    snapshot.wallets.length > 0
  );
}

export function writeGuestSnapshot(snapshot: GuestSnapshot) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(snapshot));
}

export function clearGuestSnapshot() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(GUEST_STORAGE_KEY);
}
