import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { collectStatus, jobMetrics } from "@/lib/money";
import { isJobType } from "@/lib/job-types";
import { eventTotal } from "@/lib/bluescope";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const [settings, job] = await Promise.all([
    prisma.settings.findUnique({ where: { id: "default" } }),
    prisma.job.findUnique({
      where: { id },
      include: { expenses: { orderBy: { sortOrder: "asc" } } },
    }),
  ]);
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const fee = settings?.invoiceFeeRate ?? 0.04;
  const aTan = settings?.aTanShareRate ?? 0.2;

  // Bluescope: chi phí = tổng booking events, chỉnh ở module /bluescope
  let spentOverride: number | undefined;
  if (job.jobType === "BLUESCOPE") {
    const events = await prisma.bluescopeEvent.findMany();
    spentOverride = events.reduce((s, e) => s + eventTotal(e), 0);
  }

  return NextResponse.json({
    job: {
      ...job,
      metrics: jobMetrics(job, fee, aTan, spentOverride),
      collectStatus: collectStatus(job.contractTotal, job.collected),
    },
    settings,
  });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.json();
  const job = await prisma.job.update({
    where: { id },
    data: {
      ...(body.agency != null ? { agency: String(body.agency) } : {}),
      ...(body.name != null ? { name: String(body.name) } : {}),
      ...(body.status != null ? { status: String(body.status) } : {}),
      ...(body.jobType != null && isJobType(body.jobType)
        ? { jobType: body.jobType }
        : {}),
      ...(body.contractTotal != null
        ? { contractTotal: Number(body.contractTotal) }
        : {}),
      ...(body.collected != null ? { collected: Number(body.collected) } : {}),
      ...(body.externalUrl !== undefined
        ? { externalUrl: body.externalUrl ? String(body.externalUrl) : null }
        : {}),
      ...(body.notes !== undefined
        ? { notes: body.notes ? String(body.notes) : null }
        : {}),
      ...(body.publicVisible !== undefined
        ? { publicVisible: Boolean(body.publicVisible) }
        : {}),
      ...(body.code != null
        ? {
            code: String(body.code)
              .trim()
              .toUpperCase()
              .replace(/\s+/g, "_"),
          }
        : {}),
    },
    include: { expenses: { orderBy: { sortOrder: "asc" } } },
  });
  return NextResponse.json(job);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  await prisma.job.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
