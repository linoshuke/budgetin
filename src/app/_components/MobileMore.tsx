"use client";

import MobileAppBar from "@/app/_components/MobileAppBar";

export default function MobileMore({ onGoHome }: { onGoHome: () => void }) {
  return (
    <div className="min-h-screen">
      <MobileAppBar title="Lainnya" />

      <div className="space-y-3 px-4 pb-24 pt-4">
        <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)]">
          {[
            { label: "Kalender Transaksi" },
            { label: "Ekspor Data" },
          ].map((item, index) => (
            <button
              key={item.label}
              type="button"
              className={`flex w-full items-center justify-between px-4 py-4 text-sm text-[var(--text-primary)] ${
                index === 0 ? "border-b border-[var(--border-soft)]" : ""
              }`}
              onClick={() => alert("Fitur belum tersedia")}
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400">
                  ☰
                </span>
                {item.label}
              </div>
              <span className="text-[var(--text-dimmed)]">›</span>
            </button>
          ))}
        </div>

        <div className="pt-4">
          <button
            type="button"
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white"
            onClick={onGoHome}
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    </div>
  );
}
