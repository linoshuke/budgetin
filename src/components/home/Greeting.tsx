"use client";

import { useAuth } from "@/hooks/useAuth";

export default function Greeting() {
  const { displayName } = useAuth();
  return (
    <div>
      <h2 className="text-[26px] font-bold text-[var(--text-primary)]">Halo, {displayName}!</h2>
      <p className="text-sm text-[var(--text-dimmed)]">Ringkas kondisi keuanganmu hari ini.</p>
    </div>
  );
}
