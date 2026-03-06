import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

export default function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-muted)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-dimmed)] focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/30",
        className,
      )}
      {...props}
    />
  );
}
