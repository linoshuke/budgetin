import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

export default function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-[#6e59f5] focus:outline-none focus:ring-2 focus:ring-[#6e59f5]/50",
        className,
      )}
      {...props}
    />
  );
}
