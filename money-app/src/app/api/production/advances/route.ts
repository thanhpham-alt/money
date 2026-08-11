import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** ĐÃ ỨNG — thêm / sửa / xóa 1 lần ứng tiền của job */

function parseDate(v: unknown): Date | null {
  if (!v) return null;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function POST(req: Request) {
  const body = await req.json();
  if (typeof body.jobId !== "string") {
    return NextResponse.json({ error: "thiếu jobId" }, { status: 400 });
  }
  const agg = await prisma.jobAdvance.aggregate({
    _max: { sortOrder: true },
    where: { jobId: body.jobId },
  });
  const row = await prisma.jobAdvance.create({
    data: {
      jobId: body.jobId,
      amount: Number(body.amount) || 0,
      paidAt: parseDate(body.paidAt),
      note: body.note ? String(body.note) : null,
      sortOrder: (agg._max.sortOrder ?? -1) + 1,
    },
  });
  return NextResponse.json({ row });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  if (typeof body.id !== "string") {
    return NextResponse.json({ error: "thiếu id" }, { status: 400 });
  }
  const row = await prisma.jobAdvance.update({
    where: { id: body.id },
    data: {
      ...(body.amount != null ? { amount: Number(body.amount) || 0 } : {}),
      ...(body.paidAt !== undefined ? { paidAt: parseDate(body.paidAt) } : {}),
      ...(body.note !== undefined
        ? { note: body.note ? String(body.note) : null }
        : {}),
    },
  });
  return NextResponse.json({ row });
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "thiếu id" }, { status: 400 });
  await prisma.jobAdvance.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
