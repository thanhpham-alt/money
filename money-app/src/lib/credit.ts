import type { CreditCard } from "@prisma/client";

/**
 * Thẻ tín dụng — trừ dần theo tháng.
 * Mỗi lần qua ngày đáo hạn (dueDay) là trừ `monthly`.
 * CÒN LẠI = DƯ NỢ − monthly × (số lần đã đáo hạn) − adjust
 */
export function cardStatus(c: CreditCard, now: Date = new Date()) {
  const start = new Date(c.startDate);

  // Kỳ đáo hạn đầu tiên kể từ startDate
  const first = new Date(start.getFullYear(), start.getMonth(), c.dueDay);
  if (first < start) first.setMonth(first.getMonth() + 1);

  // Đã qua bao nhiêu kỳ đáo hạn tính tới hôm nay
  let cycles = 0;
  if (now >= first) {
    cycles =
      (now.getFullYear() - first.getFullYear()) * 12 +
      (now.getMonth() - first.getMonth()) +
      (now.getDate() >= c.dueDay ? 1 : 0);
    cycles = Math.max(0, cycles);
  }

  const paid = c.fixedOnly ? 0 : Math.min(c.principal, c.monthly * cycles + c.adjust);
  const remaining = c.fixedOnly ? 0 : Math.max(0, c.principal - paid);

  // Kỳ đáo hạn kế tiếp
  const next = new Date(now.getFullYear(), now.getMonth(), c.dueDay);
  if (now.getDate() >= c.dueDay) next.setMonth(next.getMonth() + 1);
  const daysToDue = Math.ceil((next.getTime() - now.getTime()) / 86_400_000);

  // Còn bao nhiêu tháng nữa thì hết nợ
  const monthsLeft =
    c.monthly > 0 && remaining > 0 ? Math.ceil(remaining / c.monthly) : 0;

  return {
    cycles,
    paid,
    remaining,
    /** Số phải trả kỳ này (không vượt quá dư nợ còn lại) */
    thisMonth: c.fixedOnly ? c.monthly : Math.min(c.monthly, remaining),
    nextDueDate: next.toISOString(),
    daysToDue,
    monthsLeft,
    paidPct: c.principal > 0 ? Math.min(100, (paid / c.principal) * 100) : 0,
  };
}

export function cardTotals(cards: CreditCard[], now: Date = new Date()) {
  const rows = cards.map((c) => ({ ...c, ...cardStatus(c, now) }));
  return {
    rows,
    principal: rows.reduce((s, c) => s + (c.fixedOnly ? 0 : c.principal), 0),
    thisMonth: rows.reduce((s, c) => s + c.thisMonth, 0),
    remaining: rows.reduce((s, c) => s + c.remaining, 0),
  };
}
