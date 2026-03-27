"use client";

import { usePathname } from "next/navigation";
import AccountAction from "@/components/navigation/AccountAction";

const titles: Array<{ prefix: string; label: string }> = [
  { prefix: "/beranda", label: "Beranda" },
  { prefix: "/riwayat", label: "Riwayat" },
  { prefix: "/dompet", label: "Dompet" },
  { prefix: "/statistik", label: "Statistik" },
  { prefix: "/lainnya", label: "Lainnya" },
  { prefix: "/pengaturan", label: "Pengaturan" },
];

function resolveTitle(pathname: string) {
  const match = titles.find((item) => pathname.startsWith(item.prefix));
  return match?.label ?? "Budgetin";
}

export default function MainHeader() {
  const pathname = usePathname();
  const title = resolveTitle(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[var(--bg-nav)]/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[720px] items-center justify-between px-4 py-3 tablet:max-w-[960px] tablet:px-6 desktop:max-w-[1320px] desktop:px-8">
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h1>
        <AccountAction />
      </div>
    </header>
  );
}
