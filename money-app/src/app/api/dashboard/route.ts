import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  collectStatus,
  jobMetrics,
  remainingDebt,
  sumCreditPrincipal,
} from "@/lib/money";
import { eventTotal } from "@/lib/bluescope";
import { landMetrics, productionMetrics } from "@/lib/production";

export async function GET() {
  const [settings, jobs, debts, cards, bsEvents, land] = await Promise.all([
    prisma.settings.upsert({
      where: { id: "default" },
      create: { id: "default" },
      update: {},
    }),
    prisma.job.findMany({
      include: { expenses: true, advances: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.personalDebt.findMany({ orderBy: { key: "asc" } }),
    prisma.creditCard.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.bluescopeEvent.findMany(),
    prisma.landFinance.upsert({
      where: { id: "default" },
      create: { id: "default" },
      update: {},
    }),
  ]);

  const fee = settings.invoiceFeeRate;
  const aTan = settings.aTanShareRate;

  // Bluescope: chi phí = tổng booking events (1 nguồn số, không đọc JobExpense)
  const bluescopeSpent = bsEvents.reduce((s, e) => s + eventTotal(e), 0);

  const jobRows = jobs.map((j) => {
    const m = jobMetrics(
      j,
      fee,
      aTan,
      j.jobType === "BLUESCOPE" ? bluescopeSpent : undefined
    );
    // Production: lợi nhuận thật sau A Tân + phí xuất HĐ (công thức sheet JOB)
    const p = productionMetrics(
      j.jobType === "BLUESCOPE"
        ? { ...j, expenses: [{ amount: bluescopeSpent } as never] }
        : j,
      fee,
      aTan
    );
    return {
      id: j.id,
      code: j.code,
      jobType: j.jobType,
      agency: j.agency,
      name: j.name,
      status: j.status,
      externalUrl: j.externalUrl,
      contractTotal: j.contractTotal,
      collected: j.collected,
      ...m,
      aTanAmount: p.aTan,
      netProfitAfterATan: p.netProfit,
      advanceTotal: p.advanceTotal,
      collectStatus: collectStatus(j.contractTotal, j.collected),
    };
  });

  const totalContract = jobRows.reduce((s, j) => s + j.contractTotal, 0);
  const totalCollected = jobRows.reduce((s, j) => s + j.collected, 0);
  const totalRemaining = jobRows.reduce((s, j) => s + j.remaining, 0);
  const totalCost = jobRows.reduce((s, j) => s + j.totalCost, 0);
  const totalProfit = jobRows.reduce((s, j) => s + j.grossProfit, 0);
  const totalATan = jobRows.reduce((s, j) => s + j.aTanAmount, 0);
  const totalNetProfit = jobRows.reduce((s, j) => s + j.netProfitAfterATan, 0);

  const debtMom = debts.find((d) => d.key === "MOM");
  const debtTri = debts.find((d) => d.key === "TRI");
  const momRemaining = debtMom ? remainingDebt(debtMom) : 0;
  const triRemaining = debtTri ? remainingDebt(debtTri) : 0;
  const creditTotal = sumCreditPrincipal(cards);
  const totalDebt = momRemaining + triRemaining + creditTotal;
  const cash = settings.cashOnHand;
  const netWorth = cash - totalDebt;
  const health = cash + totalRemaining - totalDebt;

  return NextResponse.json({
    settings,
    kpis: {
      cash,
      momRemaining,
      triRemaining,
      creditTotal,
      totalDebt,
      netWorth,
      totalContract,
      totalCollected,
      totalRemaining,
      totalCost,
      totalProfit,
      totalATan,
      totalNetProfit,
      health,
      landTakeHome: landMetrics(land).takeHome,
    },
    jobs: jobRows,
    land: { ...land, metrics: landMetrics(land) },
    debts: debts.map((d) => ({
      ...d,
      remaining: remainingDebt(d),
    })),
    cards,
  });
}
