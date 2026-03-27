"use client";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b1224] px-4">
      <div className="glass-panel w-full max-w-md space-y-6 p-6">
        <header className="space-y-1">
          <p className="text-sm text-slate-400">Mulai kelola keuangan</p>
          <h1 className="text-xl font-semibold text-white">Daftar Budgetin</h1>
        </header>

        <form className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Nama</label>
            <Input placeholder="Nama lengkap" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Email</label>
            <Input type="email" placeholder="nama@email.com" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Kata sandi</label>
            <Input type="password" placeholder="Minimal 8 karakter" required />
          </div>

          <Button type="submit" className="w-full">
            Buat Akun
          </Button>
        </form>

        <p className="text-sm text-slate-400">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-[#22d3ee] hover:underline">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}
