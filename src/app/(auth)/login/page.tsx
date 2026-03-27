"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { WalletCards, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import PasswordResetDialog from "@/components/modals/PasswordResetDialog";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import WebViewScreen from "@/components/WebViewScreen";
import { supabase } from "@/lib/supabase/client";
import { useUIStore } from "@/stores/uiStore";
import type { UIState } from "@/stores/uiStore";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const pushToast = useUIStore((state: UIState) => state.pushToast);
  const [showPassword, setShowPassword] = useState(false);
  const [webview, setWebview] = useState<{ title: string; url: string } | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      pushToast({ title: "Gagal masuk", description: error.message, variant: "error" });
      return;
    }

    pushToast({ title: "Berhasil masuk", description: "Selamat datang kembali!", variant: "success" });
    router.push("/beranda" as Route);
  };

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
    if (error) {
      pushToast({ title: "Gagal login Google", description: error.message, variant: "error" });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6 tablet:px-8">
      <div className="w-full max-w-[520px] rounded-3xl border border-white/10 bg-[var(--bg-card)] p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--accent-indigo)]/15">
            <WalletCards className="text-[var(--accent-indigo)]" size={64} />
          </div>
          <h1 className="font-display text-2xl font-semibold">Selamat Datang!</h1>
          <p className="text-sm text-[var(--text-dimmed)]">
            Kelola cashflow harian dan pantau dompet Anda.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-xs text-[var(--text-dimmed)]">Email</label>
            <Input placeholder="nama@email.com" type="email" {...register("email")} />
            {errors.email ? (
              <p className="mt-1 text-xs text-rose-300">{errors.email.message}</p>
            ) : null}
          </div>
          <div>
            <label className="text-xs text-[var(--text-dimmed)]">Password</label>
            <div className="relative">
              <Input
                placeholder="Minimal 6 karakter"
                type={showPassword ? "text" : "password"}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-dimmed)]"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password ? (
              <p className="mt-1 text-xs text-rose-300">{errors.password.message}</p>
            ) : null}
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Memproses..." : "Masuk"}
          </Button>
          <div className="flex items-center gap-3 text-[11px] text-[var(--text-dimmed)]">
            <span className="h-px flex-1 bg-white/10" />
            ATAU
            <span className="h-px flex-1 bg-white/10" />
          </div>
          <Button type="button" variant="outline" className="w-full" onClick={handleGoogle}>
            Masuk dengan Google
          </Button>
        </form>

        <div className="mt-4 flex items-center justify-between text-xs text-[var(--text-dimmed)]">
          <PasswordResetDialog />
          <Link href={"/signup" as Route} className="text-[var(--accent-indigo)]">
            Belum punya akun? Daftar
          </Link>
        </div>

        <p className="mt-6 text-center text-[11px] text-[var(--text-dimmed)]">
          Dengan masuk, Anda menyetujui
          <button
            className="mx-1 text-[var(--accent-indigo)]"
            onClick={() => setWebview({ title: "Syarat & Ketentuan", url: "https://example.com/terms" })}
          >
            Syarat
          </button>
          dan
          <button
            className="mx-1 text-[var(--accent-indigo)]"
            onClick={() => setWebview({ title: "Kebijakan Privasi", url: "https://example.com/privacy" })}
          >
            Kebijakan Privasi
          </button>
        </p>
      </div>

      <Dialog open={Boolean(webview)} onOpenChange={() => setWebview(null)}>
        <DialogContent className="max-w-3xl">
          {webview ? <WebViewScreen url={webview.url} title={webview.title} /> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
