"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/beranda", icon: "dashboard" },
  { label: "Trans", href: "/transactions", icon: "receipt_long" },
  { label: "Budgets", href: "/dompet", icon: "account_balance_wallet" },
  { label: "Akun", href: "/profile", icon: "person" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-outline-variant/10 bg-[#0e141d]/90 backdrop-blur-lg md:hidden">
      <div className="flex items-center justify-around py-3">
        {navItems.slice(0, 2).map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href as Route}
              className={cn("flex flex-col items-center space-y-1", active ? "text-[#13D2EB]" : "text-slate-400")}
            >
              <span className="material-symbols-outlined" data-icon={item.icon}>
                {item.icon}
              </span>
              <span className="text-[10px] font-bold">{item.label}</span>
            </Link>
          );
        })}
        <Link href="/transactions" className="flex flex-col items-center -mt-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary-container shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-on-primary" data-icon="add">
              add
            </span>
          </div>
        </Link>
        {navItems.slice(2).map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href as Route}
              className={cn("flex flex-col items-center space-y-1", active ? "text-[#13D2EB]" : "text-slate-400")}
            >
              <span className="material-symbols-outlined" data-icon={item.icon}>
                {item.icon}
              </span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
