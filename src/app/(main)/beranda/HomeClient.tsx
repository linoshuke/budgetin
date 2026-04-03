"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import TotalBalanceCard from "@/components/home/TotalBalanceCard";
import MonthlySummary from "@/components/home/MonthlySummary";
import WalletSelectionDialog from "@/components/modals/WalletSelectionDialog";
import { useBudgetStore } from "@/store/budgetStore";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Category } from "@/types/category";

const CashFlowChartCard = dynamic(() => import("@/components/home/CashFlowChartCard"), {
  ssr: false,
  loading: () => <div className="h-[320px] rounded-xl bg-surface-container-low/50" />,
});

const ExpenseChart = dynamic(() => import("@/components/home/ExpenseChart"), {
  ssr: false,
  loading: () => <div className="h-[340px] rounded-xl bg-surface-container-low/50" />,
});

const DAY_MS = 24 * 60 * 60 * 1000;

function resolveCategoryIcon(category: Category | undefined) {
  const code = category?.icon?.toUpperCase();
  const name = category?.name?.toLowerCase() ?? "";

  const codeMap: Record<string, string> = {
    FOOD: "shopping_cart",
    MOVE: "directions_car",
    BILL: "home",
    PAY: "payments",
    PLUS: "savings",
    FUN: "movie",
    HEALTH: "favorite",
  };

  if (code && codeMap[code]) return codeMap[code];
  if (name.includes("makan") || name.includes("food") || name.includes("grocery")) return "shopping_cart";
  if (name.includes("transport") || name.includes("bensin") || name.includes("travel")) return "directions_car";
  if (name.includes("tagih") || name.includes("bill") || name.includes("util") || name.includes("sewa")) return "home";
  if (name.includes("hibur") || name.includes("entertain") || name.includes("movie")) return "movie";
  if (name.includes("kesehatan") || name.includes("health") || name.includes("med")) return "favorite";
  if (name.includes("gaji") || name.includes("income")) return "payments";
  return "category";
}

export default function HomeClient() {
  const transactions = useBudgetStore((state) => state.transactions);
  const categories = useBudgetStore((state) => state.categories);

  const categoryMap = useMemo(() => new Map(categories.map((item) => [item.id, item])), [categories]);

  const recentTransactions = useMemo(() => {
    const sorted = [...transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    return sorted.slice(0, 5).map((item) => {
      const category = categoryMap.get(item.categoryId);
      const title = (item.note ?? "").trim() || category?.name || "Transaksi";
      const amountValue = Math.abs(item.amount);
      return {
        title,
        category: category?.name ?? "Tanpa kategori",
        date: formatDate(item.date, true),
        amount: `${item.type === "income" ? "+" : "-"}${formatCurrency(amountValue)}`,
        status: item.type === "income" ? "Pemasukan" : "Pengeluaran",
        icon: resolveCategoryIcon(category),
        tone: item.type === "income" ? "primary" : "error",
      };
    });
  }, [categoryMap, transactions]);

  const upcomingBills = useMemo(() => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const upcoming = transactions
      .filter((item) => new Date(item.date).getTime() >= todayStart.getTime())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);

    return upcoming.map((item) => {
      const category = categoryMap.get(item.categoryId);
      const title = (item.note ?? "").trim() || category?.name || "Tagihan";
      const dateValue = new Date(item.date);
      const diffDays = Math.max(0, Math.ceil((dateValue.getTime() - todayStart.getTime()) / DAY_MS));
      const meta =
        diffDays === 0 ? "Jatuh tempo hari ini" : diffDays === 1 ? "Jatuh tempo besok" : `Jatuh tempo ${diffDays} hari lagi`;
      const isUrgent = diffDays <= 1;

      return {
        title,
        meta,
        amount: formatCurrency(Math.abs(item.amount)),
        status: isUrgent ? "Urgent" : "Pending",
        tone: isUrgent ? "error" : "primary",
        action: isUrgent ? "Bayar" : "Auto-pay",
      };
    });
  }, [categoryMap, transactions]);

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <TotalBalanceCard />
        </div>
        <MonthlySummary />
      </section>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <CashFlowChartCard />
        <ExpenseChart />
      </section>

      <section className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-headline text-xl font-bold">Recent Transactions</h3>
            <button className="text-sm font-bold text-primary hover:underline" type="button">
              View All
            </button>
          </div>
          <div className="overflow-hidden rounded-xl bg-surface-container-low">
            <div className="divide-y divide-outline-variant/5">
              {recentTransactions.length ? (
                recentTransactions.map((item) => (
                  <div
                    key={`${item.title}-${item.date}`}
                    className="group flex items-center justify-between p-4 transition-colors hover:bg-surface-container"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container-highest transition-colors group-hover:bg-primary/20">
                        <span className="material-symbols-outlined text-primary" data-icon={item.icon}>
                          {item.icon}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-on-surface">{item.title}</div>
                        <div className="text-xs text-on-surface-variant">
                          {item.category} • {item.date}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`tnum text-sm font-bold ${item.tone === "primary" ? "text-primary" : "text-error"}`}>
                        {item.amount}
                      </div>
                      <div className="text-[10px] font-medium uppercase text-on-surface-variant">{item.status}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-sm text-on-surface-variant">
                  Belum ada transaksi untuk ditampilkan.
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-6 font-headline text-xl font-bold">Upcoming Bills</h3>
          <div className="space-y-4">
            {upcomingBills.length ? (
              upcomingBills.map((bill) => (
                <div
                  key={`${bill.title}-${bill.meta}`}
                  className={`rounded-xl bg-surface-container-low p-5 ${
                    bill.tone === "primary"
                      ? "border-l-4 border-primary shadow-lg shadow-[#000]/10"
                      : bill.tone === "secondary"
                        ? "border-l-4 border-secondary-container opacity-80 transition-opacity hover:opacity-100"
                        : "border-l-4 border-error/50"
                  }`}
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <div className="text-sm font-bold">{bill.title}</div>
                      <div className="text-xs text-on-surface-variant">{bill.meta}</div>
                    </div>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                        bill.tone === "primary"
                          ? "bg-primary/10 text-primary"
                          : bill.tone === "secondary"
                            ? "bg-secondary-container/10 text-secondary-container"
                            : "bg-error/10 text-error"
                      }`}
                    >
                      {bill.status}
                    </span>
                  </div>
                  <div className="flex items-end justify-between">
                    <div className="tnum text-xl font-bold">{bill.amount}</div>
                    {bill.action === "check_circle" ? (
                      <span
                        className="material-symbols-outlined icon-fill text-secondary-container"
                        data-icon="check_circle"
                      >
                        check_circle
                      </span>
                    ) : (
                      <button
                        className={`rounded-md px-3 py-1 text-xs font-bold ${
                          bill.tone === "primary"
                            ? "bg-surface-container-highest hover:bg-surface-bright"
                            : "bg-gradient-to-r from-primary to-secondary-container text-on-primary"
                        }`}
                        type="button"
                      >
                        {bill.action}
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl bg-surface-container-low p-5 text-sm text-on-surface-variant">
                Belum ada tagihan terjadwal.
              </div>
            )}
            <div className="group relative mt-8 overflow-hidden rounded-xl bg-[#1a202a] p-6">
              <Image
                alt="savings"
                className="absolute inset-0 h-full w-full scale-110 object-cover opacity-20 transition-transform duration-700 group-hover:scale-100"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDS7Oulg72mB7ehDrhVmR4n-GKvEsVzEXy0zqmJHKYe9zR6A9pdksZsP3QzQO8gFP4Su6JKz3xDNQwx23uVWeyU-INwSwPqPLE2aFIYAS1wS0_q_cKtOvFAnsAI78fAb_pDhfTtHxUMXxSR_IDekYuzEdDPm7RO-5hXHsGigj9dRJsah2g8Xp1ow-W-yUQyWSheWNV5pLNAp6dWwG4IMCb3yUTdbR8jqNP4eOGsGQclbLDSMRSgAb5za7RBRzAvj4k1J_TSX0Jgz2Pq"
                fill
                sizes="(max-width: 1024px) 100vw, 33vw"
                loading="lazy"
              />
              <div className="relative z-10">
                <div className="text-lg font-bold text-primary">Smart Savings</div>
                <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
                  Based on your spending, you could save $450 more by optimizing your entertainment subscriptions.
                </p>
                <button className="group mt-4 flex items-center space-x-2 text-xs font-bold text-on-surface" type="button">
                  <span>Learn how</span>
                  <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">
                    arrow_forward
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <WalletSelectionDialog />
    </div>
  );
}
