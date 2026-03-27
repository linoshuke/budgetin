import { cn } from "@/lib/utils";
import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";

const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-muted)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
);

Select.displayName = "Select";

export default Select;
