import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const KINDS = ["income", "expense", "job"] as const;
type Kind = (typeof KINDS)[number];

function parseKind(v: unknown): Kind {
  return KINDS.includes(v as Kind) ? (v as Kind) : "expense";
}

/** GET /api/daily-expenses?from=YYYY-MM-DD&to=YYYY-MM-DD */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: { occurredAt?: { gte?: Date; lte?: Date } } = {};
  if (from || to) {
    where.occurredAt = {};
    if (from) where.occurredAt.gte = new Date(from);
    if (to) {
      const d = new Date(to);
      d.setHours(23, 59, 59, 999);
      where.occurredAt.lte = d;
    }
  }

  if (!from && !to) {
    const start = new Date();
    start.setMonth(start.getMonth() - 18);
    start.setHours(0, 0, 0, 0);
    where.occurredAt = { gte: start };
  }

  const items = await prisma.dailyExpense.findMany({
    where,
    orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
    take: 400,
    select: {
      id: true,
      occurredAt: true,
      kind: true,
      amount: true,
      description: true,
      note: true,
      bank: true,
      bankRef: true,
    },
  });

  const totals = items.reduce(
    (acc, x) => {
      if (x.kind === "income") acc.income += x.amount;
      else if (x.kind === "expense") acc.expense += x.amount;
      else if (x.kind === "job") acc.job += x.amount;
      return acc;
    },
    { income: 0, expense: 0, job: 0 }
  );

  return NextResponse.json({ items, totals });
}

/** POST /api/daily-expenses */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const item = await prisma.dailyExpense.create({
    data: {
      occurredAt: body.occurredAt ? new Date(body.occurredAt) : new Date(),
      kind: parseKind(body.kind),
      amount: Number(body.amount) || 0,
      description: String(body.description || "").slice(0, 800),
      category: String(body.category || "khac"),
      source: body.source === "ocr" ? "ocr" : "manual",
      bankRef: body.bankRef ? String(body.bankRef).slice(0, 100) : null,
      bank: body.bank ? String(body.bank).slice(0, 50) : null,
      note: body.note ? String(body.note).slice(0, 1000) : null,
    },
  });

  return NextResponse.json(item);
}

/** PATCH /api/daily-expenses?id=xxx */
export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (body.occurredAt !== undefined) data.occurredAt = new Date(body.occurredAt);
  if (body.kind !== undefined) data.kind = parseKind(body.kind);
  if (body.amount !== undefined) data.amount = Number(body.amount) || 0;
  if (body.description !== undefined) data.description = String(body.description).slice(0, 500);
  if (body.category !== undefined) data.category = String(body.category);
  if (body.bankRef !== undefined) data.bankRef = body.bankRef ? String(body.bankRef).slice(0, 100) : null;
  if (body.bank !== undefined) data.bank = body.bank ? String(body.bank).slice(0, 50) : null;
  if (body.note !== undefined) data.note = body.note ? String(body.note).slice(0, 1000) : null;

  const item = await prisma.dailyExpense.update({ where: { id }, data });
  return NextResponse.json(item);
}

/** DELETE /api/daily-expenses?id=xxx */
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.dailyExpense.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
