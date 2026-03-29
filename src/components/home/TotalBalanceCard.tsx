"use client";

import { useWalletStore } from "@/stores/walletStore";
import { useUIStore } from "@/stores/uiStore";
import { formatCurrency } from "@/utils/format";

export default function TotalBalanceCard() {
  const totalBalance = useWalletStore((state) => state.totalBalance);
  const selectedWalletIds = useWalletStore((state) => state.selectedWalletIds);
  const openModal = useUIStore((state) => state.openModal);

  const openDialog = () => openModal("walletSelection");

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openDialog}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openDialog();
        }
      }}
      className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-[#1a202a] to-[#0e141d] p-8 text-left shadow-2xl shadow-[#080e18]/50 transition-transform hover:-translate-y-1"
    >
      <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/10 blur-[80px] transition-colors group-hover:bg-primary/20" />
      <div className="relative z-10 flex h-full flex-col justify-between">
        <div>
          <div className="flex items-center space-x-2 text-sm font-medium text-on-surface-variant">
            <span>Total Net Worth</span>
            <span className="material-symbols-outlined text-[16px]">info</span>
          </div>
          <h1 className="tnum mt-2 text-4xl font-extrabold tracking-tighter text-on-surface md:text-5xl">
            {formatCurrency(totalBalance)}
          </h1>
          <p className="mt-2 text-xs text-on-surface-variant">
            {selectedWalletIds.length ? `${selectedWalletIds.length} dompet dipilih` : "Semua dompet"}
          </p>
        </div>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 backdrop-blur-md">
            <span className="material-symbols-outlined text-primary" data-icon="trending_up">
              trending_up
            </span>
            <span className="text-sm font-bold text-primary">
              +12.4% <span className="font-normal opacity-70">bulan ini</span>
            </span>
          </div>
          <div className="text-xs font-medium uppercase tracking-widest text-on-surface-variant">
            Terakhir sinkron: 2m
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-0 right-0 h-full w-1/2 opacity-20">
        <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 200 100">
          <path d="M0,80 Q50,70 100,40 T200,20 L200,100 L0,100 Z" fill="url(#hero-gradient)" />
          <defs>
            <linearGradient id="hero-gradient" x1="0%" x2="0%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#7cebff" stopOpacity="1" />
              <stop offset="100%" stopColor="#7cebff" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}
