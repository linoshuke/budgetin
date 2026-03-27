"use client";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { FormEvent, useEffect, useMemo, useState } from "react";

/** Sanitasi redirect path untuk mencegah open redirect attack. */
function sanitizeRedirect(path: string | null): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return "/";
  if (/^\/\\/.test(path)) return "/";
  return path;
}

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => sanitizeRedirect(searchParams.get("next")), [searchParams]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    let active = true;

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data.session) {
        router.replace(nextPath as Route);
      }
    };

    checkSession();

    return () => {
      active = false;
    };
  }, [nextPath, router]);

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");

    if (password.length < 8) {
      setLoading(false);
      setError("Kata sandi minimal 8 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setLoading(false);
      setError("Konfirmasi kata sandi tidak sama.");
      return;
    }

    const emailRedirectTo = `${window.location.origin}/login${nextPath && nextPath !== "/" ? `?next=${encodeURIComponent(nextPath)}` : ""}`;

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: name.trim() },
        emailRedirectTo,
      },
    });

    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      setLoading(false);
      router.replace(nextPath as Route);
      return;
    }

    const { data: loginData } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (loginData.session) {
      router.replace(nextPath as Route);
      return;
    }

    setNotice("Akun berhasil dibuat. Cek email Anda untuk verifikasi, lalu Anda akan langsung masuk setelah klik tautan.");
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

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <header className="sticky top-0 z-10 bg-transparent px-5 py-4">
        <h1 className="text-base font-semibold text-[var(--text-primary)]">Daftar</h1>
      </header>

      <main className="flex justify-center px-6 pb-10">
        <div className="w-full max-w-md space-y-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600/15 text-indigo-500">
              <svg viewBox="0 0 24 24" width={40} height={40} aria-hidden="true">
                <path
                  d="M12 5a4 4 0 1 1 0 8a4 4 0 0 1 0-8Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path
                  d="M4.5 20a7.5 7.5 0 0 1 15 0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
                <path
                  d="M18.5 6.5v4M16.5 8.5h4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Buat Akun Budgetin</h2>
            <p className="text-sm text-[var(--text-dimmed)]">
              Daftar dengan email atau Google, lalu verifikasi untuk mulai memakai aplikasi.
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

          <form className="space-y-4" onSubmit={handleRegister}>
            <div className="space-y-2">
              <label className="text-sm text-[var(--text-dimmed)]">Username</label>
              <Input
                placeholder="Nama lengkap"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
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
              <label className="text-sm text-[var(--text-dimmed)]">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimal 8 karakter"
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
            <div className="space-y-2">
              <label className="text-sm text-[var(--text-dimmed)]">Konfirmasi Password</label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Ulangi password"
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
              {loading ? "Memproses..." : "Daftar"}
            </Button>
          </form>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--border-soft)]" />
            <span className="text-xs text-[var(--text-dimmed)]">ATAU</span>
            <div className="h-px flex-1 bg-[var(--border-soft)]" />
          </div>

          <Button type="button" variant="outline" className="w-full" onClick={handleGoogle} disabled={loading}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/google.png" alt="" className="mr-2 inline h-5 w-5" />
            Daftar dengan Google
          </Button>

          <p className="text-center text-sm text-[var(--text-dimmed)]">
            Sudah punya akun?{" "}
            <Link
              href={nextPath && nextPath !== "/" ? `/login?next=${encodeURIComponent(nextPath)}` : "/login"}
              className="font-semibold text-indigo-400 hover:underline"
            >
              Masuk
            </Link>
          </p>

          <p className="text-center text-xs text-[var(--text-dimmed)]">
            Dengan mendaftar, Anda menyetujui{" "}
            <Link href="/privacy" className="underline">
              Kebijakan Privasi
            </Link>{" "}
            dan{" "}
            <Link href="/terms" className="underline">
              Ketentuan Layanan
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
