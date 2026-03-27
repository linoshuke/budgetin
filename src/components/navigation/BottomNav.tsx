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

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const setActiveTab = useUIStore((state) => state.setActiveTab);

  const activeIndex = navItems.findIndex((item) => pathname.startsWith(item.href));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-[60px] items-center border-t border-white/10 bg-[var(--bg-nav)] backdrop-blur desktop:hidden">
      {navItems.map((item, index) => {
        const Icon = item.icon;
        const active = index === activeIndex;
        return (
          <NavItem
            key={item.href}
            label={item.label}
            active={active}
            icon={<Icon size={26} />}
            variant="bottom"
            onClick={() => {
              setActiveTab(index);
              router.push(item.href);
            }}
          />
        );
      })}
    </nav>
  );
}
