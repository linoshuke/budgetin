"use client";

import { supabase } from "@/lib/supabase";
import { GUEST_STORAGE_KEY, hasGuestData, readGuestSnapshot } from "@/lib/guest-storage";
import { budgetActions, getBudgetState, useBudgetStore } from "@/store/budgetStore";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

function isAuthRoute(pathname: string) {
  return pathname === "/login" || pathname === "/register";
}

export default function DataLoader() {
  const loading = useBudgetStore((state) => state.loading);
  const syncLoading = useBudgetStore((state) => state.syncLoading);
  const pathname = usePathname();

  useEffect(() => {
    if (isAuthRoute(pathname)) return;

    let active = true;

    const hydrate = async (sessionAvailable: boolean) => {
      if (!active) return;

      budgetActions.setAuthState(sessionAvailable);

      if (sessionAvailable) {
        const snapshot = readGuestSnapshot();
        if (hasGuestData(snapshot)) {
          budgetActions.loadFromGuest();
          await budgetActions.syncGuestData();
          return;
        }

        budgetActions.setGuestPending(false);\n        await budgetActions.loadFromApi();\n        return;
      }

      budgetActions.loadFromGuest();
    };

    const loadForUser = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;
      if (error || !data.session) {
        await hydrate(false);
        return;
      }
      await hydrate(true);
    };

    loadForUser();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active || isAuthRoute(pathname)) return;
      await hydrate(Boolean(session));
    });

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== GUEST_STORAGE_KEY) return;

      const snapshot = readGuestSnapshot();
      const pending = hasGuestData(snapshot);
      budgetActions.setGuestPending(pending);

      if (!getBudgetState().isAuthenticated) {
        budgetActions.loadFromGuest();
        return;
      }

      if (!pending) {
        void budgetActions.loadFromApi();
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      active = false;
      listener.subscription.unsubscribe();
      window.removeEventListener("storage", handleStorage);
    };
  }, [pathname]);

  const showOverlay = !isAuthRoute(pathname) && (loading || syncLoading);
  if (!showOverlay) return null;

  const message = syncLoading ? "Menyinkronkan data..." : "Memuat data...";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-base)]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
        <p className="text-sm text-[var(--text-dimmed)]">{message}</p>
      </div>
    </div>
  );
}

