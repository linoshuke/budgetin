import Link from "next/link";

const navItems = [
  { label: "Dasbor", href: "/" },
  { label: "Laporan", href: "/reports" },
  { label: "Kategori", href: "/categories" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/5 bg-[#0b1224]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#6e59f5] to-[#22d3ee] text-lg font-semibold text-white shadow-lg">
            B
          </div>
          <div>
            <p className="text-sm text-slate-400">Budgetin</p>
            <p className="text-base font-semibold text-slate-50">Kelola uang lebih sadar</p>
          </div>
        </div>

        <nav className="hidden items-center gap-3 text-sm text-slate-300 sm:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 transition-colors hover:bg-white/5 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/profile"
            className="rounded-full border border-white/10 px-3 py-2 text-slate-200 transition-colors hover:border-white/30 hover:bg-white/5"
          >
            Profil
          </Link>
        </nav>
      </div>
    </header>
  );
}
