"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

type HeaderTab = {
  key: string;
  label: string;
};

const titles: Array<{ prefix: string; label: string }> = [
  { prefix: "/beranda", label: "Dashboard" },
  { prefix: "/riwayat", label: "Transactions" },
  { prefix: "/transactions", label: "Transactions" },
  { prefix: "/dompet", label: "Budgets" },
  { prefix: "/statistik", label: "Reports" },
  { prefix: "/reports", label: "Reports" },
  { prefix: "/categories", label: "Categories" },
  { prefix: "/profile", label: "Akun" },
  { prefix: "/pengaturan", label: "Pengaturan Aplikasi" },
  { prefix: "/lainnya", label: "Settings" },
];

const breadcrumbPages: Array<{ prefix: string; label: string }> = [
  { prefix: "/categories", label: "Categories" },
  { prefix: "/profile", label: "Akun" },
  { prefix: "/reports", label: "Reports" },
];

function resolveTitle(pathname: string) {
  const match = titles.find((item) => pathname.startsWith(item.prefix));
  return match?.label ?? "Budgetin";
}

function resolveBreadcrumb(pathname: string) {
  const match = breadcrumbPages.find((item) => pathname.startsWith(item.prefix));
  if (!match) return null;
  return { parent: "Dashboard", label: match.label };
}

export default function MainHeader({
  title,
  tabs,
  activeTab,
  onTabChange,
}: {
  title?: string;
  tabs?: HeaderTab[];
  activeTab?: string;
  onTabChange?: (key: string) => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { avatarUrl, initials, displayName, user } = useAuth();
  const resolvedTitle = title ?? resolveTitle(pathname);
  const breadcrumb = resolveBreadcrumb(pathname);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between bg-[#0e141d]/80 px-6 py-4 backdrop-blur-xl md:px-8">
      <div className="flex items-center gap-4">
        <button className="text-on-surface md:hidden" type="button">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="flex flex-col">
          <h1 className="font-headline text-2xl font-bold tracking-tighter text-[#13D2EB]">
            {resolvedTitle}
          </h1>
          {breadcrumb ? (
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
              {breadcrumb.parent} / {breadcrumb.label}
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-6">
        {tabs && tabs.length > 0 ? (
          <nav className="hidden items-center gap-8 font-headline text-sm font-medium tracking-tight md:flex">
            {tabs.map((item) => {
              const active = item.key === activeTab;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onTabChange?.(item.key)}
                  className={
                    active
                      ? "border-b-2 border-[#13D2EB] pb-1 font-bold text-[#13D2EB]"
                      : "font-medium text-slate-400 transition-colors hover:text-slate-200"
                  }
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        ) : null}
        <div className="flex items-center gap-3">
          <button type="button" className="rounded-full p-2 text-slate-400 transition-all hover:bg-[#1a202a]">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button
            type="button"
            onClick={() => router.push("/profile")}
            className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-outline-variant/30 bg-surface-container text-[10px] font-semibold text-on-surface transition-colors hover:border-primary/40"
            aria-label="Buka pengaturan akun"
            title="Pengaturan akun"
          >
            {user && avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt={displayName} className="h-full w-full object-cover" src={avatarUrl} />
            ) : (
              initials
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
