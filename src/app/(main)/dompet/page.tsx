"use client";

import { Plus, Wallet } from "lucide-react";
import WalletCard from "@/components/wallets/WalletCard";
import AddWalletDialog from "@/components/wallets/AddWalletDialog";
import LockWidget from "@/components/LockWidget";
import { useWallets } from "@/hooks/useWallets";
import { useUIStore } from "@/stores/uiStore";

export default function WalletsPage() {
  const { wallets, isGuest } = useWallets();
  const openModal = useUIStore((state) => state.openModal);

  return (
    <div className="space-y-6">
      {isGuest ? <LockWidget message="Masuk untuk mengelola dompet." /> : null}

      {wallets.length ? (
        <div className="grid gap-4 tablet:grid-cols-2 desktop:grid-cols-3">
          {wallets.map((wallet) => (
            <WalletCard key={wallet.id} wallet={wallet} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-[var(--text-dimmed)]">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-300">
            <Wallet size={20} />
          </div>
          <p>Belum ada dompet yang ditambahkan.</p>
          <button
            className="text-indigo-300"
            onClick={() => openModal("addWallet")}
          >
            Tambah dompet pertama
          </button>
        </div>
      )}

      <button
        className="fixed bottom-20 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500 text-white shadow-2xl tablet:bottom-8"
        onClick={() => openModal("addWallet")}
        aria-label="Tambah dompet"
      >
        <Plus size={24} />
      </button>

      <AddWalletDialog />
    </div>
  );
}
