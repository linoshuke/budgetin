"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import ToastHost from "@/components/ui/ToastHost";
import { supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/authStore";

function AnimatedSwitcher({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const group = pathname.startsWith("/login") || pathname.startsWith("/signup") || pathname.startsWith("/verify-email")
    ? "auth"
    : "main";

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={group}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="min-h-screen"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function AuthGate({ children }: { children: ReactNode }) {
  const loading = useAuthStore((state) => state.loading);
  const user = useAuthStore((state) => state.user);
  const pathname = usePathname();
  const router = useRouter();

  const emailVerified = Boolean(
    user?.email_confirmed_at ?? (user as { confirmed_at?: string | null } | null)?.confirmed_at,
  );

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (emailVerified) return;
    if (pathname.startsWith("/verify-email")) return;
    const email = user.email ?? "";
    router.replace(`/verify-email?email=${encodeURIComponent(email)}`);
  }, [emailVerified, loading, pathname, router, user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--accent-indigo)]/30 border-t-[var(--accent-indigo)]" />
      </div>
    );
  }

  if (user && !emailVerified && !pathname.startsWith("/verify-email")) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--accent-indigo)]/30 border-t-[var(--accent-indigo)]" />
      </div>
    );
  }

  return <>{children}</>;
}

function SupabaseProvider({ children }: { children: ReactNode }) {
  const setSession = useAuthStore((state) => state.setSession);
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [setLoading, setSession, setUser]);

  return <>{children}</>;
}

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  const content = useMemo(() => <AnimatedSwitcher>{children}</AnimatedSwitcher>, [children]);

  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseProvider>
        <AuthGate>{content}</AuthGate>
      </SupabaseProvider>
      <ToastHost />
    </QueryClientProvider>
  );
}
