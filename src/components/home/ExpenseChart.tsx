"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import Skeleton from "@/components/ui/Skeleton";
import { useExpenseByCategory } from "@/hooks/useTransactions";
import { useWalletStore } from "@/stores/walletStore";

const COLORS = [
  "#3b82f6",
  "#ef4444",
  "#22c55e",
  "#f97316",
  "#a855f7",
  "#14b8a6",
  "#ec4899",
  "#f59e0b",
];

export default function ExpenseChart() {
  const selectedWalletIds = useWalletStore((state) => state.selectedWalletIds);
  const { data, isLoading } = useExpenseByCategory(selectedWalletIds);

  if (isLoading) {
    return <Skeleton className="h-[200px] w-full" />;
  }

  const chartData = data?.length ? data : [{ name: "Belum ada data", value: 1 }];

  return (
    <div className="glass-panel h-[200px] p-4">
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">Pengeluaran per Kategori</h3>
      <div className="mt-2 h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
