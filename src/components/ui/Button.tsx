import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost" | "outline" | "danger";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: ReactNode;
}

export default function Button({
  children,
  variant = "primary",
  className,
  icon,
  ...props
}: Props) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-200 disabled:cursor-not-allowed disabled:opacity-60";

  const styles: Record<Variant, string> = {
    primary:
      "bg-gradient-to-r from-[#14b8a6] to-[#2563eb] text-white px-4 py-2 shadow-lg shadow-[#2563eb]/25 hover:brightness-105",
    ghost: "px-3 py-2 text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5",
    outline:
      "px-4 py-2 border border-[var(--border-soft)] text-[var(--text-primary)] hover:border-[var(--border-strong)]",
    danger: "px-4 py-2 bg-rose-600/90 text-white hover:bg-rose-500",
  };

  return (
    <button className={cn(base, styles[variant], className)} {...props}>
      {icon}
      {children}
    </button>
  );
}
