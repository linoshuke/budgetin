"use client";

import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

function getInitials(name?: string, email?: string) {
  const source = (name ?? "").trim() || (email ?? "").trim() || "BU";
  const parts = source.split(" ").filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export default function AccountAction() {
  const router = useRouter();
  const { user, displayName } = useAuth();

  if (!user) {
    return (
      <button
        onClick={() => router.push("/login")}
        aria-label="Masuk"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[var(--bg-card)] text-[var(--text-primary)] transition hover:border-white/20"
      >
        <LogIn size={18} />
      </button>
    );
  }

  const avatarUrl =
    (user.user_metadata?.avatar_url as string | undefined) ||
    (user.user_metadata?.picture as string | undefined) ||
    (user.user_metadata?.avatar as string | undefined) ||
    "";

  return (
    <button
      onClick={() => router.push("/pengaturan")}
      aria-label="Pengaturan akun"
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[var(--bg-card)] text-sm font-semibold text-[var(--text-primary)] transition hover:border-white/20"
      title={displayName}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt={displayName} className="h-9 w-9 rounded-full object-cover" />
      ) : (
        getInitials(displayName, user.email ?? "")
      )}
    </button>
  );
}
