import { cn } from "@/lib/utils";
import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-muted)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-dimmed)] focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/30",
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";

export default Input;
