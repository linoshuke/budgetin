import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost" | "outline";

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
    "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60";

  const styles: Record<Variant, string> = {
    primary:
      "bg-gradient-to-r from-[#6e59f5] to-[#22d3ee] text-white px-4 py-2 shadow-lg shadow-[#6e59f5]/30 hover:brightness-110",
    ghost: "px-3 py-2 text-slate-200 hover:bg-white/5",
    outline: "px-4 py-2 border border-white/15 text-slate-100 hover:border-white/40",
  };

  return (
    <button className={cn(base, styles[variant], className)} {...props}>
      {icon}
      {children}
    </button>
  );
}
