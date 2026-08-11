"use client";

import { cn } from "@/lib/utils";

/** Palette pill — dịu, đọc được ở cả light & dark */
const PALETTE = [
  "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200",
  "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200",
  "bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-200",
  "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200",
  "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200",
  "bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-teal-200",
  "bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200",
  "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-200",
  "bg-lime-100 text-lime-800 dark:bg-lime-500/20 dark:text-lime-200",
  "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-500/20 dark:text-fuchsia-200",
] as const;

const EMPTY =
  "bg-stone-100 text-stone-400 dark:bg-[var(--surface-3)] dark:text-[var(--text-muted)]";

/** Cùng chữ → cùng màu, mọi lần render */
export function pillClass(value: string | null | undefined): string {
  if (!value || !value.trim()) return EMPTY;
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

export function Pill({
  value,
  placeholder = "—",
  className,
}: {
  value: string | null | undefined;
  placeholder?: string;
  className?: string;
}) {
  return (
    <span className={cn("pill", pillClass(value), className)}>
      {value?.trim() || placeholder}
    </span>
  );
}

/**
 * Pill có thể chọn — hiện như pill màu, bấm vào là 1 <select> thật.
 * Giữ được a11y/keyboard mà vẫn nhìn như ô Excel đã tô màu.
 */
export function PillSelect({
  value,
  options,
  onChange,
  placeholder = "—",
  className,
}: {
  value: string | null | undefined;
  options: readonly string[];
  onChange: (v: string | null) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative inline-flex max-w-full", className)}>
      <span
        className={cn(
          "pill w-full justify-center pr-1",
          pillClass(value),
          !value && "font-normal"
        )}
      >
        {value?.trim() || placeholder}
      </span>
      <select
        aria-label={placeholder}
        className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
