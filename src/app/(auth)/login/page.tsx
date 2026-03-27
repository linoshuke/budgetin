"use client";

import ForgotPasswordForm from "@/app/(auth)/login/_components/ForgotPasswordForm";
import LoginForm from "@/app/(auth)/login/_components/LoginForm";
import ResetPasswordForm from "@/app/(auth)/login/_components/ResetPasswordForm";
import { supabase } from "@/lib/supabase";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type AuthMode = "login" | "forgot" | "reset";

function toMode(raw: string | null): AuthMode {
  if (raw === "forgot") return "forgot";
  if (raw === "reset") return "reset";
  return "login";
}

/** Sanitasi redirect path untuk mencegah open redirect attack. */
function sanitizeRedirect(path: string | null): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return "/";
  if (/^\/\\/.test(path)) return "/";
  return path;
}

const modeTitle: Record<AuthMode, string> = {
  login: "Selamat Datang!",
  forgot: "Lupa Password?",
  reset: "Atur Ulang Kata Sandi",
};

const modeSubtitle: Record<AuthMode, string> = {
  login: "Login dengan email atau lanjutkan dengan Google.",
  forgot: "Masukkan email akun untuk menerima tautan reset.",
  reset: "Gunakan kata sandi baru untuk melanjutkan.",
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextPath = useMemo(() => sanitizeRedirect(searchParams.get("next")), [searchParams]);
  const [mode, setMode] = useState<AuthMode>(toMode(searchParams.get("mode")));

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
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (!active) return;

        if (exchangeError) return;

        if (mode === "reset") {
          switchMode("reset");
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
        switchMode("reset");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, nextPath]);

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-12">
        <section className="lg:col-span-5 lg:border-r lg:border-[var(--border-soft)]">
          <header className="sticky top-0 z-10 bg-transparent px-5 py-4 lg:static lg:z-auto lg:px-8 lg:pt-10">
            <h1 className="text-base font-semibold text-[var(--text-primary)]">
              {mode === "login" ? "Masuk" : mode === "forgot" ? "Lupa Password" : "Reset Password"}
            </h1>
          </header>

          <main className="flex justify-center px-6 pb-10 lg:px-8 lg:pb-16">
            <div className="w-full max-w-md space-y-6 lg:max-w-sm">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600/15 text-indigo-500">
                  <svg viewBox="0 0 24 24" width={40} height={40} aria-hidden="true">
                    <rect x="3.5" y="6.5" width="17" height="11" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M16 10.5h4.5v3H16" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">{modeTitle[mode]}</h2>
                <p className="text-sm text-[var(--text-dimmed)]">{modeSubtitle[mode]}</p>
              </div>

              {mode === "forgot" ? (
                <ForgotPasswordForm
                  nextPath={nextPath}
                  onBack={() => switchMode("login")}
                />
              ) : mode === "reset" ? (
                <ResetPasswordForm
                  onSuccess={() => router.replace(nextPath as Route)}
                />
              ) : (
                <LoginForm
                  nextPath={nextPath}
                  onForgotPassword={() => switchMode("forgot")}
                />
              )}
            </div>
          </main>
        </section>

        <aside className="relative hidden lg:col-span-7 lg:flex lg:items-center lg:justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-blue-600/10 to-indigo-600/10" />
          <div className="relative z-10 max-w-md space-y-4 px-8 text-center">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-dimmed)]">Budgetin</p>
            <h2 className="text-3xl font-semibold text-[var(--text-primary)]">Kelola uang dengan fokus.</h2>
            <p className="text-sm text-[var(--text-dimmed)]">
              Dashboard responsif, laporan jelas, dan catat transaksi dalam hitungan detik.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}