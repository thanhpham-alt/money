import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { remainingDebt } from "@/lib/money";
import { cardTotals } from "@/lib/credit";

export async function GET() {
  const [debts, cards] = await Promise.all([
    prisma.personalDebt.findMany({
      include: { payments: { orderBy: { paidAt: "desc" }, take: 20 } },
      orderBy: { key: "asc" },
    }),
    prisma.creditCard.findMany({
      include: { payments: { orderBy: [{ year: "desc" }, { month: "desc" }] } },
      orderBy: { sortOrder: "asc" },
    }),
  ]);
  // Thẻ: trừ dần theo kỳ đáo hạn (xem lib/credit.ts)
  const totals = cardTotals(cards);

  return NextResponse.json({
    debts: debts.map((d) => ({ ...d, remaining: remainingDebt(d) })),
    cards: totals.rows,
    cardTotals: {
      principal: totals.principal,
      thisMonth: totals.thisMonth,
      remaining: totals.remaining,
    },
  });
}

export async function PATCH(req: Request) {
  const body = await req.json();

  if (body.type === "debt" && body.id) {
    const d = await prisma.personalDebt.update({
      where: { id: String(body.id) },
      data: {
        ...(body.principal != null ? { principal: Number(body.principal) } : {}),
        ...(body.monthlyPayment != null
          ? { monthlyPayment: Number(body.monthlyPayment) }
          : {}),
        ...(body.monthsPaid != null ? { monthsPaid: Number(body.monthsPaid) } : {}),
        ...(body.amountPaid != null ? { amountPaid: Number(body.amountPaid) } : {}),
        ...(body.notes !== undefined
          ? { notes: body.notes ? String(body.notes) : null }
          : {}),
      },
    });
    return NextResponse.json({ ...d, remaining: remainingDebt(d) });
  }

  if (body.type === "debt-payment" && body.debtId) {
    const amount = Number(body.amount || 0);
    const payment = await prisma.debtPayment.create({
      data: {
        debtId: String(body.debtId),
        amount,
        note: body.note ? String(body.note) : null,
        paidAt: body.paidAt ? new Date(body.paidAt) : new Date(),
      },
    });
    const debt = await prisma.personalDebt.findUnique({
      where: { id: String(body.debtId) },
    });
    if (debt) {
      if (debt.key === "MOM") {
        await prisma.personalDebt.update({
          where: { id: debt.id },
          data: { monthsPaid: debt.monthsPaid + 1 },
        });
      } else {
        await prisma.personalDebt.update({
          where: { id: debt.id },
          data: { amountPaid: debt.amountPaid + amount },
        });
      }
    }
    return NextResponse.json(payment, { status: 201 });
  }

  if (body.type === "card" && body.id) {
    const c = await prisma.creditCard.update({
      where: { id: String(body.id) },
      data: {
        ...(body.bank != null ? { bank: String(body.bank) } : {}),
        ...(body.principal != null ? { principal: Number(body.principal) } : {}),
        ...(body.monthly != null ? { monthly: Number(body.monthly) } : {}),
        ...(body.dueDay != null
          ? { dueDay: Math.min(28, Math.max(1, Number(body.dueDay) || 1)) }
          : {}),
        ...(body.adjust != null ? { adjust: Number(body.adjust) } : {}),
        ...(body.startDate ? { startDate: new Date(String(body.startDate)) } : {}),
        ...(body.fixedOnly !== undefined
          ? { fixedOnly: Boolean(body.fixedOnly) }
          : {}),
      },
    });
    return NextResponse.json(c);
  }

  if (body.type === "card-create") {
    const maxSort = await prisma.creditCard.aggregate({ _max: { sortOrder: true } });
    const c = await prisma.creditCard.create({
      data: {
        bank: String(body.bank || "Bank"),
        principal: Number(body.principal || 0),
        monthly: Number(body.monthly || 0),
        dueDay: Math.min(28, Math.max(1, Number(body.dueDay) || 5)),
        fixedOnly: Boolean(body.fixedOnly),
        sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
      },
    });
    return NextResponse.json(c, { status: 201 });
  }

  return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "thiếu id" }, { status: 400 });

  if (type === "card") {
    await prisma.creditCard.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "type không hợp lệ" }, { status: 400 });
}
