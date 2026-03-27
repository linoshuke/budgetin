"use client";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { FormEvent, useEffect, useMemo, useState } from "react";

type AuthMode = "login" | "forgot" | "reset";

function toMode(raw: string | null): AuthMode {
  if (raw === "forgot") return "forgot";
  if (raw === "reset") return "reset";
  return "login";
}

/** Sanitasi redirect path untuk mencegah open redirect attack. */
function sanitizeRedirect(path: string | null): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return "/";
  // Tolak URL absolut yang tersembunyi (misal /\evil.com)
  if (/^\/\\/.test(path)) return "/";
  return path;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextPath = useMemo(() => sanitizeRedirect(searchParams.get("next")), [searchParams]);
  const [mode, setMode] = useState<AuthMode>(toMode(searchParams.get("mode")));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    const params = new URLSearchParams();
    if (nextPath && nextPath !== "/") params.set("next", nextPath);
    if (nextMode !== "login") params.set("mode", nextMode);
    const suffix = params.toString();
    router.replace(suffix ? `/login?${suffix}` : "/login");
  };

  useEffect(() => {
    setMode(toMode(searchParams.get("mode")));
  }, [searchParams]);

  useEffect(() => {
    let active = true;

    const boot = async () => {
      const code = searchParams.get("code");
      if (code) {
        setLoading(true);
        setError("");
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (!active) return;
        setLoading(false);

        if (exchangeError) {
          setError(exchangeError.message);
          return;
        }

        if (mode === "reset") {
          setNotice("Verifikasi berhasil. Masukkan kata sandi baru.");
          return;
        }

        router.replace(nextPath as Route);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data.session && mode !== "reset") {
        router.replace(nextPath as Route);
      }
    };

    boot();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (event === "PASSWORD_RECOVERY") {
        setMode("reset");
        const params = new URLSearchParams();
        if (nextPath && nextPath !== "/") params.set("next", nextPath);
        params.set("mode", "reset");
        router.replace(`/login?${params.toString()}`);
        setNotice("Silakan atur kata sandi baru untuk akun Anda.");
        return;
      }

      if (session && mode !== "reset") {
        router.replace(nextPath as Route);
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [mode, nextPath, router, searchParams]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.replace(nextPath as Route);
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError("");
    setNotice("");

    const redirectTo = `${window.location.origin}/login${nextPath && nextPath !== "/" ? `?next=${encodeURIComponent(nextPath)}` : ""}`;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    setLoading(false);
    if (oauthError) {
      setError(oauthError.message);
    }
  };

  const handleForgot = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");

    const redirectTo = `${window.location.origin}/login?mode=reset${nextPath && nextPath !== "/" ? `&next=${encodeURIComponent(nextPath)}` : ""}`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }

    setNotice("Email reset password sudah dikirim. Cek inbox/spam Anda.");
  };

  const handleReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");

    if (newPassword.length < 8) {
      setLoading(false);
      setError("Kata sandi baru minimal 8 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setLoading(false);
      setError("Konfirmasi kata sandi tidak sama.");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setNotice("Kata sandi berhasil diperbarui. Anda akan diarahkan ke dashboard.");
    router.replace(nextPath as Route);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <header className="sticky top-0 z-10 bg-transparent px-5 py-4">
        <h1 className="text-base font-semibold text-[var(--text-primary)]">Masuk</h1>
      </header>

      <main className="flex justify-center px-6 pb-10">
        <div className="w-full max-w-md space-y-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600/15 text-indigo-500">
              <svg viewBox="0 0 24 24" width={40} height={40} aria-hidden="true">
                <rect x="3.5" y="6.5" width="17" height="11" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
                <path d="M16 10.5h4.5v3H16" fill="none" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">
              {mode === "forgot" ? "Lupa Password?" : mode === "reset" ? "Atur Ulang Kata Sandi" : "Selamat Datang!"}
            </h2>
            <p className="text-sm text-[var(--text-dimmed)]">
              {mode === "forgot"
                ? "Masukkan email akun untuk menerima tautan reset."
                : mode === "reset"
                  ? "Gunakan kata sandi baru untuk melanjutkan."
                  : "Login dengan email atau lanjutkan dengan Google."}
            </p>
          </div>

          {error ? (
            <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              {error}
            </div>
          ) : null}
          {notice ? (
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
              {notice}
            </div>
          ) : null}

          {mode === "forgot" ? (
            <form className="space-y-4" onSubmit={handleForgot}>
              <div className="space-y-2">
                <label className="text-sm text-[var(--text-dimmed)]">Email</label>
                <Input
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Mengirim..." : "Kirim Tautan Reset"}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => switchMode("login")}
              >
                Kembali ke Login
              </Button>
            </form>
          ) : mode === "reset" ? (
            <form className="space-y-4" onSubmit={handleReset}>
              <div className="space-y-2">
                <label className="text-sm text-[var(--text-dimmed)]">Kata sandi baru</label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Minimal 8 karakter"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-dimmed)]"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                  >
                    {showNewPassword ? "Sembunyi" : "Lihat"}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-[var(--text-dimmed)]">Konfirmasi kata sandi</label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Ulangi kata sandi baru"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-dimmed)]"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                  >
                    {showConfirmPassword ? "Sembunyi" : "Lihat"}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Menyimpan..." : "Simpan Kata Sandi Baru"}
              </Button>
            </form>
          ) : (
            <>
              <form className="space-y-4" onSubmit={handleLogin}>
                <div className="space-y-2">
                  <label className="text-sm text-[var(--text-dimmed)]">Email</label>
                  <Input
                    type="email"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-[var(--text-dimmed)]">Kata sandi</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="********"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-dimmed)]"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? "Sembunyi" : "Lihat"}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  className="text-left text-sm text-indigo-400 hover:underline"
                  onClick={() => switchMode("forgot")}
                >
                  Lupa Password?
                </button>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Memproses..." : "Masuk"}
                </Button>
              </form>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-[var(--border-soft)]" />
                <span className="text-xs text-[var(--text-dimmed)]">ATAU</span>
                <div className="h-px flex-1 bg-[var(--border-soft)]" />
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
                onClick={handleGoogle}
                disabled={loading}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/google.png" alt="" className="h-5 w-5" />
                Lanjutkan dengan Google
              </Button>
            </>
          )}

          <p className="text-center text-sm text-[var(--text-dimmed)]">
            Belum punya akun?{" "}
            <Link
              href={nextPath && nextPath !== "/" ? `/register?next=${encodeURIComponent(nextPath)}` : "/register"}
              className="font-semibold text-indigo-400 hover:underline"
            >
              Daftar sekarang
            </Link>
          </p>

          <p className="text-center text-xs text-[var(--text-dimmed)]">
            Dengan masuk, Anda menyetujui{" "}
            <Link href={"/privacy" as Route} className="underline">
              Kebijakan Privasi
            </Link>{" "}
            dan{" "}
            <Link href={"/terms" as Route} className="underline">
              Ketentuan Layanan
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
