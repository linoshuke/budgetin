"use client";

import { useEffect, useState } from "react";
import { useMfa } from "@/lib/hooks/use-mfa";

export default function MfaSetupPage() {
  const { enroll, verify, loading, error, factorId } = useMfa();
  const [qr, setQr] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    enroll().then((res) => {
      if (res) {
        setQr(res.qr);
        setSecret(res.secret);
      }
    });
  }, [enroll]);

  const onVerify = async () => {
    if (!code) return;
    const ok = await verify(code);
    if (ok) setDone(true);
  };

  return (
    <main className="mx-auto max-w-xl px-6 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Aktifkan Authenticator</h1>
        <p className="text-sm text-gray-600">Scan QR dengan aplikasi Authenticator lalu masukkan kode 6 digit.</p>
      </div>

      {qr && (
        <div className="flex items-center gap-4">
          <img src={qr} alt="QR MFA" className="w-40 h-40 border rounded" />
          <div className="text-sm text-gray-700">
            <p>Jika QR tidak terbaca, gunakan secret di aplikasi:</p>
            <code className="block mt-2 break-all bg-gray-100 px-2 py-1 rounded">{secret || "..."}</code>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium">Kode 6 digit</label>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full rounded border px-3 py-2"
          placeholder="123456"
          inputMode="numeric"
        />
        <button
          onClick={onVerify}
          disabled={loading}
          className="rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-60"
        >
          Verifikasi
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {done && <p className="text-sm text-green-600">MFA aktif. Anda dapat menutup halaman ini.</p>}
      </div>
    </main>
  );
}
