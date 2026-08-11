import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatVnd(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPct(value: number, digits = 0): string {
  return `${(value * 100).toFixed(digits)}%`;
}

/**
 * Đọc số tiền người dùng gõ. VND không có phần thập phân, nên "." và ","
 * luôn là dấu phân cách nghìn — phải bỏ hết, KHÔNG đưa vào Number().
 * ("5.000.000" → Number() ra NaN → trước đây bị lưu thành 0.)
 */
export function parseMoneyInput(raw: string): number {
  const negative = /^\s*-/.test(raw);
  const digits = raw.replace(/\D/g, "");
  if (!digits) return 0;
  const n = Number(digits);
  if (!Number.isFinite(n)) return 0;
  return negative ? -n : n;
}
