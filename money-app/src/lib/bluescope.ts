import type {
  BluescopeContent,
  BluescopeEvent,
  BluescopePackage,
  BluescopePackageItem,
  BluescopeRate,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

const BLUESCOPE_CODE = "JOB_BLUESCOPE";

// Hằng số dùng chung với client: lib/bluescope-const.ts
export * from "@/lib/bluescope-const";

/** TỔNG 1 dòng booking = quay chụp + dựng − chiết khấu */
export function eventTotal(e: BluescopeEvent): number {
  return (e.shootCost || 0) + (e.editCost || 0) - (e.discount || 0);
}

export function packageTotal(
  p: BluescopePackage & { items: BluescopePackageItem[] }
): number {
  return p.items.reduce((s, i) => s + (i.qty || 0) * (i.unitPrice || 0), 0);
}

export function itemTotal(i: BluescopePackageItem): number {
  return (i.qty || 0) * (i.unitPrice || 0);
}

/**
 * Ngân sách Bluescope — 1 nguồn số:
 *   NGÂN SÁCH / ĐÃ NHẬN nằm trên Job jobType=BLUESCOPE
 *   ĐÃ XÀI = tổng TỔNG của events (phái sinh, không nhập tay)
 */
export function bluescopeBudget(
  job: { contractTotal: number; collected: number },
  events: BluescopeEvent[]
) {
  const budget = job.contractTotal;
  const spent = events.reduce((s, e) => s + eventTotal(e), 0);
  const paidByUs = events.reduce((s, e) => s + (e.paidByUs || 0), 0);
  const received = job.collected;
  return {
    budget,
    spent,
    remainingBudget: budget - spent,
    received,
    remainingReceivable: spent - received,
    paidByUs,
    usedPct: budget > 0 ? Math.min(100, (spent / budget) * 100) : 0,
  };
}

/** Tổng content list theo kênh */
export function contentTotals(rows: BluescopeContent[]) {
  const sum = (k: "originalCost" | "finalCost") =>
    rows.reduce((s, r) => s + (r[k] || 0), 0);
  return { original: sum("originalCost"), final: sum("finalCost"), count: rows.length };
}

/** Đảm bảo có 1 job Bluescope giữ ngân sách + đã nhận. */
export async function ensureBluescopeJob() {
  const settings = await prisma.settings.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {},
  });

  let job = await prisma.job.findFirst({
    where: { OR: [{ code: BLUESCOPE_CODE }, { jobType: "BLUESCOPE" }] },
    include: { expenses: { orderBy: { sortOrder: "asc" } } },
  });

  if (!job) {
    job = await prisma.job.create({
      data: {
        code: BLUESCOPE_CODE,
        jobType: "BLUESCOPE",
        agency: "Bluescope",
        name: "Booking production 2026",
        status: "Đang làm",
        contractTotal: 100_000_000,
        collected: 0,
        publicVisible: true,
        notes: "Ngân sách Bluescope — chi tiết ở module Bluescope",
        sortOrder: 1,
      },
      include: { expenses: { orderBy: { sortOrder: "asc" } } },
    });
  } else if (job.jobType !== "BLUESCOPE") {
    job = await prisma.job.update({
      where: { id: job.id },
      data: { jobType: "BLUESCOPE" },
      include: { expenses: { orderBy: { sortOrder: "asc" } } },
    });
  }

  return { job, settings };
}

/** Toàn bộ data module Bluescope. */
export async function loadBluescope() {
  const { job, settings } = await ensureBluescopeJob();
  const [rates, events, packages, contents] = await Promise.all([
    prisma.bluescopeRate.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.bluescopeEvent.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.bluescopePackage.findMany({
      orderBy: { sortOrder: "asc" },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.bluescopeContent.findMany({
      orderBy: [{ channel: "asc" }, { sortOrder: "asc" }],
    }),
  ]);

  return {
    job,
    settings,
    rates,
    events,
    packages,
    contents,
    budget: bluescopeBudget(job, events),
  };
}

export type BluescopeRateRow = BluescopeRate;
export type BluescopeEventRow = BluescopeEvent;
export type BluescopeContentRow = BluescopeContent;
export type BluescopePackageWithItems = BluescopePackage & {
  items: BluescopePackageItem[];
};
