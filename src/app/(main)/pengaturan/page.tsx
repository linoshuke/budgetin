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
      <div className="glass-panel flex flex-col gap-4 p-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="h-24 w-24 rounded-full bg-indigo-500/20" />
            <button
              className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-white"
              onClick={() => openModal("editName")}
            >
              <Camera size={16} />
            </button>
          </div>
          <div>
            <p className="text-sm text-[var(--text-dimmed)]">Nama</p>
            <p className="text-lg font-semibold">{displayName}</p>
          </div>
        </div>
      </div>

      <div className="glass-panel space-y-3 p-6">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Account Management</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" icon={<Link2 size={16} />}>Link Google</Button>
          <Button variant="outline" icon={<KeyRound size={16} />}>Tambah Password</Button>
          <Button variant="danger" icon={<LogOut size={16} />} onClick={handleLogout}>Logout</Button>
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
            <button className="text-xs text-indigo-300">Lupa Password?</button>
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
