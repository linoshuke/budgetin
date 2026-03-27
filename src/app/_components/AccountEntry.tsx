"use client";

import { useBudgetStore } from "@/store/budgetStore";
import Link from "next/link";

function getInitials(name: string, email: string) {
  const source = name.trim() || email.trim() || "BU";
  const parts = source.split(" ").filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export default function AccountEntry() {
  const profile = useBudgetStore((state) => state.profile);
  const isAuthenticated = useBudgetStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return (
      <Link
        href="/login"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-soft)] text-[var(--text-dimmed)]"
        aria-label="Masuk"
      >
        <svg viewBox="0 0 24 24" width={22} height={22} aria-hidden="true">
          <path
            d="M12 4.5a4 4 0 1 1 0 8a4 4 0 0 1 0-8Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M4.5 20a7.5 7.5 0 0 1 15 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </Link>
    );
  }

  const initials = getInitials(profile.name ?? "", profile.email ?? "");

  return (
    <Link
      href="/profile"
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-soft)] bg-[var(--bg-card-muted)] text-sm font-semibold text-[var(--text-primary)]"
      aria-label="Pengaturan akun"
    >
      {initials}
    </Link>
  );
}
