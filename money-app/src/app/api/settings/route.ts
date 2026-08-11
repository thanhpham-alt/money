import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function ensureSettings() {
  return prisma.settings.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {},
  });
}

export async function GET() {
  const s = await ensureSettings();
  return NextResponse.json(s);
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const s = await prisma.settings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      cashOnHand: Number(body.cashOnHand ?? 0),
      invoiceFeeRate: Number(body.invoiceFeeRate ?? 0.04),
      aTanShareRate: Number(body.aTanShareRate ?? 0.2),
      bluescopeUrl: body.bluescopeUrl ? String(body.bluescopeUrl) : undefined,
    },
    update: {
      ...(body.cashOnHand != null ? { cashOnHand: Number(body.cashOnHand) } : {}),
      ...(body.invoiceFeeRate != null
        ? { invoiceFeeRate: Number(body.invoiceFeeRate) }
        : {}),
      ...(body.aTanShareRate != null
        ? { aTanShareRate: Number(body.aTanShareRate) }
        : {}),
      ...(body.bluescopeUrl != null
        ? { bluescopeUrl: String(body.bluescopeUrl) }
        : {}),
    },
  });

  // Đồng bộ externalUrl job Bluescope khi đổi URL sheet
  if (body.bluescopeUrl != null) {
    await prisma.job.updateMany({
      where: { jobType: "BLUESCOPE" },
      data: { externalUrl: String(body.bluescopeUrl) },
    });
  }

  return NextResponse.json(s);
}
