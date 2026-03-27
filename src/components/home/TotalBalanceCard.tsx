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

  return (
    <div className="relative h-[180px] overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-blue-500 p-6 text-white shadow-xl">
      <div className="absolute -right-12 -top-10 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
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
        <Button
          variant="ghost"
          className="w-fit border border-white/40 text-xs text-white hover:bg-white/10"
          onClick={() => openModal("walletSelection")}
        >
          Pilih Dompet
        </Button>
      </div>
    </div>
  );
}
