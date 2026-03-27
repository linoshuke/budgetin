"use client";

import Greeting from "@/components/home/Greeting";
import TotalBalanceCard from "@/components/home/TotalBalanceCard";
import MonthlySummary from "@/components/home/MonthlySummary";
import ExpenseChart from "@/components/home/ExpenseChart";
import WalletSelectionDialog from "@/components/modals/WalletSelectionDialog";

export default function HomePage() {
  return (
    <div className="grid gap-6 desktop:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-6">
        <Greeting />
        <TotalBalanceCard />
        <MonthlySummary />
      </div>
      <div className="space-y-6">
        <ExpenseChart />
      </div>
      <WalletSelectionDialog />
    </div>
  );
}
