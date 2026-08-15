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
  const { geminiApiKey, ...rest } = s;
  return NextResponse.json({
    ...rest,
    geminiConfigured: Boolean(geminiApiKey && geminiApiKey.trim()),
  });
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
      ...(body.geminiApiKey != null
        ? { geminiApiKey: String(body.geminiApiKey).trim() }
        : {}),
      ...(body.geminiModel != null
        ? { geminiModel: String(body.geminiModel).trim() || "gemini-2.5-flash" }
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

  const { geminiApiKey: _k, ...safe } = s;
  return NextResponse.json({
    ...safe,
    geminiConfigured: Boolean(s.geminiApiKey && s.geminiApiKey.trim()),
  });
}
