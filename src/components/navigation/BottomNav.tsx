"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import { useI18n } from "@/hooks/useI18n";

const navItems = [
  { labelKey: "nav.dashboard", href: "/beranda", icon: "dashboard" },
  { labelKey: "nav.transactions", href: "/transactions", icon: "receipt_long" },
  { labelKey: "nav.budgets", href: "/dompet", icon: "account_balance_wallet" },
  { labelKey: "nav.account", href: "/profile", icon: "person" },
];

export default function BottomNav() {
  const { t } = useI18n();
  const pathname = usePathname();
  const openModal = useUIStore((state) => state.openModal);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-outline-variant/10 bg-surface/90 backdrop-blur-lg md:hidden">
      <div className="flex items-center justify-around py-3">
        {navItems.slice(0, 2).map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href as Route}
              className={cn("flex flex-col items-center space-y-1", active ? "text-primary" : "text-on-surface-variant")}
            >
              <span className="material-symbols-outlined" data-icon={item.icon}>
                {item.icon}
              </span>
              <span className="text-[10px] font-bold">{t(item.labelKey)}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => openModal("quickAddTransaction")}
          className="flex flex-col items-center -mt-8"
          aria-label={t("aria.addTransaction")}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary-container shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-on-primary" data-icon="add">
              add
            </span>
          </div>
        </button>
        {navItems.slice(2).map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href as Route}
              className={cn("flex flex-col items-center space-y-1", active ? "text-primary" : "text-on-surface-variant")}
            >
              <span className="material-symbols-outlined" data-icon={item.icon}>
                {item.icon}
              </span>
              <span className="text-[10px] font-medium">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
