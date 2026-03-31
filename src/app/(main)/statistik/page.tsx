"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import WalletStatCard from "@/components/statistics/WalletStatCard";
import PageIndicator from "@/components/statistics/PageIndicator";
import LockWidget from "@/components/LockWidget";
import Button from "@/components/ui/Button";
import { useWallets } from "@/hooks/useWallets";
import { useAuth } from "@/hooks/useAuth";
import { useTransactionStore } from "@/stores/transactionStore";
import { getMonthRange } from "@/utils/date";
import type { Transaction } from "@/types";

function buildChartData(transactions: Transaction[]) {
  const totals: Record<
    string,
    { income: number; expense: number; items: Array<{ description: string; amount: number; type: string }> }
  > = {};

  transactions.forEach((trx) => {
    const day = new Date(trx.date).getDate().toString();
    if (!totals[day]) totals[day] = { income: 0, expense: 0, items: [] };
    if (trx.type === "income") totals[day].income += trx.amount;
    if (trx.type === "expense") totals[day].expense += trx.amount;
    totals[day].items.push({
      description: trx.description,
      amount: trx.amount,
      type: trx.type,
    });
  });

  return Object.entries(totals)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([day, value]) => ({ day, ...value }));
}

export default function StatisticsPage() {
  const { wallets, isGuest } = useWallets();
  const { user } = useAuth();
  const { currentMonth } = useTransactionStore();
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeWalletId, setActiveWalletId] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["transactions", "stats", user?.id ?? "guest", currentMonth.year, currentMonth.month],
    queryFn: async () => {
      if (!user) return [];
      const { start, end } = getMonthRange(currentMonth.year, currentMonth.month);
      const params = new URLSearchParams({
        limit: "500",
        offset: "0",
        dateFrom: start,
        dateTo: end,
      });
      const response = await fetch(`/api/transactions?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = (await response.json()) as {
        items: Array<{
          id: string;
          amount: number;
          type: Transaction["type"];
          date: string;
          walletId?: string | null;
          categoryId?: string | null;
          note?: string | null;
        }>;
      };
      return (payload.items ?? []).map((item) => ({
        id: item.id,
        wallet_id: item.walletId ?? "",
        user_id: user.id,
        description: item.note ?? "",
        amount: Number(item.amount ?? 0),
        type: item.type,
        date: item.date,
        created_at: item.date,
        category_id: item.categoryId ?? null,
      })) as Transaction[];
    },
  });

  const grouped = useMemo(() => {
    const map: Record<string, Transaction[]> = {};
    (data ?? []).forEach((trx) => {
      map[trx.wallet_id] = map[trx.wallet_id] ?? [];
      map[trx.wallet_id].push(trx);
    });
    return map;
  }, [data]);

  const walletCards = wallets.map((wallet) => ({
    id: wallet.id,
    name: wallet.name,
    data: buildChartData(grouped[wallet.id] ?? []),
  }));

  const showTabs = walletCards.length > 2;
  const activeWallet = walletCards.find((wallet) => wallet.id === activeWalletId) ?? walletCards[0];

  if (isGuest) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LockWidget message="Masuk untuk melihat laporan lengkap." />
      </div>
    );
  }

  if (!walletCards.length) {
    return (
      <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6 text-center text-sm text-on-surface-variant">
        Belum ada dompet untuk ditampilkan pada laporan.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="tablet:hidden">
        <div
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4"
          onScroll={(event) => {
            const target = event.currentTarget;
            const index = Math.round(target.scrollLeft / target.clientWidth);
            setActiveIndex(index);
          }}
        >
          {walletCards.map((wallet) => (
            <div key={wallet.id} className="min-w-[85%] snap-center">
              <WalletStatCard walletName={wallet.name} data={wallet.data} />
            </div>
          ))}
        </div>
        <PageIndicator count={walletCards.length} activeIndex={activeIndex} />
      </div>

      <div className="hidden tablet:block">
        {showTabs ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {walletCards.map((wallet) => (
                <Button
                  key={wallet.id}
                  variant={wallet.id === (activeWallet?.id ?? walletCards[0]?.id) ? "primary" : "outline"}
                  onClick={() => setActiveWalletId(wallet.id)}
                >
                  {wallet.name}
                </Button>
              ))}
            </div>
            {activeWallet ? (
              <WalletStatCard walletName={activeWallet.name} data={activeWallet.data} />
            ) : null}
          </div>
        ) : (
          <div className="grid gap-6 desktop:grid-cols-2">
            {walletCards.map((wallet) => (
              <WalletStatCard key={wallet.id} walletName={wallet.name} data={wallet.data} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
