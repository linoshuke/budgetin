"use client";

import { useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onVerified: () => void;
  factorId?: string | null;
};

export function MfaStepUpModal({ open, onClose, onVerified, factorId }: Props) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const submit = async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/mfa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify", factorId, code }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json?.error ?? "Verifikasi gagal.");
      return;
    }
    onVerified();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Verifikasi MFA</h2>
          <p className="text-sm text-gray-600">Masukkan kode dari aplikasi Authenticator untuk melanjutkan.</p>
        </div>
        <input
          className="w-full rounded border px-3 py-2"
          placeholder="123456"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          inputMode="numeric"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <button className="px-3 py-2 text-sm" onClick={onClose} disabled={loading}>
            Batal
          </button>
          <button
            className="rounded bg-indigo-600 px-4 py-2 text-sm text-white disabled:opacity-60"
            onClick={submit}
            disabled={loading}
          >
            Verifikasi
          </button>
        </div>
      </div>
    </div>
  );
}
