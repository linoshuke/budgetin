"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
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
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="min-h-screen"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
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
      <SupabaseProvider>{content}</SupabaseProvider>
      <ToastHost />
    </QueryClientProvider>
  );
}
