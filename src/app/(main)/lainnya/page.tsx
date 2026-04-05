"use client";

import { useRouter } from "next/navigation";
import type { Route } from "next";
import { HelpCircle, Info, Shield, Mail, ChevronRight } from "lucide-react";
import Button from "@/components/ui/Button";
import { useUIStore } from "@/stores/uiStore";
import { useI18n } from "@/hooks/useI18n";

const items = [
  { labelKey: "more.help", icon: HelpCircle },
  { labelKey: "more.about", icon: Info },
  { labelKey: "more.privacy", icon: Shield },
  { labelKey: "more.contact", icon: Mail },
];

export default function MorePage() {
  const { t } = useI18n();
  const router = useRouter();
  const setActiveTab = useUIStore((state) => state.setActiveTab);
  const pushToast = useUIStore((state) => state.pushToast);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 desktop:grid-cols-2">
        {items.map((item) => {
          const Icon = item.icon;
          const label = t(item.labelKey);
          return (
            <button
              key={item.labelKey}
              onClick={() =>
                pushToast({
                  title: label,
                  description: t("toast.feature_preparing"),
                  variant: "info",
                })
              }
              className="flex items-center justify-between rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4 text-left transition hover:border-outline-variant/20 hover:bg-surface-container"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-on-surface">{label}</p>
                  <p className="text-xs text-on-surface-variant">{t("common.manageImportantInfo")}</p>
                </div>
              </div>
              <ChevronRight className="text-on-surface-variant" size={18} />
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
        {t("common.backToHome")}
      </Button>
    </div>
  );
}
