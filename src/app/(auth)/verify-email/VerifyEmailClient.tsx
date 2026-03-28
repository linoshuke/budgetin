"use client";

import { useEffect, useMemo, useState } from "react";
import { Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";
import { useUIStore } from "@/stores/uiStore";

export default function VerifyEmailClient() {
  const router = useRouter();
  const params = useSearchParams();
  const pushToast = useUIStore((state) => state.pushToast);
  const email = useMemo(() => params.get("email") ?? "", [params]);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    const check = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user?.email_confirmed_at) {
        router.replace("/beranda");
      }
    };

    check();
    interval = setInterval(check, 5000);

    const handleFocus = () => check();
    window.addEventListener("focus", handleFocus);

    return () => {
      if (interval) clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (!email) return;
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) {
      pushToast({ title: "Gagal kirim ulang", description: error.message, variant: "error" });
      return;
    }
    pushToast({ title: "Email verifikasi dikirim", description: "Silakan cek kotak masuk Anda." });
    setCooldown(60);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6 tablet:px-8">
      <div className="w-full max-w-[520px] rounded-3xl border border-white/10 bg-[var(--bg-card)] p-8 text-center shadow-2xl">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-[var(--accent-indigo)]/15">
          <Mail size={80} className="text-[var(--accent-indigo)]" />
        </div>
        <h1 className="font-display text-2xl font-semibold">Cek Email Anda</h1>
        <p className="mt-2 text-sm text-[var(--text-dimmed)]">
          Verifikasi email dikirim ke <span className="text-[var(--accent-indigo)]">{email || "alamat Anda"}</span>.
        </p>
        <Button
          className="mt-6 w-full"
          onClick={handleResend}
          disabled={cooldown > 0}
        >
          {cooldown > 0 ? `Kirim ulang dalam ${cooldown}s` : "Kirim Ulang Email"}
        </Button>
        <Button variant="ghost" className="mt-4 w-full" onClick={handleLogout}>
          Batal & Logout
        </Button>
      </div>
    </div>
  );
}
