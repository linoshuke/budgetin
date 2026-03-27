"use client";

import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

export default function LockWidget({ message }: { message?: string }) {
  const router = useRouter();

  return (
    <div className="glass-panel flex flex-col items-center gap-3 p-6 text-center">
      <p className="text-sm text-[var(--text-dimmed)]">
        {message ?? "Fitur ini hanya tersedia untuk akun terdaftar."}
      </p>
      <Button onClick={() => router.push("/login")}>Masuk untuk lanjut</Button>
    </div>
  );
}
