"use client";

import TotalBalanceCard from "@/components/home/TotalBalanceCard";
import MonthlySummary from "@/components/home/MonthlySummary";
import ExpenseChart from "@/components/home/ExpenseChart";
import CashFlowChartCard from "@/components/home/CashFlowChartCard";
import WalletSelectionDialog from "@/components/modals/WalletSelectionDialog";

export default function HomePage() {
  const recentTransactions = [
    {
      title: "Apple Store Soho",
      category: "Technology",
      date: "Oct 24, 2023",
      amount: "-$1,299.00",
      status: "Success",
      icon: "shopping_bag",
      tone: "error",
    },
    {
      title: "Stripe Inc. Payout",
      category: "Income",
      date: "Oct 23, 2023",
      amount: "+$5,400.00",
      status: "Settled",
      icon: "payments",
      tone: "primary",
    },
    {
      title: "Blue Hill Restaurant",
      category: "Dining",
      date: "Oct 22, 2023",
      amount: "-$342.50",
      status: "Success",
      icon: "restaurant",
      tone: "error",
    },
    {
      title: "Uber Trip",
      category: "Transport",
      date: "Oct 22, 2023",
      amount: "-$28.90",
      status: "Success",
      icon: "directions_car",
      tone: "error",
    },
    {
      title: "Equinox Membership",
      category: "Wellness",
      date: "Oct 20, 2023",
      amount: "-$215.00",
      status: "Recurring",
      icon: "fitness_center",
      tone: "error",
    },
  ];

  const upcomingBills = [
    {
      title: "AWS Cloud Services",
      meta: "Due in 3 days",
      amount: "$158.32",
      status: "Pending",
      tone: "primary",
      action: "Auto-pay",
    },
    {
      title: "Netflix Subscription",
      meta: "Paid on Oct 18",
      amount: "$19.99",
      status: "Paid",
      tone: "secondary",
      action: "check_circle",
    },
    {
      title: "Adobe Creative Cloud",
      meta: "Due tomorrow",
      amount: "$52.99",
      status: "Urgent",
      tone: "error",
      action: "Pay Now",
    },
  ];

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
              {recentTransactions.map((item) => (
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
              ))}
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-6 font-headline text-xl font-bold">Upcoming Bills</h3>
          <div className="space-y-4">
            {upcomingBills.map((bill) => (
              <div
                key={bill.title}
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
                      className="material-symbols-outlined text-secondary-container"
                      data-icon="check_circle"
                      style={{ fontVariationSettings: '"FILL" 1' }}
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
            ))}
            <div className="group relative mt-8 overflow-hidden rounded-xl bg-[#1a202a] p-6">
              <img
                alt="savings"
                className="absolute inset-0 h-full w-full scale-110 object-cover opacity-20 transition-transform duration-700 group-hover:scale-100"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDS7Oulg72mB7ehDrhVmR4n-GKvEsVzEXy0zqmJHKYe9zR6A9pdksZsP3QzQO8gFP4Su6JKz3xDNQwx23uVWeyU-INwSwPqPLE2aFIYAS1wS0_q_cKtOvFAnsAI78fAb_pDhfTtHxUMXxSR_IDekYuzEdDPm7RO-5hXHsGigj9dRJsah2g8Xp1ow-W-yUQyWSheWNV5pLNAp6dWwG4IMCb3yUTdbR8jqNP4eOGsGQclbLDSMRSgAb5za7RBRzAvj4k1J_TSX0Jgz2Pq"
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
