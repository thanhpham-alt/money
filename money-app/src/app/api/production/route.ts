import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { collectStatus } from "@/lib/money";
import { productionMetrics } from "@/lib/production";

const include = {
  expenses: { orderBy: { sortOrder: "asc" } },
  advances: { orderBy: { sortOrder: "asc" } },
} as const;

/** Bảng tính chi phí dự án — mọi job + số liệu theo công thức sheet "JOB" */
export async function GET() {
  const [settings, jobs] = await Promise.all([
    prisma.settings.upsert({
      where: { id: "default" },
      create: { id: "default" },
      update: {},
    }),
    prisma.job.findMany({ include, orderBy: { sortOrder: "asc" } }),
  ]);

  const rows = jobs.map((j) => ({
    ...j,
    metrics: productionMetrics(j, settings.invoiceFeeRate, settings.aTanShareRate),
    collectStatus: collectStatus(j.contractTotal, j.collected),
  }));

  return NextResponse.json({
    jobs: rows,
    settings: {
      invoiceFeeRate: settings.invoiceFeeRate,
      aTanShareRate: settings.aTanShareRate,
    },
    totals: {
      contract: rows.reduce((s, r) => s + r.contractTotal, 0),
      productionCost: rows.reduce((s, r) => s + r.metrics.productionCost, 0),
      grossProfit: rows.reduce((s, r) => s + r.metrics.grossProfit, 0),
      netProfit: rows.reduce((s, r) => s + r.metrics.netProfit, 0),
      aTan: rows.reduce((s, r) => s + r.metrics.aTan, 0),
      advanceTotal: rows.reduce((s, r) => s + r.metrics.advanceTotal, 0),
    },
  });
}

/** Sửa các ô nhập tay của bảng tính: hợp đồng, A Tân, % phí */
export async function PATCH(req: Request) {
  const body = await req.json();
  if (typeof body.id !== "string") {
    return NextResponse.json({ error: "thiếu id job" }, { status: 400 });
  }

  const num = (v: unknown) => (v === null || v === "" ? null : Number(v) || 0);

  await prisma.job.update({
    where: { id: body.id },
    data: {
      ...(body.contractTotal != null
        ? { contractTotal: Number(body.contractTotal) || 0 }
        : {}),
      ...(body.collected != null ? { collected: Number(body.collected) || 0 } : {}),
      ...(body.agency != null ? { agency: String(body.agency) } : {}),
      ...(body.name != null ? { name: String(body.name) } : {}),
      ...(body.status != null ? { status: String(body.status) } : {}),
      // null = quay lại tính theo % chung
      ...(body.aTanAmount !== undefined ? { aTanAmount: num(body.aTanAmount) } : {}),
      ...(body.feeRate !== undefined ? { feeRate: num(body.feeRate) } : {}),
      ...(body.altFeeRate != null
        ? { altFeeRate: Number(body.altFeeRate) || 0 }
        : {}),
      ...(body.notes !== undefined
        ? { notes: body.notes ? String(body.notes) : null }
        : {}),
    },
  });

  return GET();
}
