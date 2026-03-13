"use client";

import Button from "@/components/ui/Button";
import { budgetActions, useBudgetStore } from "@/store/budgetStore";

export default function GuestSyncBanner() {
  const isAuthenticated = useBudgetStore((state) => state.isAuthenticated);
  const guestPending = useBudgetStore((state) => state.guestPending);
  const syncLoading = useBudgetStore((state) => state.syncLoading);
  const syncError = useBudgetStore((state) => state.syncError);

  if (!isAuthenticated || !guestPending) return null;

  return (
    <div className="sticky top-0 z-40 border-b border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="font-medium">Ada data offline yang belum tersimpan.</p>
          {syncError ? (
            <p className="text-xs text-amber-100/80">{syncError}</p>
          ) : null}
        </div>
        <Button
          variant="outline"
          onClick={() => {
            void budgetActions.syncGuestData();
          }}
          disabled={syncLoading}
        >
          {syncLoading ? "Menyinkronkan..." : "Sinkronisasi Sekarang"}
        </Button>
      </div>
    </div>
  );
}
