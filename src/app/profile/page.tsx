"use client";

import Header from "@/components/layout/Header";
import MobileAppBar from "@/app/_components/mobile/MobileAppBar";
import MobileBottomNav from "@/app/_components/mobile/MobileBottomNav";
import AuthGate from "@/components/shared/AuthGate";
import Modal from "@/components/shared/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { supabase } from "@/lib/supabase";
import { formatDate, toCsvRow } from "@/lib/utils";
import { budgetActions, useBudgetStore } from "@/store/budgetStore";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function getProvider(user: User | null) {
  const providers = user?.app_metadata?.providers as string[] | undefined;
  return providers?.[0] ?? "email";
}

function getAvatarUrl(user: User | null) {
  const provider = getProvider(user);
  if (provider !== "google") return "";
  const metadata = user?.user_metadata as Record<string, unknown> | undefined;
  const avatar = metadata?.avatar_url ?? metadata?.picture;
  return typeof avatar === "string" ? avatar : "";
}

function getDisplayName(user: User | null) {
  const metadata = user?.user_metadata as Record<string, unknown> | undefined;
  const fullName = metadata?.full_name ?? metadata?.name;
  return typeof fullName === "string" ? fullName : "";
}

function getInitials(name: string, email: string) {
  const source = name.trim() || email.trim() || "BU";
  const parts = source.split(" ").filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export default function ProfilePage() {
  const router = useRouter();
  const transactions = useBudgetStore((state) => state.transactions);
  const categories = useBudgetStore((state) => state.categories);
  const wallets = useBudgetStore((state) => state.wallets);

  const [authUser, setAuthUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountNotice, setAccountNotice] = useState("");
  const [accountError, setAccountError] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [showEditName, setShowEditName] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const categoryMap = useMemo(
    () => new Map(categories.map((item) => [item.id, item.name])),
    [categories],
  );
  const walletMap = useMemo(
    () => new Map(wallets.map((item) => [item.id, item.name])),
    [wallets],
  );

  useEffect(() => {
    let active = true;

    const hydrateUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;

      const user = data.user ?? null;
      setAuthUser(user);
      setName(getDisplayName(user));
      setEmail(user?.email ?? "");
      setLoadingUser(false);
    };

    hydrateUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setAuthUser(user);
      setName(getDisplayName(user));
      setEmail(user?.email ?? "");
      setLoadingUser(false);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const avatarUrl = getAvatarUrl(authUser);
  const provider = getProvider(authUser);
  const isVerified = Boolean(authUser?.email_confirmed_at);
  const createdDate = authUser?.created_at ? formatDate(authUser.created_at, true) : "-";

  const exportCsv = () => {
    const header = ["Tanggal", "Jenis", "Kategori", "Dompet", "Nominal", "Catatan"];
    const rows = transactions.map((item) => [
      formatDate(item.date, true),
      item.type === "income" ? "Pemasukan" : "Pengeluaran",
      categoryMap.get(item.categoryId) ?? "Tanpa kategori",
      walletMap.get(item.walletId) ?? "Tanpa dompet",
      item.amount,
      item.note ?? "",
    ]);

    const csv = [toCsvRow(header), ...rows.map((row) => toCsvRow(row))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `budgetin-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handleSaveAccount = async () => {
    if (!authUser) return;

    setSavingAccount(true);
    setAccountError("");
    setAccountNotice("");

    try {
      const nextName = name.trim();
      const nextEmail = email.trim();

      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          name: nextName,
          full_name: nextName,
        },
      });
      if (metadataError) throw metadataError;

      if (nextEmail && nextEmail !== authUser.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email: nextEmail });
        if (emailError) throw emailError;
        setAccountNotice("Perubahan email dikirim. Cek email baru Anda untuk konfirmasi.");
      } else {
        setAccountNotice("Informasi akun berhasil diperbarui.");
      }

      try {
        await budgetActions.updateProfile({ name: nextName, email: nextEmail });
      } catch (err) {
        console.warn("Sinkronisasi profil lokal gagal:", err);
      }

      const { data } = await supabase.auth.getUser();
      setAuthUser(data.user ?? null);
      setName(getDisplayName(data.user ?? null));
      setEmail(data.user?.email ?? nextEmail);
      setShowEditName(false);
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : "Gagal memperbarui akun.");
    } finally {
      setSavingAccount(false);
    }
  };

  const handleChangePassword = async () => {
    setSavingPassword(true);
    setPasswordError("");
    setPasswordNotice("");

    if (newPassword.length < 8) {
      setSavingPassword(false);
      setPasswordError("Kata sandi baru minimal 8 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setSavingPassword(false);
      setPasswordError("Konfirmasi kata sandi tidak sama.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);

    if (error) {
      setPasswordError(error.message);
      return;
    }

    setNewPassword("");
    setConfirmPassword("");
    setPasswordNotice("Kata sandi berhasil diubah.");
    setShowPasswordModal(false);
  };

  return (
    <AuthGate requireAuth>
      <div className="min-h-screen">
        <div className="hidden md:block">
          <Header />
        </div>
        <div className="md:hidden">
          <MobileAppBar title="Profil" />
        </div>

        <main className="page-shell">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <section className="glass-panel space-y-4 p-4 lg:col-span-5 lg:sticky lg:top-24">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt="Foto profil"
                      className="h-20 w-20 rounded-3xl border border-[var(--border-soft)] object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-teal-500 to-blue-600 text-lg font-semibold text-white">
                      {getInitials(name, email)}
                    </div>
                  )}
                  <button
                    type="button"
                    className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-soft)] bg-[var(--bg-card)] text-xs text-[var(--text-dimmed)]"
                    onClick={() => alert("Upload avatar belum tersedia.")}
                  >
                    ??
                  </button>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-dimmed)]">Profil</p>
                  <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
                    {name.trim() || "Pengguna Budgetin"}
                  </h1>
                  <p className="text-sm text-[var(--text-dimmed)]">{email || "-"}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-[var(--text-dimmed)]">
                <span className="rounded-full border border-[var(--border-soft)] bg-[var(--bg-card-muted)] px-3 py-1">
                  Provider: {provider}
                </span>
                <span className="rounded-full border border-[var(--border-soft)] bg-[var(--bg-card-muted)] px-3 py-1">
                  Verifikasi: {isVerified ? "Terverifikasi" : "Belum terverifikasi"}
                </span>
                <span className="rounded-full border border-[var(--border-soft)] bg-[var(--bg-card-muted)] px-3 py-1">
                  Bergabung: {createdDate}
                </span>
              </div>

              <Button onClick={() => setShowEditName(true)} disabled={loadingUser}>
                Ubah Nama
              </Button>
            </section>

            <div className="space-y-6 lg:col-span-7">
              <section className="glass-panel p-4">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Account Management</h2>
                <div className="mt-4 space-y-2">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-muted)] px-4 py-3 text-sm text-[var(--text-primary)]"
                    onClick={() => alert("Link Google belum tersedia.")}
                  >
                    Link Google
                    <span className="text-[var(--text-dimmed)]">â€º</span>
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-muted)] px-4 py-3 text-sm text-[var(--text-primary)]"
                    onClick={() => setShowPasswordModal(true)}
                  >
                    Tambah Password
                    <span className="text-[var(--text-dimmed)]">â€º</span>
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-muted)] px-4 py-3 text-sm text-[var(--text-primary)]"
                    onClick={exportCsv}
                  >
                    Ekspor Data
                    <span className="text-[var(--text-dimmed)]">â€º</span>
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card-muted)] px-4 py-3 text-sm text-rose-300"
                    onClick={async () => {
                      await supabase.auth.signOut();
                      router.replace("/login");
                    }}
                  >
                    Logout
                    <span>â€º</span>
                  </button>
                </div>
              </section>

              <section className="glass-panel p-4">
                <h2 className="text-lg font-semibold text-rose-300">Danger Zone</h2>
                <div className="mt-4">
                  <button
                    type="button"
                    className="w-full rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-300"
                    onClick={() => alert("Hapus akun belum tersedia.")}
                  >
                    Hapus Akun
                  </button>
                </div>
              </section>
            </div>
          </div>
        </main>

        <Modal
          open={showEditName}
          title="Ubah Nama"
          onClose={() => setShowEditName(false)}
          sizeClassName="max-w-md"
        >
          <div className="space-y-4">
            {accountError ? (
              <p className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                {accountError}
              </p>
            ) : null}
            {accountNotice ? (
              <p className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                {accountNotice}
              </p>
            ) : null}
            <div className="space-y-2">
              <label className="text-sm text-[var(--text-dimmed)]">Nama tampilan</label>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Nama lengkap"
                disabled={loadingUser}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSaveAccount} disabled={savingAccount || loadingUser}>
                {savingAccount ? "Menyimpan..." : "Simpan"}
              </Button>
              <Button variant="outline" onClick={() => setShowEditName(false)} disabled={savingAccount}>
                Batal
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          open={showPasswordModal}
          title="Tambah Password"
          onClose={() => setShowPasswordModal(false)}
          sizeClassName="max-w-md"
        >
          <div className="space-y-4">
            {passwordError ? (
              <p className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                {passwordError}
              </p>
            ) : null}
            {passwordNotice ? (
              <p className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                {passwordNotice}
              </p>
            ) : null}
            <div className="space-y-2">
              <label className="text-sm text-[var(--text-dimmed)]">Kata sandi baru</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Minimal 8 karakter"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-[var(--text-dimmed)]">Konfirmasi kata sandi</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Ulangi kata sandi"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleChangePassword} disabled={savingPassword}>
                {savingPassword ? "Menyimpan..." : "Simpan"}
              </Button>
              <Button variant="outline" onClick={() => setShowPasswordModal(false)} disabled={savingPassword}>
                Batal
              </Button>
            </div>
          </div>
        </Modal>

        <div className="md:hidden">
          <MobileBottomNav />
        </div>
      </div>
    </AuthGate>
  );
}
