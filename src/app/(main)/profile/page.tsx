"use client";

import { useEffect, useState } from "react";
import AuthGate from "@/components/shared/AuthGate";
import Modal from "@/components/shared/Modal";
import LockWidget from "@/components/LockWidget";
import { formatDate, toCsvRow } from "@/lib/utils";
import { budgetActions, useBudgetStore } from "@/store/budgetStore";
import type { Transaction } from "@/types/transaction";
import type { User } from "@supabase/supabase-js";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getPublicOrigin } from "@/lib/public-url";

function getProvider(user: User | null) {
  if (user?.is_anonymous) return "anonim";
  const providers = user?.app_metadata?.providers as string[] | undefined;
  return providers?.[0] ?? "email";
}

export default function ProfilePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const categories = useBudgetStore((state) => state.categories);
  const wallets = useBudgetStore((state) => state.wallets);
  const { user: authUser, loading: authLoading, displayName, avatarUrl, initials, isAnonymous } = useAuth();
  const loadingUser = authLoading;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountNotice, setAccountNotice] = useState("");
  const [accountError, setAccountError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [linkingGoogle, setLinkingGoogle] = useState(false);
  const [linkNotice, setLinkNotice] = useState("");
  const [linkError, setLinkError] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [showEditName, setShowEditName] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    setName(displayName);
    setEmail(authUser?.email ?? "");
  }, [authLoading, authUser?.email, displayName]);

  useEffect(() => {
    const linked = searchParams?.get("linked");
    if (linked !== "google") return;
    setLinkNotice("Google berhasil terhubung.");
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("linked");
      router.replace(`${url.pathname}${url.search}` as import("next").Route);
    } catch {
      // ignore cleanup errors
    }
  }, [router, searchParams]);

  const provider = getProvider(authUser ?? null);
  const providers = (authUser?.app_metadata?.providers as string[] | undefined) ?? [];
  const isEmailProvider = providers.includes("email");
  const identities = authUser?.identities ?? [];
  const googleIdentity = identities.find((identity) => identity.provider === "google");
  const hasGoogle = Boolean(googleIdentity) || providers.includes("google");
  const canUnlinkGoogle = hasGoogle && isEmailProvider;
  const canChangePassword = !isAnonymous && isEmailProvider;
  const isVerified = Boolean(authUser?.email_confirmed_at);
  const verificationLabel = isAnonymous ? "Anonim" : isVerified ? "Terverifikasi" : "Belum terverifikasi";
  const createdDate = authUser?.created_at ? formatDate(authUser.created_at, true) : "-";
  const nextParam = pathname && pathname !== "/" ? `?next=${encodeURIComponent(pathname)}` : "";
  const emailChanged = Boolean(authUser?.email && email.trim() && email.trim() !== authUser.email);

  const exportCsv = async () => {
    try {
      const categoryMap = new Map(categories.map((item) => [item.id, item.name]));
      const walletMap = new Map(wallets.map((item) => [item.id, item.name]));
      const header = ["Tanggal", "Jenis", "Kategori", "Dompet", "Nominal", "Catatan"];

      const allTransactions: Transaction[] = [];
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const params = new URLSearchParams({
          limit: "500",
          offset: String(offset),
        });
        const response = await fetch(`/api/transactions?${params.toString()}`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const payload = (await response.json()) as {
          items: Transaction[];
          hasMore: boolean;
          nextOffset: number | null;
        };
        const items = payload.items ?? [];
        allTransactions.push(...items);
        hasMore = Boolean(payload.hasMore);
        if (!payload.nextOffset) break;
        offset = payload.nextOffset;
        if (offset > 10_000) break;
      }

      const rows = allTransactions.map((item) => [
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
    } catch (error) {
      console.error("Gagal mengekspor data:", error);
      alert("Gagal mengekspor data transaksi.");
    }
  };

  const handleSaveAccount = async () => {
    if (!authUser) return;

    setSavingAccount(true);
    setAccountError("");
    setAccountNotice("");

    try {
      const nextName = name.trim();
      const nextEmail = email.trim();

      const metadataResponse = await fetch("/api/auth/metadata-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: nextName }),
      });
      if (!metadataResponse.ok) {
        const payload = await metadataResponse.json().catch(() => ({}));
        throw new Error((payload as { error?: string }).error ?? `HTTP ${metadataResponse.status}`);
      }

      if (nextEmail && nextEmail !== authUser.email) {
        if (isAnonymous) {
          throw new Error("Akun anonim tidak dapat mengganti email. Silakan upgrade akun terlebih dahulu.");
        }
        if (!isEmailProvider) {
          throw new Error("Perubahan email hanya tersedia untuk akun email/password.");
        }
        if (!currentPassword) {
          throw new Error("Masukkan kata sandi saat ini untuk mengganti email.");
        }

        const response = await fetch("/api/auth/email-update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: nextEmail, currentPassword }),
        });
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        if (!response.ok) {
          throw new Error(payload.error ?? "Gagal memperbarui email.");
        }

        setAccountNotice("Perubahan email dikirim. Cek email baru Anda untuk konfirmasi.");
      } else {
        setAccountNotice("Informasi akun berhasil diperbarui.");
      }

      try {
        await budgetActions.updateProfile({ name: nextName, email: nextEmail });
      } catch (err) {
        console.warn("Sinkronisasi profil lokal gagal:", err);
      }

      window.dispatchEvent(new Event("auth:changed"));
      setName(nextName || displayName);
      setEmail(nextEmail);
      setShowEditName(false);
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : "Gagal memperbarui akun.");
    } finally {
      setSavingAccount(false);
      setCurrentPassword("");
    }
  };

  const handleLinkGoogle = async () => {
    setLinkingGoogle(true);
    setLinkError("");
    setLinkNotice("");

    try {
      const redirectTo = `${getPublicOrigin()}/auth/callback?next=${encodeURIComponent(
        "/profile?linked=google",
      )}`;
      const response = await fetch("/api/auth/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ provider: "google", redirectTo }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string; url?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Gagal memulai link Google.");
      }
      if (!payload.url) {
        throw new Error("Tautan Google tidak tersedia.");
      }
      window.location.href = payload.url;
    } catch (error) {
      setLinkError(error instanceof Error ? error.message : "Gagal menghubungkan Google.");
      setLinkingGoogle(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    if (!googleIdentity?.identity_id) {
      setLinkError("Identitas Google tidak ditemukan.");
      return;
    }
    if (!canUnlinkGoogle) {
      setLinkError("Tambahkan login email/password sebelum memutuskan Google.");
      return;
    }

    setLinkingGoogle(true);
    setLinkError("");
    setLinkNotice("");

    try {
      const response = await fetch("/api/auth/unlink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ identityId: googleIdentity.identity_id }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Gagal memutuskan Google.");
      }
      setLinkNotice("Google berhasil diputuskan.");
      window.dispatchEvent(new Event("auth:changed"));
    } catch (error) {
      setLinkError(error instanceof Error ? error.message : "Gagal memutuskan Google.");
    } finally {
      setLinkingGoogle(false);
    }
  };

  const handleChangePassword = async () => {
    setSavingPassword(true);
    setPasswordError("");
    setPasswordNotice("");

    const passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordPolicy.test(newPassword)) {
      setSavingPassword(false);
      setPasswordError("Kata sandi minimal 8 karakter dengan huruf besar, huruf kecil, dan angka.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setSavingPassword(false);
      setPasswordError("Konfirmasi kata sandi tidak sama.");
      return;
    }

    try {
      const response = await fetch("/api/auth/password-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: newPassword }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Gagal memperbarui kata sandi.");
      }
    } catch (error) {
      setSavingPassword(false);
      setPasswordError(error instanceof Error ? error.message : "Gagal memperbarui kata sandi.");
      return;
    }
    setSavingPassword(false);

    setNewPassword("");
    setConfirmPassword("");
    setPasswordNotice("Kata sandi berhasil diubah.");
    setShowPasswordModal(false);
  };

  const handleUpgradeAccount = () => {
    router.push((`/login${nextParam}`) as import("next").Route);
  };

  if (!authUser && !loadingUser) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LockWidget message="Masuk untuk mengelola profil." />
      </div>
    );
  }

  return (
    <AuthGate requireAuth>
      <div className="space-y-8">
        <header className="space-y-2">
          <h1 className="font-headline text-3xl font-extrabold text-on-surface">Profil</h1>
          <p className="text-sm text-on-surface-variant">Kelola informasi akun dan keamanan Anda.</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-12">
          <section className="rounded-2xl border border-outline-variant/5 bg-surface-container-low p-6 lg:col-span-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt="Foto profil"
                    className="h-20 w-20 rounded-3xl border border-outline-variant/20 object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-secondary-container text-lg font-semibold text-on-primary">
                    {initials}
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Profil</p>
                <h2 className="text-xl font-semibold text-on-surface">
                  {name.trim() || "Pengguna Budgetin"}
                </h2>
                <p className="text-sm text-on-surface-variant">{email || "-"}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs text-on-surface-variant">
              <span className="rounded-full border border-outline-variant/20 bg-surface-container px-3 py-1">
                Provider: {provider}
              </span>
              <span className="rounded-full border border-outline-variant/20 bg-surface-container px-3 py-1">
                Verifikasi: {verificationLabel}
              </span>
              <span className="rounded-full border border-outline-variant/20 bg-surface-container px-3 py-1">
                Bergabung: {createdDate}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowEditName(true)}
              disabled={loadingUser}
              className="mt-5 w-full rounded-lg bg-primary px-4 py-3 text-sm font-bold text-on-primary transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              Ubah Profil
            </button>
          </section>

          <section className="space-y-6 lg:col-span-8">
            {isAnonymous ? (
              <div className="rounded-2xl border border-primary/20 bg-primary/10 p-6">
                <h2 className="font-headline text-lg font-bold text-on-surface">Simpan Data Permanen</h2>
                <p className="mt-2 text-sm text-on-surface-variant">
                  Akun Anda masih anonim. Hubungkan dengan email atau OAuth agar data tersimpan aman dan bisa dipulihkan kapan pun.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleUpgradeAccount}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary"
                  >
                    Simpan Data Permanen
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push((`/register${nextParam}`) as import("next").Route)}
                    className="rounded-lg border border-outline-variant/30 px-4 py-2 text-sm text-on-surface-variant hover:text-on-surface"
                  >
                    Buat Akun Baru
                  </button>
                </div>
              </div>
            ) : null}
            <div className="rounded-2xl border border-outline-variant/5 bg-surface-container-low p-6">
              <h2 className="font-headline text-lg font-bold text-on-surface">Account Management</h2>
              {linkError ? (
                <p className="mt-4 rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
                  {linkError}
                </p>
              ) : null}
              {linkNotice ? (
                <p className="mt-4 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
                  {linkNotice}
                </p>
              ) : null}
              <div className="mt-4 grid gap-3">
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-xl border border-outline-variant/10 bg-surface-container px-4 py-3 text-sm text-on-surface transition-colors hover:bg-surface-container-high"
                  onClick={() => router.push("/pengaturan")}
                >
                  Pengaturan Aplikasi
                  <span className="text-on-surface-variant">&gt;</span>
                </button>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-xl border border-outline-variant/10 bg-surface-container px-4 py-3 text-sm text-on-surface transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={hasGoogle ? handleUnlinkGoogle : handleLinkGoogle}
                  disabled={linkingGoogle}
                >
                  {hasGoogle ? "Putuskan Google" : "Hubungkan Google"}
                  <span className="text-on-surface-variant">&gt;</span>
                </button>
                {!hasGoogle ? (
                  <p className="text-xs text-on-surface-variant">
                    Hubungkan Google agar login lebih cepat tanpa kata sandi.
                  </p>
                ) : null}
                {hasGoogle && !canUnlinkGoogle ? (
                  <p className="text-xs text-on-surface-variant">
                    Tambahkan login email/password sebelum memutuskan Google agar akses tetap aman.
                  </p>
                ) : null}
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-xl border border-outline-variant/10 bg-surface-container px-4 py-3 text-sm text-on-surface transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => setShowPasswordModal(true)}
                  disabled={!canChangePassword}
                >
                  Ubah Password
                  <span className="text-on-surface-variant">&gt;</span>
                </button>
                {!canChangePassword ? (
                  <p className="text-xs text-on-surface-variant">
                    {isAnonymous
                      ? "Upgrade akun untuk mengatur kata sandi."
                      : "Password hanya tersedia untuk akun email/password."}
                  </p>
                ) : null}
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-xl border border-outline-variant/10 bg-surface-container px-4 py-3 text-sm text-on-surface transition-colors hover:bg-surface-container-high"
                  onClick={exportCsv}
                >
                  Ekspor Data
                  <span className="text-on-surface-variant">&gt;</span>
                </button>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error transition-colors hover:bg-error/20"
                  onClick={async () => {
                    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
                    window.dispatchEvent(new Event("auth:changed"));
                    router.replace("/login");
                  }}
                >
                  Logout
                  <span>&gt;</span>
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-error/30 bg-error/10 p-6">
              <h2 className="font-headline text-lg font-bold text-error">Danger Zone</h2>
              <p className="mt-2 text-sm text-error/80">
                Hapus akun akan menghapus semua data permanen. Aksi ini belum tersedia.
              </p>
              <button
                type="button"
                className="mt-4 w-full rounded-xl border border-error/40 px-4 py-3 text-sm font-semibold text-error"
                onClick={() => alert("Hapus akun belum tersedia.")}
              >
                Hapus Akun
              </button>
            </div>
          </section>
        </div>
      </div>

      <Modal
        open={showEditName}
        title="Ubah Profil"
        onClose={() => setShowEditName(false)}
        sizeClassName="max-w-md"
      >
        <div className="space-y-4">
          {accountError ? (
            <p className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
              {accountError}
            </p>
          ) : null}
          {accountNotice ? (
            <p className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
              {accountNotice}
            </p>
          ) : null}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
              Nama Tampilan
            </label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nama lengkap"
              className="w-full rounded-lg border border-outline-variant/20 bg-surface-container px-3 py-2 text-sm text-on-surface"
              disabled={loadingUser}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nama@email.com"
              className="w-full rounded-lg border border-outline-variant/20 bg-surface-container px-3 py-2 text-sm text-on-surface disabled:opacity-60"
              disabled={loadingUser || isAnonymous || !isEmailProvider}
            />
            {!isAnonymous && !isEmailProvider ? (
              <p className="text-xs text-on-surface-variant">
                Akun OAuth mengelola email dari penyedia. Perubahan email tidak tersedia di sini.
              </p>
            ) : null}
          </div>
          {emailChanged ? (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                Kata Sandi Saat Ini
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="Masukkan kata sandi saat ini"
                className="w-full rounded-lg border border-outline-variant/20 bg-surface-container px-3 py-2 text-sm text-on-surface"
                disabled={savingAccount || !isEmailProvider}
              />
              <p className="text-xs text-on-surface-variant">
                Wajib diisi untuk mengganti email.
              </p>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSaveAccount}
              disabled={savingAccount || loadingUser}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-60"
            >
              {savingAccount ? "Menyimpan..." : "Simpan"}
            </button>
            <button
              type="button"
              onClick={() => setShowEditName(false)}
              className="rounded-lg border border-outline-variant/30 px-4 py-2 text-sm text-on-surface-variant hover:text-on-surface"
              disabled={savingAccount}
            >
              Batal
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={showPasswordModal}
        title="Ubah Password"
        onClose={() => setShowPasswordModal(false)}
        sizeClassName="max-w-md"
      >
        <div className="space-y-4">
          {passwordError ? (
            <p className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
              {passwordError}
            </p>
          ) : null}
          {passwordNotice ? (
            <p className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
              {passwordNotice}
            </p>
          ) : null}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
              Kata Sandi Baru
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="Min. 8 karakter + huruf besar & angka"
              className="w-full rounded-lg border border-outline-variant/20 bg-surface-container px-3 py-2 text-sm text-on-surface"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
              Konfirmasi Kata Sandi
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Ulangi kata sandi"
              className="w-full rounded-lg border border-outline-variant/20 bg-surface-container px-3 py-2 text-sm text-on-surface"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleChangePassword}
              disabled={savingPassword}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-60"
            >
              {savingPassword ? "Menyimpan..." : "Simpan"}
            </button>
            <button
              type="button"
              onClick={() => setShowPasswordModal(false)}
              className="rounded-lg border border-outline-variant/30 px-4 py-2 text-sm text-on-surface-variant hover:text-on-surface"
              disabled={savingPassword}
            >
              Batal
            </button>
          </div>
        </div>
      </Modal>
    </AuthGate>
  );
}
