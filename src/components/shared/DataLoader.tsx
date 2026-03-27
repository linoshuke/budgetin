"use client";

import { supabase } from "@/lib/supabase";
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

    const loadForAuthenticatedUser = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;
      if (error || !data.session) return;
      await budgetActions.loadFromApi();
    };

    loadForAuthenticatedUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session || !active || isAuthRoute(pathname)) return;
      budgetActions.loadFromApi();
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [pathname]);

  if (!loading || isAuthRoute(pathname)) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-base)]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
        <p className="text-sm text-[var(--text-dimmed)]">Memuat data...</p>
      </div>
    </div>
  );
}
