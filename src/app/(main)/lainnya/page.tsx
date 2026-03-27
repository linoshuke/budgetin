"use client";

import { useRouter } from "next/navigation";
import { HelpCircle, Info, Shield, Mail } from "lucide-react";
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

  return (
    <div className="space-y-6">
      <div className="grid gap-3 desktop:grid-cols-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[var(--bg-card)] p-4"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-300">
                <Icon size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{item.label}</p>
                <p className="text-xs text-[var(--text-dimmed)]">Kelola informasi penting</p>
              </div>
            </div>
          );
        })}
      </div>

      <Button
        onClick={() => {
          setActiveTab(0);
          router.push("/beranda");
        }}
      >
        Kembali ke Beranda
      </Button>
    </div>
  );
}
