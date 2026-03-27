"use client";

import Header from "@/components/layout/Header";
import MobileAppBar from "@/app/_components/mobile/MobileAppBar";
import MobileBottomNav from "@/app/_components/mobile/MobileBottomNav";
import AuthGate from "@/components/shared/AuthGate";
import Link from "next/link";

const quickLinks = [
  {
    label: "Profil & Keamanan",
    href: "/profile",
    description: "Kelola akun, password, dan ekspor data.",
  },
  {
    label: "Kategori",
    href: "/categories",
    description: "Tambah dan kelola kategori transaksi.",
  },
  {
    label: "Laporan & Analitik",
    href: "/reports",
    description: "Lihat ringkasan dan tren keuangan.",
  },
  {
    label: "Riwayat Transaksi",
    href: "/transactions",
    description: "Filter transaksi berdasarkan periode dan dompet.",
  },
];

export default function MorePage() {
  return (
    <AuthGate>
      <div className="min-h-screen">
        <div className="hidden md:block">
          <Header />
        </div>
        <div className="md:hidden">
          <MobileAppBar title="Lainnya" />
        </div>

        <main className="page-shell space-y-6">
          <section className="space-y-2">
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Pusat Utilitas</h1>
            <p className="text-sm text-[var(--text-dimmed)]">
              Akses cepat ke pengaturan akun, kategori, dan laporan analitik.
            </p>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {quickLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="glass-panel group flex flex-col justify-between gap-3 p-4 transition hover:border-[var(--border-strong)]"
              >
                <div>
                  <p className="text-sm text-[var(--text-dimmed)]">Shortcut</p>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">{item.label}</h2>
                  <p className="mt-1 text-sm text-[var(--text-dimmed)]">{item.description}</p>
                </div>
                <span className="text-xs text-[var(--text-dimmed)] group-hover:text-[var(--text-primary)]">
                  Buka →
                </span>
              </Link>
            ))}
          </section>

          <section className="glass-panel p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Fitur Eksperimental</h2>
                <p className="text-sm text-[var(--text-dimmed)]">
                  Kalender transaksi dan ekspor lanjutan sedang dikembangkan.
                </p>
              </div>
              <span className="rounded-full border border-[var(--border-soft)] bg-[var(--bg-card-muted)] px-3 py-1 text-xs text-[var(--text-dimmed)]">
                Coming soon
              </span>
            </div>
          </section>
        </main>

        <div className="md:hidden">
          <MobileBottomNav />
        </div>
      </div>
    </AuthGate>
  );
}
