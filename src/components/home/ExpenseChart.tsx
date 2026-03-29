"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import Skeleton from "@/components/ui/Skeleton";
import { useExpenseByCategory } from "@/hooks/useTransactions";
import { useWalletStore } from "@/stores/walletStore";
import { formatCompactCurrency } from "@/utils/format";

const COLORS = ["#7cebff", "#0064d4", "#ffb4ab", "#29d9f2", "#89ceff", "#adc6ff"];

export default function ExpenseChart() {
  const selectedWalletIds = useWalletStore((state) => state.selectedWalletIds);
  const { data, isLoading } = useExpenseByCategory(selectedWalletIds);

  if (isLoading) {
    return <Skeleton className="h-[340px] w-full rounded-xl" />;
  }

  const chartData = data?.length ? data : [{ name: "Belum ada data", value: 1 }];
  const total = chartData.reduce((acc, item) => acc + item.value, 0);
  const topItems = [...chartData]
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)
    .map((item, index) => ({
      ...item,
      color: COLORS[index % COLORS.length],
      percentage: total ? Math.round((item.value / total) * 100) : 0,
    }));

  return (
    <div className="flex flex-col items-center justify-between rounded-xl bg-surface-container-low p-8">
      <h3 className="mb-6 w-full font-headline text-lg font-bold">Kategori Pengeluaran</h3>
      <div className="relative h-48 w-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={62}
              outerRadius={84}
              paddingAngle={2}
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs font-medium uppercase text-on-surface-variant">Total</span>
          <span className="tnum text-xl font-bold">{formatCompactCurrency(total)}</span>
        </div>
      </div>
      <div className="mt-8 w-full space-y-3">
        {topItems.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-xs font-medium">{item.name}</span>
            </div>
            <span className="tnum text-xs font-bold">{item.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
