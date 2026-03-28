"use client";

import { supabase } from "@/lib/supabase/client";
import { usePathname, useRouter } from "next/navigation";
import type { Route } from "next";
import { useEffect, useMemo, useState } from "react";

export default function AuthGate({
  children,
  requireAuth = false,
}: {
  children: React.ReactNode;
  requireAuth?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(requireAuth);

  const loginTarget = useMemo(() => {
    const next = pathname && pathname !== "/" ? `?next=${encodeURIComponent(pathname)}` : "";
    return `/login${next}`;
  }, [pathname]);

  useEffect(() => {
    if (!requireAuth) {
      setChecking(false);
      return;
    }

    let active = true;

    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;

      if (error || !data.session) {
        router.replace(loginTarget as Route);
        return;
      }

      setChecking(false);
    };

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace(loginTarget as Route);
        return;
      }
      setChecking(false);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [loginTarget, router, requireAuth]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="glass-panel flex w-full max-w-md flex-col items-center gap-3 p-6 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
          <p className="text-sm text-[var(--text-dimmed)]">Memverifikasi sesi login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

