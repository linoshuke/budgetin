"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import BottomNav from "@/components/navigation/BottomNav";
import Sidebar from "@/components/navigation/Sidebar";
import MainHeader from "@/components/navigation/MainHeader";
import { useUIStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase/client";

const tabPaths = ["/beranda", "/transactions", "/dompet", "/statistik", "/lainnya"];

function resolveTabIndex(pathname: string) {
  const match = tabPaths.findIndex((path) => pathname.startsWith(path));
  return match === -1 ? 0 : match;
}

export default function MainLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const activeTab = useUIStore((state) => state.activeTab);
  const setActiveTab = useUIStore((state) => state.setActiveTab);
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);
  const pushToast = useUIStore((state) => state.pushToast);
  const authUser = useAuthStore((state) => state.user);
  const authLoading = useAuthStore((state) => state.loading);
  const [cache, setCache] = useState<Record<string, ReactNode>>({});
  const [anonAttempted, setAnonAttempted] = useState(false);

  const isTabPage = tabPaths.includes(pathname);

  useEffect(() => {
    setActiveTab(resolveTabIndex(pathname));

    if (isTabPage) {
      setCache((prev) => ({ ...prev, [pathname]: children }));
    }
  }, [children, isTabPage, pathname, setActiveTab]);

  useEffect(() => {
    if (authLoading) return;
    if (authUser) return;
    if (anonAttempted) return;

    setAnonAttempted(true);

    supabase.auth.signInAnonymously().then(({ error }) => {
      if (error) {
        pushToast({
          title: "Gagal masuk anonim",
          description: error.message,
          variant: "error",
        });
      }
    });
  }, [anonAttempted, authLoading, authUser, pushToast]);

  const content = useMemo(() => {
    if (!isTabPage) return children;
    const activePath = tabPaths[activeTab] ?? pathname;
    return (
      <div className="relative">
        {tabPaths.map((path) => (
          <div key={path} className={path === activePath ? "block" : "hidden"}>
            {cache[path] ?? null}
          </div>
        ))}
      </div>
    );
  }, [activeTab, cache, children, isTabPage, pathname]);

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <Sidebar />
      <main className={sidebarCollapsed ? "min-h-screen lg:ml-20" : "min-h-screen lg:ml-64"}>
        <MainHeader />
        <div className="px-6 pb-12 pt-6">
          <div className="w-full max-w-none">{content}</div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
