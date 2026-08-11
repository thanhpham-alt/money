import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[15px] shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[var(--border-default)] dark:bg-[var(--surface-2)] dark:text-[var(--text-primary)]",
      className
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = "Input";
