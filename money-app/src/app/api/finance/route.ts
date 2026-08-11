import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { landMetrics } from "@/lib/production";

/** Tài Chính · Đất — singleton, theo sheet "Tài Chính" */

const FIELDS = [
  "capitalPartner",
  "capitalMine",
  "loanPartner",
  "loanMine",
  "loanTotalStart",
  "loanMonthlyAmort",
  "salePrice",
  "loanCost1",
  "loanCost2",
  "saleCommissionPct",
  "partnerPrincipal",
] as const;

async function load() {
  return prisma.landFinance.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {},
  });
}

export async function GET() {
  const land = await load();
  return NextResponse.json({ land, metrics: landMetrics(land) });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  await load();

  const data: Record<string, number | Date> = {};
  for (const f of FIELDS) {
    if (body[f] != null) data[f] = Number(body[f]) || 0;
  }
  if (body.loanStartDate) {
    const d = new Date(String(body.loanStartDate));
    if (!Number.isNaN(d.getTime())) data.loanStartDate = d;
  }

  const land = await prisma.landFinance.update({ where: { id: "default" }, data });
  return NextResponse.json({ land, metrics: landMetrics(land) });
}
