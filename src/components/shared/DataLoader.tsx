"use client";

import { budgetActions, useBudgetStore } from "@/store/budgetStore";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

function isAuthRoute(pathname: string) {
  return pathname === "/login" || pathname === "/register";
}

export default function DataLoader() {
  const loading = useBudgetStore((state) => state.loading);
  const pathname = usePathname();

  useEffect(() => {
    if (isAuthRoute(pathname)) return;

    let active = true;

    const loadSession = async () => {
      const response = await fetch("/api/auth/session", { credentials: "include" });
      const payload = (await response.json()) as { user: unknown | null };
      return payload.user;
    };

    const hydrate = async () => {
      if (!active) return;
      let user = await loadSession();

      if (!user) {
        await fetch("/api/auth/anonymous", { method: "POST", credentials: "include" });
        user = await loadSession();
      }

      budgetActions.setAuthState(Boolean(user));
      await budgetActions.loadFromApi();
    };

    hydrate();

    const handleAuthChange = () => {
      if (!active || isAuthRoute(pathname)) return;
      void hydrate();
    };

    window.addEventListener("auth:changed", handleAuthChange);

    return () => {
      active = false;
      window.removeEventListener("auth:changed", handleAuthChange);
    };
  }, [pathname]);

  const showOverlay = !isAuthRoute(pathname) && loading;
  if (!showOverlay) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-base)]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
        <p className="text-sm text-[var(--text-dimmed)]">Memuat data...</p>
      </div>
    </div>
  );
}

