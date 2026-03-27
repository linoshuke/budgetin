"use client";

import { useState } from "react";
import { Camera, LogOut, Link2, KeyRound, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import EditNameDialog from "@/components/modals/EditNameDialog";
import LockWidget from "@/components/LockWidget";
import { useAuth } from "@/hooks/useAuth";
import { useUIStore } from "@/stores/uiStore";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { user, displayName } = useAuth();
  const router = useRouter();
  const openModal = useUIStore((state) => state.openModal);
  const pushToast = useUIStore((state) => state.pushToast);
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");

  if (!user) {
    return <LockWidget message="Masuk untuk mengelola pengaturan akun." />;
  }

  const isGoogle = user.app_metadata?.provider === "google";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleDelete = async () => {
    await supabase.auth.signOut();
    pushToast({ title: "Permintaan penghapusan diproses", description: "Akun Anda telah keluar dari sesi." });
    router.push("/login");
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative">
            <div className="h-24 w-24 rounded-full bg-[var(--bg-card-muted)]" />
            <button
              className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-indigo)] text-white"
              onClick={() => openModal("editName")}
            >
              <Camera size={16} />
            </button>
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <p className="text-xs text-[var(--text-dimmed)]">Nama</p>
              <p className="font-display text-xl font-semibold text-[var(--text-primary)]">{displayName}</p>
            </div>
            <Button variant="outline" onClick={() => openModal("editName")}>
              Ubah Nama
            </Button>
          </div>
        </div>
      </div>

      <div className="glass-panel space-y-3 p-6">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Account Management</h3>
        <div className="grid gap-3">
          <button className="flex items-center justify-between rounded-2xl border border-white/10 bg-[var(--bg-card-muted)] px-4 py-3 text-sm text-[var(--text-primary)]">
            <span className="flex items-center gap-3">
              <Link2 size={18} className="text-[var(--accent-primary)]" />
              Link Google
            </span>
            <span className="text-xs text-[var(--text-dimmed)]">Opsional</span>
          </button>
          <button className="flex items-center justify-between rounded-2xl border border-white/10 bg-[var(--bg-card-muted)] px-4 py-3 text-sm text-[var(--text-primary)]">
            <span className="flex items-center gap-3">
              <KeyRound size={18} className="text-[var(--accent-indigo)]" />
              Tambah Password
            </span>
            <span className="text-xs text-[var(--text-dimmed)]">Keamanan</span>
          </button>
          <Button variant="danger" icon={<LogOut size={16} />} onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      <div className="glass-panel space-y-4 border border-rose-500/30 p-6">
        <div className="flex items-center gap-2 text-rose-200">
          <Trash2 size={18} />
          <h3 className="text-sm font-semibold">Danger Zone</h3>
        </div>
        {isGoogle ? (
          <div className="space-y-3">
            <p className="text-sm text-[var(--text-dimmed)]">Ketik "hapus akun saya" untuk konfirmasi.</p>
            <Input value={confirmText} onChange={(event) => setConfirmText(event.target.value)} />
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-[var(--text-dimmed)]">Masukkan password untuk menghapus akun.</p>
            <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            <button className="text-xs text-[var(--accent-indigo)]">Lupa Password?</button>
          </div>
        )}
        <Button
          variant="danger"
          onClick={handleDelete}
          disabled={isGoogle ? confirmText !== "hapus akun saya" : password.length < 6}
        >
          Hapus Akun
        </Button>
      </div>

      <EditNameDialog
        onSave={(value) => pushToast({ title: "Nama diperbarui", description: value, variant: "success" })}
      />
    </div>
  );
}
