"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import type { Route } from "next";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import { useI18n } from "@/hooks/useI18n";

const navItems = [
  { labelKey: "nav.dashboard", href: "/beranda", icon: "dashboard" },
  { labelKey: "nav.transactions", href: "/transactions", icon: "receipt_long" },
  { labelKey: "nav.budgets", href: "/dompet", icon: "account_balance_wallet" },
  { labelKey: "nav.reports", href: "/statistik", icon: "bar_chart" },
  { labelKey: "nav.appSettings", href: "/pengaturan", icon: "settings" },
];

const quickItems = [
  { labelKey: "nav.categories", href: "/categories", icon: "category" },
  { labelKey: "nav.account", href: "/profile", icon: "person" },
];

const SIDEBAR_STORAGE_KEY = "budgetin:sidebar";

export default function Sidebar() {
  const { t } = useI18n();
  const pathname = usePathname();
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);
  const setSidebarCollapsed = useUIStore((state) => state.setSidebarCollapsed);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const openModal = useUIStore((state) => state.openModal);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(SIDEBAR_STORAGE_KEY) : null;
    if (stored === "collapsed") {
      setSidebarCollapsed(true);
    }
  }, [setSidebarCollapsed]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(SIDEBAR_STORAGE_KEY, sidebarCollapsed ? "collapsed" : "expanded");
  }, [sidebarCollapsed]);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-outline-variant/10 bg-surface transition-all duration-300 lg:flex",
        sidebarCollapsed ? "w-20 p-4" : "w-64 p-6",
      )}
    >
      <div>
        <div className="mb-8 flex items-center justify-between gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary-container">
            <span className="material-symbols-outlined text-on-primary">account_balance_wallet</span>
          </div>
          {sidebarCollapsed ? null : (
            <div>
              <div className="font-headline text-xl font-black text-primary">{t("app.name")}</div>
              <div className="text-[10px] font-medium uppercase tracking-widest text-on-surface-variant/60">
                {t("app.tagline")}
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={toggleSidebar}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant/20 text-on-surface-variant transition-colors hover:text-primary"
            aria-label={sidebarCollapsed ? t("aria.expandSidebar") : t("aria.collapseSidebar")}
          >
            <span className="material-symbols-outlined text-base">
              {sidebarCollapsed ? "chevron_right" : "chevron_left"}
            </span>
          </button>
        </div>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            const label = t(item.labelKey);
            return (
              <Link
                key={item.href}
                href={item.href as Route}
                className={cn(
                  "flex items-center rounded-lg p-3 text-base font-medium transition-all",
                  sidebarCollapsed ? "justify-center" : "space-x-3",
                  active
                    ? "bg-surface-container font-bold text-primary"
                    : "text-on-surface-variant hover:translate-x-1 hover:bg-surface-container hover:text-on-surface",
                )}
                title={sidebarCollapsed ? label : undefined}
              >
                <span className="material-symbols-outlined" data-icon={item.icon}>
                  {item.icon}
                </span>
                <span className={sidebarCollapsed ? "sr-only" : undefined}>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-6 space-y-2">
          {sidebarCollapsed ? null : (
            <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant/60">
              {t("nav.quickAccess")}
            </p>
          )}
          <nav className="space-y-2">
            {quickItems.map((item) => {
              const active = pathname.startsWith(item.href);
              const label = t(item.labelKey);
              return (
                <Link
                  key={item.href}
                  href={item.href as Route}
                  className={cn(
                    "flex items-center rounded-lg p-3 text-sm font-medium transition-all",
                    sidebarCollapsed ? "justify-center" : "space-x-3",
                    active
                      ? "bg-surface-container font-bold text-primary"
                      : "text-on-surface-variant hover:translate-x-1 hover:bg-surface-container hover:text-on-surface",
                  )}
                  title={sidebarCollapsed ? label : undefined}
                >
                  <span className="material-symbols-outlined text-base" data-icon={item.icon}>
                    {item.icon}
                  </span>
                  <span className={sidebarCollapsed ? "sr-only" : undefined}>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      <div className="mt-auto">
        <button
          type="button"
          onClick={() => openModal("quickAddTransaction")}
          className={cn(
            "flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary to-secondary-container px-4 py-4 text-sm font-bold text-on-primary shadow-xl shadow-primary/10 transition-transform active:scale-95",
            sidebarCollapsed ? "space-x-0" : "space-x-2",
          )}
        >
          <span className="material-symbols-outlined" data-icon="add_circle">
            add_circle
          </span>
          <span className={sidebarCollapsed ? "sr-only" : undefined}>{t("nav.addTransaction")}</span>
        </button>
      </div>
    </aside>
  );
}
