import { cn } from "@/lib/utils";

type Accent = "primary" | "emerald" | "rose";

interface Props {
  title: string;
  value: string;
  helper?: string;
  trend?: "positif" | "negatif";
  accent?: Accent;
}

export default function StatCard({
  title,
  value,
  helper,
  trend,
  accent = "primary",
}: Props) {
  const accentClasses: Record<Accent, string> = {
    primary: "from-[#6e59f5]/40 to-[#22d3ee]/30",
    emerald: "from-emerald-500/30 to-emerald-400/10",
    rose: "from-rose-500/30 to-rose-400/10",
  };

  return (
    <article className="glass-panel relative overflow-hidden p-4">
      <div className={cn("absolute inset-0 blur-3xl", `bg-gradient-to-br ${accentClasses[accent]}`)} />
      <div className="relative space-y-2">
        <p className="text-sm text-slate-300">{title}</p>
        <p className="text-2xl font-semibold text-white">{value}</p>
        {helper && <p className="text-xs text-slate-400">{helper}</p>}
        {trend && (
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-1 text-[11px] font-medium",
              trend === "positif"
                ? "bg-emerald-500/10 text-emerald-300"
                : "bg-rose-500/10 text-rose-300",
            )}
          >
            {trend === "positif" ? "Stabil" : "Perhatikan pengeluaran"}
          </span>
        )}
      </div>
    </article>
  );
}
