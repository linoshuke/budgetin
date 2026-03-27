"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import BottomNav from "@/components/navigation/BottomNav";
import Sidebar from "@/components/navigation/Sidebar";
import { useUIStore } from "@/stores/uiStore";

const tabPaths = ["/beranda", "/riwayat", "/dompet", "/statistik", "/lainnya"];

function resolveTabIndex(pathname: string) {
  const match = tabPaths.findIndex((path) => pathname.startsWith(path));
  return match === -1 ? 0 : match;
}

export default function MainLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const activeTab = useUIStore((state) => state.activeTab);
  const setActiveTab = useUIStore((state) => state.setActiveTab);
  const [cache, setCache] = useState<Record<string, ReactNode>>({});

  const isTabPage = tabPaths.includes(pathname);

  useEffect(() => {
    setActiveTab(resolveTabIndex(pathname));

    if (isTabPage) {
      setCache((prev) => ({ ...prev, [pathname]: children }));
    }
  }, [children, isTabPage, pathname, setActiveTab]);

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
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1">
        <div className="page-shell pt-6">{content}</div>
      </main>
      <BottomNav />
    </div>
  );
}
