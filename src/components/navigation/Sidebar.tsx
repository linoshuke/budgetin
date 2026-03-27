"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, Receipt, Wallet, PieChart, MoreHorizontal } from "lucide-react";
import NavItem from "@/components/navigation/NavItem";
import { useUIStore } from "@/stores/uiStore";

const navItems = [
  { label: "Beranda", href: "/beranda", icon: Home },
  { label: "Riwayat", href: "/riwayat", icon: Receipt },
  { label: "Dompet", href: "/dompet", icon: Wallet },
  { label: "Statistik", href: "/statistik", icon: PieChart },
  { label: "Lainnya", href: "/lainnya", icon: MoreHorizontal },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const setActiveTab = useUIStore((state) => state.setActiveTab);

  const activeIndex = navItems.findIndex((item) => pathname.startsWith(item.href));

  return (
    <aside className="sticky top-0 hidden h-screen w-[240px] flex-col border-r border-white/10 bg-[var(--bg-nav)] px-4 py-6 backdrop-blur desktop:flex">
      <div className="mb-8 space-y-1">
        <p className="font-display text-lg font-semibold text-white">Budgetin</p>
        <p className="text-xs text-[var(--text-dimmed)]">Ringkas, tegas, selalu terkendali</p>
      </div>
      <div className="flex flex-1 flex-col gap-1">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const active = index === activeIndex;
          return (
            <NavItem
              key={item.href}
              label={item.label}
              active={active}
              icon={<Icon size={22} />}
              variant="sidebar"
              onClick={() => {
                setActiveTab(index);
                router.push(item.href);
              }}
            />
          );
        })}
      </div>
      <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] p-4 text-xs text-[var(--text-dimmed)]">
        Fokuskan rencana keuangan mingguan Anda dan lihat tren cashflow.
      </div>
    </aside>
  );
}
