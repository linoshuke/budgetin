"use client";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { supabase } from "@/lib/supabase";
import { FormEvent, useState } from "react";

interface ForgotPasswordFormProps {
  nextPath: string;
  onBack: () => void;
}

export default function ForgotPasswordForm({ nextPath, onBack }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

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

  return (
    <>
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
        <Button type="button" variant="ghost" className="w-full" onClick={onBack}>
          Kembali ke Login
        </Button>
      </form>
    </>
  );
}
