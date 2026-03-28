"use client";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";
import type { Route } from "next";
import { FormEvent, useState } from "react";

interface LoginFormProps {
  nextPath: string;
  onForgotPassword: () => void;
}

export default function LoginForm({ nextPath, onForgotPassword }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (signInError) {
      setError(signInError.message);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError("");

    const redirectTo = `${window.location.origin}/auth/callback${
      nextPath && nextPath !== "/" ? `?next=${encodeURIComponent(nextPath)}` : ""
    }`;
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
    <>
      {error ? (
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error}
        </div>
      ) : null}

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
          onClick={onForgotPassword}
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
    </>
  );
}
