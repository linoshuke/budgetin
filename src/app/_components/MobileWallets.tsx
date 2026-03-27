"use client";

import MobileAppBar from "@/app/_components/MobileAppBar";
import LockWidget from "@/app/_components/LockWidget";
import Modal from "@/components/shared/Modal";
import { formatCurrency } from "@/lib/utils";
import { budgetActions, useBudgetStore } from "@/store/budgetStore";
import type { Wallet } from "@/types/wallet";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

export default function MobileWallets() {
  const isAuthenticated = useBudgetStore((state) => state.isAuthenticated);
  const wallets = useBudgetStore((state) => state.wallets);
  const transactions = useBudgetStore((state) => state.transactions);
  const syncLoading = useBudgetStore((state) => state.syncLoading);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addWalletName, setAddWalletName] = useState("");
  const [addWalletCategory, setAddWalletCategory] = useState("Umum");
  const [addWalletLocation, setAddWalletLocation] = useState("Lokal");
  const [addWalletError, setAddWalletError] = useState("");
  const [addWalletLoading, setAddWalletLoading] = useState(false);

  const walletStats = useMemo(() => {
    const map = new Map<string, { income: number; expense: number; balance: number }>();
    wallets.forEach((wallet) => map.set(wallet.id, { income: 0, expense: 0, balance: 0 }));
    transactions.forEach((tx) => {
      const stats = map.get(tx.walletId);
      if (!stats) return;
      if (tx.type === "income") {
        stats.income += tx.amount;
        stats.balance += tx.amount;
      } else {
        stats.expense += tx.amount;
        stats.balance -= tx.amount;
      }
    });
    return map;
  }, [wallets, transactions]);

  const handleAddWallet = async () => {
    const name = addWalletName.trim();
    if (!name) {
      setAddWalletError("Nama dompet wajib diisi.");
      return;
    }

    try {
      setAddWalletLoading(true);
      setAddWalletError("");
      await budgetActions.addWallet({
        name,
        category: addWalletCategory,
        location: addWalletLocation,
      });
      setShowAddModal(false);
    } catch (error) {
      setAddWalletError(error instanceof Error ? error.message : "Gagal menambahkan dompet.");
    } finally {
      setAddWalletLoading(false);
    }
  };

  useEffect(() => {
    if (showAddModal) {
      setAddWalletName("");
      setAddWalletCategory("Umum");
      setAddWalletLocation("Lokal");
      setAddWalletError("");
    }
  }, [showAddModal]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <MobileAppBar title="Dompet" />
        <LockWidget />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <MobileAppBar title="Daftar Dompet Saya" />

      <div className="space-y-4 px-4 pb-28 pt-4">
        {wallets.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--border-soft)] p-6 text-center text-[var(--text-dimmed)]">
            <svg viewBox="0 0 24 24" width={48} height={48} aria-hidden="true">
              <rect
                x="3.5"
                y="6.5"
                width="17"
                height="11"
                rx="2.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              />
            </svg>
            <div>
              <p className="text-lg font-bold">Belum ada dompet</p>
              <p className="text-sm text-[var(--text-dimmed)]">Tambahkan dompet pertama Anda sekarang.</p>
            </div>
          </div>
        ) : (
          wallets.map((wallet) => (
            <MobileWalletCard
              key={wallet.id}
              wallet={wallet}
              stats={walletStats.get(wallet.id)}
              disabled={syncLoading}
            />
          ))
        )}
      </div>

      <button
        type="button"
        className="fixed bottom-[84px] right-4 z-30 inline-flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-2xl text-white shadow-lg"
        onClick={() => setShowAddModal(true)}
      >
        +
      </button>

      <Modal
        open={showAddModal}
        title="Tambah Dompet Baru"
        onClose={() => setShowAddModal(false)}
        sizeClassName="max-w-md"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-[var(--text-dimmed)]">Nama Dompet</label>
            <input
              className="w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-muted)] px-3 py-2 text-sm text-[var(--text-primary)]"
              placeholder="Contoh: BCA, OVO, Tunai..."
              value={addWalletName}
              onChange={(event) => setAddWalletName(event.target.value)}
            />
            {addWalletError ? <p className="text-xs text-rose-400">{addWalletError}</p> : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-[var(--text-dimmed)]">Kategori</label>
              <select
                className="w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-muted)] px-3 py-2 text-sm text-[var(--text-primary)]"
                value={addWalletCategory}
                onChange={(event) => setAddWalletCategory(event.target.value)}
              >
                <option>Umum</option>
                <option>Bank</option>
                <option>e-Wallet</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-[var(--text-dimmed)]">Lokasi</label>
              <select
                className="w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-muted)] px-3 py-2 text-sm text-[var(--text-primary)]"
                value={addWalletLocation}
                onChange={(event) => setAddWalletLocation(event.target.value)}
              >
                <option>Lokal</option>
                <option>Internasional</option>
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
              onClick={handleAddWallet}
              disabled={addWalletLoading}
            >
              {addWalletLoading ? "Menyimpan..." : "Simpan"}
            </button>
            <button
              type="button"
              className="rounded-lg border border-[var(--border-soft)] px-4 py-2 text-sm text-[var(--text-dimmed)]"
              onClick={() => setShowAddModal(false)}
              disabled={addWalletLoading}
            >
              Batal
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function MobileWalletCard({
  wallet,
  stats,
  disabled,
}: {
  wallet: Wallet;
  stats?: { income: number; expense: number; balance: number };
  disabled?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(wallet.name);
  const [renameError, setRenameError] = useState("");
  const [deleteValue, setDeleteValue] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const handleRename = async () => {
    const name = renameValue.trim();
    if (!name) {
      setRenameError("Nama dompet wajib diisi.");
      return;
    }
    try {
      await budgetActions.updateWallet(wallet.id, { name });
      setRenameOpen(false);
    } catch (error) {
      setRenameError(error instanceof Error ? error.message : "Gagal mengganti nama.");
    }
  };

  const handleDelete = async () => {
    if (wallet.isDefault) {
      setDeleteError("Dompet default tidak dapat dihapus.");
      return;
    }
    if (deleteValue.trim() !== wallet.name) {
      setDeleteError("Nama dompet belum sesuai.");
      return;
    }
    try {
      await budgetActions.deleteWallet(wallet.id);
      setDeleteOpen(false);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Gagal menghapus dompet.");
    }
  };

  useEffect(() => {
    if (renameOpen) {
      setRenameValue(wallet.name);
      setRenameError("");
    }
  }, [renameOpen, wallet.name]);

  useEffect(() => {
    if (deleteOpen) {
      setDeleteValue("");
      setDeleteError("");
    }
  }, [deleteOpen]);

  return (
    <>
      <div className="rounded-2xl bg-gradient-to-br from-blue-700 to-blue-900 p-5 text-white shadow-lg shadow-black/20">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-lg font-bold">{wallet.name}</p>
            <p className="text-xs text-white/70">Total Saldo</p>
          </div>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              className="rounded-lg border border-white/30 px-2 py-1 text-white/70"
              onClick={() => setMenuOpen((prev) => !prev)}
              disabled={disabled}
            >
              ⋮
            </button>
            {menuOpen ? (
              <div className="absolute right-0 mt-2 w-36 rounded-xl border border-white/20 bg-[#0f172a] p-2 text-sm">
                <button
                  type="button"
                  className="w-full rounded-lg px-3 py-2 text-left hover:bg-white/10"
                  onClick={() => {
                    setMenuOpen(false);
                    setRenameOpen(true);
                  }}
                >
                  Edit nama
                </button>
                <button
                  type="button"
                  className="w-full rounded-lg px-3 py-2 text-left text-rose-300 hover:bg-rose-500/20"
                  onClick={() => {
                    setMenuOpen(false);
                    setDeleteOpen(true);
                  }}
                >
                  Hapus
                </button>
              </div>
            ) : null}
          </div>
        </div>
        <p className="mt-2 text-2xl font-bold" style={{ letterSpacing: "1.1px" }}>
          {formatCurrency(stats?.balance ?? 0)}
        </p>
        <div className="mt-4 border-t border-white/30 pt-3">
          <div className="flex items-center justify-between text-xs text-white/70">
            <div className="flex items-center gap-1">
              <span className="text-emerald-300">●</span>
              Pemasukan
            </div>
            <span className="text-sm font-semibold text-white">
              {formatCurrency(stats?.income ?? 0)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-white/70">
            <div className="flex items-center gap-1">
              <span className="text-rose-300">●</span>
              Pengeluaran
            </div>
            <span className="text-sm font-semibold text-white">
              {formatCurrency(stats?.expense ?? 0)}
            </span>
          </div>
        </div>
        <Link
          href={`/transactions/${wallet.id}`}
          className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-white/80 hover:text-white"
        >
          Lihat detail
          <span>→</span>
        </Link>
      </div>

      <Modal open={renameOpen} title="Ganti Nama Dompet" onClose={() => setRenameOpen(false)} sizeClassName="max-w-md">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-[var(--text-dimmed)]">Nama Dompet</label>
            <input
              className="w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-muted)] px-3 py-2 text-sm text-[var(--text-primary)]"
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
            />
            {renameError ? <p className="text-xs text-rose-400">{renameError}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
              onClick={handleRename}
            >
              Simpan
            </button>
            <button
              type="button"
              className="rounded-lg border border-[var(--border-soft)] px-4 py-2 text-sm text-[var(--text-dimmed)]"
              onClick={() => setRenameOpen(false)}
            >
              Batal
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={deleteOpen} title="Hapus Dompet" onClose={() => setDeleteOpen(false)} sizeClassName="max-w-md">
        <div className="space-y-4 text-sm text-[var(--text-dimmed)]">
          <p>
            Ketik nama dompet <span className="font-semibold text-[var(--text-primary)]">{wallet.name}</span> untuk
            melanjutkan penghapusan.
          </p>
          <input
            className="w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-muted)] px-3 py-2 text-sm text-[var(--text-primary)]"
            placeholder="Tulis nama dompet"
            value={deleteValue}
            onChange={(event) => setDeleteValue(event.target.value)}
          />
          {deleteError ? <p className="text-xs text-rose-400">{deleteError}</p> : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
              onClick={handleDelete}
              disabled={wallet.isDefault}
            >
              Hapus
            </button>
            <button
              type="button"
              className="rounded-lg border border-[var(--border-soft)] px-4 py-2 text-sm text-[var(--text-dimmed)]"
              onClick={() => setDeleteOpen(false)}
            >
              Batal
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
