"use client";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => searchParams.get("next") || "/", [searchParams]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data.session) {
        router.replace(nextPath);
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
      router.replace(nextPath);
      return;
    }

    const { data: loginData } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (loginData.session) {
      router.replace(nextPath);
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(20,184,166,0.24),transparent_35%),radial-gradient(circle_at_82%_10%,rgba(37,99,235,0.2),transparent_34%)]" />

      <div className="glass-panel relative z-10 w-full max-w-md space-y-6 p-6 sm:p-7">
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-dimmed)]">Budgetin Onboarding</p>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Buat Akun Budgetin</h1>
          <p className="text-sm text-[var(--text-dimmed)]">
            Daftar dengan email atau Google. Setelah verifikasi, akun bisa langsung masuk ke dashboard.
          </p>
        </header>

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
            <label className="text-sm text-[var(--text-dimmed)]">Nama</label>
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
            <label className="text-sm text-[var(--text-dimmed)]">Kata sandi</label>
            <Input
              type="password"
              placeholder="Minimal 8 karakter"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-[var(--text-dimmed)]">Konfirmasi kata sandi</label>
            <Input
              type="password"
              placeholder="Ulangi kata sandi"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Memproses..." : "Buat akun"}
          </Button>
        </form>

        <Button type="button" variant="outline" className="w-full" onClick={handleGoogle} disabled={loading}>
          Daftar dengan Google
        </Button>

        <p className="text-center text-sm text-[var(--text-dimmed)]">
          Sudah punya akun?{" "}
          <Link href={nextPath && nextPath !== "/" ? `/login?next=${encodeURIComponent(nextPath)}` : "/login"} className="text-teal-300 hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
