import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const { id: jobId } = await ctx.params;
  const body = await req.json();
  const maxSort = await prisma.jobExpense.aggregate({
    where: { jobId },
    _max: { sortOrder: true },
  });
  const expense = await prisma.jobExpense.create({
    data: {
      jobId,
      name: String(body.name || "Chi phí mới"),
      amount: Number(body.amount || 0),
      note: body.note ? String(body.note) : null,
      person: body.person ? String(body.person) : null,
      paidStatus: String(body.paidStatus || "Chưa"),
      sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
    },
  });
  return NextResponse.json(expense, { status: 201 });
}

/**
 * Đặt TỔNG chi phí bằng 1 số (form nhập nhanh).
 * 0 dòng → tạo dòng "Chi phí"; 1 dòng → sửa dòng đó.
 * ≥2 dòng → từ chối, phải sửa trong phần chi tiết (tránh xoá mất dữ liệu).
 */
export async function PUT(req: Request, ctx: Ctx) {
  const { id: jobId } = await ctx.params;
  const body = await req.json();
  const amount = Number(body.lump) || 0;

  const rows = await prisma.jobExpense.findMany({
    where: { jobId },
    orderBy: { sortOrder: "asc" },
  });

  if (rows.length >= 2) {
    return NextResponse.json(
      { error: "Job có nhiều dòng chi phí — sửa trong phần chi tiết", lines: rows.length },
      { status: 409 }
    );
  }

  const expense = rows[0]
    ? await prisma.jobExpense.update({ where: { id: rows[0].id }, data: { amount } })
    : await prisma.jobExpense.create({
        data: { jobId, name: "Chi phí", amount, paidStatus: "Chưa", sortOrder: 0 },
      });

  return NextResponse.json(expense);
}

export async function PATCH(req: Request, ctx: Ctx) {
  await ctx.params; // job id not needed when updating by expense id
  const body = await req.json();
  if (!body.id) {
    return NextResponse.json({ error: "Missing expense id" }, { status: 400 });
  }
  const expense = await prisma.jobExpense.update({
    where: { id: String(body.id) },
    data: {
      ...(body.name != null ? { name: String(body.name) } : {}),
      ...(body.amount != null ? { amount: Number(body.amount) } : {}),
      ...(body.note !== undefined
        ? { note: body.note ? String(body.note) : null }
        : {}),
      ...(body.person !== undefined
        ? { person: body.person ? String(body.person) : null }
        : {}),
      ...(body.paidStatus != null ? { paidStatus: String(body.paidStatus) } : {}),
    },
  });
  return NextResponse.json(expense);
}

export async function DELETE(req: Request, ctx: Ctx) {
  await ctx.params;
  const { searchParams } = new URL(req.url);
  const expenseId = searchParams.get("expenseId");
  if (!expenseId) {
    return NextResponse.json({ error: "Missing expenseId" }, { status: 400 });
  }
  await prisma.jobExpense.delete({ where: { id: expenseId } });
  return NextResponse.json({ ok: true });
}
