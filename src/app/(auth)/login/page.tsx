"use client";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-panel w-full max-w-md space-y-6 p-6">
        <header className="space-y-1">
          <p className="text-sm text-[var(--text-dimmed)]">Selamat datang kembali</p>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Masuk ke Budgetin</h1>
        </header>

        <form className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-[var(--text-dimmed)]">Email</label>
            <Input type="email" placeholder="nama@email.com" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-[var(--text-dimmed)]">Kata sandi</label>
            <Input type="password" placeholder="********" required />
          </div>

          <Button type="submit" className="w-full">
            Masuk
          </Button>
        </form>

        <p className="text-sm text-[var(--text-dimmed)]">
          Belum punya akun?{" "}
          <Link href="/register" className="text-teal-400 hover:underline">
            Daftar sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}
