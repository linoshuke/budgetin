"use client";

import { Wallet } from "lucide-react";
import Button from "@/components/ui/Button";
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
      className="relative h-[180px] w-full overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#6366f1_0%,#22d3ee_55%,#0ea5e9_100%)] p-6 text-left text-white shadow-2xl"
    >
      <div className="absolute -right-12 -top-10 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
      <div className="absolute bottom-4 right-6 h-12 w-12 rounded-full bg-white/10 blur-xl" />
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-center justify-between">
          <p className="text-sm text-white/80">Total Saldo</p>
          <Wallet size={20} />
        </div>
        <div>
          <p className="text-3xl font-semibold">{formatCurrency(totalBalance)}</p>
          <p className="text-xs text-white/70">
            {selectedWalletIds.length ? `${selectedWalletIds.length} dompet dipilih` : "Semua dompet"}
          </p>
        </div>
        <div>
          <Button
            variant="ghost"
            className="w-fit border border-white/40 text-xs text-white hover:bg-white/10"
            onClick={(event) => {
              event.stopPropagation();
              openDialog();
            }}
          >
            Pilih Dompet
          </Button>
        </div>
      </div>
    </div>
  );
}
