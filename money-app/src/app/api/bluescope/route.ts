import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ensureBluescopeJob,
  eventTotal,
  itemTotal,
  loadBluescope,
  packageTotal,
} from "@/lib/bluescope";

/** Nội bộ: toàn bộ module Bluescope (rate card · booking · gói · content list) */
export async function GET() {
  const data = await loadBluescope();

  return NextResponse.json({
    job: {
      id: data.job.id,
      name: data.job.name,
      status: data.job.status,
      contractTotal: data.job.contractTotal,
      collected: data.job.collected,
      publicVisible: data.job.publicVisible,
      notes: data.job.notes,
    },
    budget: data.budget,
    rates: data.rates,
    events: data.events.map((e) => ({ ...e, total: eventTotal(e) })),
    packages: data.packages.map((p) => ({
      ...p,
      total: packageTotal(p),
      items: p.items.map((i) => ({ ...i, total: itemTotal(i) })),
    })),
    contents: data.contents,
    publicPath: "/bluescope/public",
  });
}

/** Chỉ ngân sách + meta job (số chi tiết sửa qua /api/bluescope/rows) */
export async function PATCH(req: Request) {
  const body = await req.json();
  const { job } = await ensureBluescopeJob();

  await prisma.job.update({
    where: { id: job.id },
    data: {
      ...(body.contractTotal != null
        ? { contractTotal: Number(body.contractTotal) || 0 }
        : {}),
      ...(body.collected != null ? { collected: Number(body.collected) || 0 } : {}),
      ...(body.name != null ? { name: String(body.name) } : {}),
      ...(body.status != null ? { status: String(body.status) } : {}),
      ...(body.notes !== undefined
        ? { notes: body.notes ? String(body.notes) : null }
        : {}),
      ...(body.publicVisible !== undefined
        ? { publicVisible: Boolean(body.publicVisible) }
        : {}),
    },
  });

  const data = await loadBluescope();
  return NextResponse.json({ job: data.job, budget: data.budget });
}
