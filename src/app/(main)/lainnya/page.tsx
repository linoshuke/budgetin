"use client";

import { useRouter } from "next/navigation";
import type { Route } from "next";
import { HelpCircle, Info, Shield, Mail, ChevronRight } from "lucide-react";
import Button from "@/components/ui/Button";
import { useUIStore } from "@/stores/uiStore";

const items = [
  { label: "Bantuan", icon: HelpCircle },
  { label: "Tentang Aplikasi", icon: Info },
  { label: "Privasi & Kebijakan", icon: Shield },
  { label: "Hubungi Kami", icon: Mail },
];

export default function MorePage() {
  const router = useRouter();
  const setActiveTab = useUIStore((state) => state.setActiveTab);
  const pushToast = useUIStore((state) => state.pushToast);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 desktop:grid-cols-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() =>
                pushToast({
                  title: item.label,
                  description: "Fitur ini sedang disiapkan.",
                  variant: "info",
                })
              }
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-[var(--bg-card)] p-4 text-left transition hover:border-white/20"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-300">
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{item.label}</p>
                  <p className="text-xs text-[var(--text-dimmed)]">Kelola informasi penting</p>
                </div>
              </div>
              <ChevronRight className="text-[var(--text-dimmed)]" size={18} />
            </button>
          );
        })}
      </div>

      <Button
        className="w-full"
        onClick={() => {
          setActiveTab(0);
          router.push("/beranda" as Route);
        }}
      >
        Kembali ke Beranda
      </Button>
    </div>
  );
}
