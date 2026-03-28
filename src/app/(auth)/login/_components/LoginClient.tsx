"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { KeyRound, MailCheck, ShieldCheck } from "lucide-react";
import LoginForm from "./LoginForm";
import ForgotPasswordForm from "./ForgotPasswordForm";
import ResetPasswordForm from "./ResetPasswordForm";
import { supabase } from "@/lib/supabase/client";

type Mode = "login" | "forgot" | "reset";

/** Sanitasi redirect path untuk mencegah open redirect attack. */
function sanitizeRedirect(path: string | null): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return "/";
  if (/^\/\\/.test(path)) return "/";
  return path;
}

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => sanitizeRedirect(searchParams.get("next")), [searchParams]);
  const modeParam = useMemo(() => searchParams.get("mode"), [searchParams]);
  const [mode, setModeState] = useState<Mode>(() => {
    if (modeParam === "reset") return "reset";
    if (modeParam === "forgot") return "forgot";
    return "login";
  });

  useEffect(() => {
    if (modeParam === "reset") {
      setModeState("reset");
      return;
    }
    if (modeParam === "forgot") {
      setModeState("forgot");
      return;
    }
    setModeState("login");
  }, [modeParam]);

  useEffect(() => {
    let active = true;

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data.session && modeParam !== "reset") {
        router.replace(nextPath as Route);
      }
    };

    checkSession();

    return () => {
      active = false;
    };
  }, [modeParam, nextPath, router]);

  const setMode = (nextMode: Mode) => {
    setModeState(nextMode);
    const params = new URLSearchParams();
    if (nextPath && nextPath !== "/") {
      params.set("next", nextPath);
    }
    if (nextMode !== "login") {
      params.set("mode", nextMode);
    }
    const query = params.toString();
    router.replace(query ? `/login?${query}` : "/login");
  };

  const viewMeta = useMemo(() => {
    if (mode === "forgot") {
      return {
        label: "Lupa Password",
        title: "Pulihkan akses Anda",
        description: "Masukkan email terdaftar untuk menerima tautan reset kata sandi.",
        Icon: MailCheck,
      };
    }
    if (mode === "reset") {
      return {
        label: "Reset Password",
        title: "Buat kata sandi baru",
        description: "Pastikan kata sandi baru aman dan mudah Anda ingat.",
        Icon: ShieldCheck,
      };
    }
    return {
      label: "Masuk",
      title: "Selamat datang kembali",
      description: "Lanjutkan pengelolaan cashflow dan pantau dompet Anda.",
      Icon: KeyRound,
    };
  }, [mode]);

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="flex min-h-screen items-center justify-center px-6 lg:px-8">
        <section className="w-full max-w-md">
          <header className="mb-6 text-center">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-dimmed)]">Budgetin</p>
            <h1 className="mt-2 text-base font-semibold text-[var(--text-primary)]">{viewMeta.label}</h1>
          </header>

          <main className="space-y-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600/15 text-indigo-500">
                <viewMeta.Icon size={36} />
              </div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">{viewMeta.title}</h2>
              <p className="text-sm text-[var(--text-dimmed)]">{viewMeta.description}</p>
            </div>

            {mode === "login" ? (
              <LoginForm nextPath={nextPath} onForgotPassword={() => setMode("forgot")} />
            ) : null}
            {mode === "forgot" ? (
              <ForgotPasswordForm nextPath={nextPath} onBack={() => setMode("login")} />
            ) : null}
            {mode === "reset" ? (
              <ResetPasswordForm
                onSuccess={() => {
                  window.setTimeout(() => {
                    router.replace(nextPath as Route);
                  }, 1200);
                }}
              />
            ) : null}
          </main>
        </section>
      </div>
    </div>
  );
}
