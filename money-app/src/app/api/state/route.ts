import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function toRevision(value: unknown): bigint {
  if (typeof value === "bigint") return value;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return BigInt(Date.now());
  return BigInt(Math.trunc(n));
}

/** GET /api/state — lấy state dashboard mới nhất */
export async function GET() {
  const row = await prisma.dashboardState.findUnique({ where: { id: "default" } });
  if (!row) {
    return NextResponse.json({ data: null, revision: 0 });
  }
  return NextResponse.json({
    data: row.data,
    revision: Number(row.revision),
    updatedAt: row.updatedAt,
  });
}

/** PUT /api/state — lưu state nếu revision không cũ hơn bản server */
export async function PUT(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || !body.data || typeof body.data !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const incomingRev = toRevision(body.revision ?? body.data._revision);
  const existing = await prisma.dashboardState.findUnique({ where: { id: "default" } });

  if (existing && existing.revision > incomingRev) {
    return NextResponse.json({
      data: existing.data,
      revision: Number(existing.revision),
      stale: true,
    });
  }

  const row = await prisma.dashboardState.upsert({
    where: { id: "default" },
    create: { id: "default", data: body.data, revision: incomingRev },
    update: { data: body.data, revision: incomingRev },
  });

  return NextResponse.json({
    ok: true,
    revision: Number(row.revision),
    updatedAt: row.updatedAt,
  });
}
