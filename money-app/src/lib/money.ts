import type { Job, JobExpense, PersonalDebt, CreditCard } from "@prisma/client";

export type JobWithExpenses = Job & { expenses: JobExpense[] };

export function jobMetrics(
  job: JobWithExpenses,
  invoiceFeeRate: number,
  aTanShareRate: number,
  /** Job BLUESCOPE: chi phí đến từ BluescopeEvent, không phải JobExpense */
  expenseTotalOverride?: number
) {
  const expenseTotal =
    expenseTotalOverride ?? job.expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const invoiceFee = job.contractTotal * invoiceFeeRate;
  const totalCost = invoiceFee + expenseTotal;
  const grossProfit = job.contractTotal - totalCost;
  const aTan = grossProfit * aTanShareRate;
  const netProfit = grossProfit - aTan;
  const remaining = job.contractTotal - job.collected;
  return {
    expenseTotal,
    invoiceFee,
    totalCost,
    grossProfit,
    aTan,
    netProfit,
    remaining,
  };
}

export function remainingDebt(d: PersonalDebt): number {
  if (d.key === "MOM" && d.monthlyPayment > 0) {
    return Math.max(0, d.principal - d.monthsPaid * d.monthlyPayment);
  }
  return Math.max(0, d.principal - d.amountPaid);
}

export function sumCreditPrincipal(cards: CreditCard[]): number {
  return cards.reduce((s, c) => s + (c.principal || 0), 0);
}

export function collectStatus(contract: number, collected: number): string {
  if (contract <= 0) return "—";
  if (collected >= contract) return "Đã thu";
  if (collected > 0) return "Một phần";
  return "Chưa thu";
}
