"use client";

import { cn } from "@/lib/utils";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems: Array<{ label: string; href: Route }> = [
  { label: "Dasbor", href: "/" },
  { label: "Transaksi", href: "/transactions" },
  { label: "Kategori", href: "/categories" },
  { label: "Laporan", href: "/reports" },
  { label: "Profil", href: "/profile" },
];

function isActive(pathname: string, href: Route) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname.startsWith(href);
}

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border-soft)] bg-[var(--bg-nav)]/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1120px] items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 text-sm font-bold text-white">
            BG
          </span>
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--text-dimmed)]">Budgetin</p>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Kelola uang dengan fokus</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full px-3 py-2 text-sm transition-colors",
                isActive(pathname, item.href)
                  ? "bg-teal-500/15 text-teal-300"
                  : "text-[var(--text-dimmed)] hover:bg-black/5 hover:text-[var(--text-primary)] dark:hover:bg-white/5",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
