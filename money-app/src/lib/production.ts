import type { Job, JobAdvance, JobExpense } from "@prisma/client";

export type JobFull = Job & { expenses: JobExpense[]; advances: JobAdvance[] };

/**
 * BẢNG TÍNH CHI PHÍ DỰ ÁN — bám đúng công thức sheet "JOB":
 *   C5  phí xuất hoá đơn      = C4 × 4%
 *   C21 tổng chi phí sản xuất = SUM(C7:C20)
 *   F19 tổng ứng              = SUM(F7:F17)
 *   C25 A Tân                 = nhập tay
 *   C24 = C5 + C25            (phí xuất + A Tân)
 *   C23 = C4×8% + C24         (phương án hoá đơn 8%)
 *   C27 lợi nhuận             = C4 − C21
 *   C28 lợi nhuận còn lại     = C27 − C24
 */
export function productionMetrics(
  job: JobFull,
  defaultFeeRate: number,
  defaultATanRate: number
) {
  const contract = job.contractTotal;
  const feeRate = job.feeRate ?? defaultFeeRate;

  // C5
  const invoiceFee = contract * feeRate;
  // C21
  const productionCost = job.expenses.reduce((s, e) => s + (e.amount || 0), 0);
  // F19
  const advanceTotal = job.advances.reduce((s, a) => s + (a.amount || 0), 0);

  // C25 — nhập tay; chưa nhập thì tạm tính theo % lợi nhuận
  const grossProfit = contract - productionCost; // C27
  const aTan = job.aTanAmount ?? grossProfit * defaultATanRate;

  // C24 = C5 + C25
  const distribution = invoiceFee + aTan;
  // C23 = C4×8% + C24
  const altInvoice = contract * job.altFeeRate;
  const altTotal = altInvoice + distribution;
  // C28 = C27 − C24
  const netProfit = grossProfit - distribution;

  return {
    contract,
    feeRate,
    invoiceFee,
    productionCost,
    advanceTotal,
    advanceRemaining: productionCost - advanceTotal,
    aTan,
    aTanIsManual: job.aTanAmount != null,
    distribution,
    altFeeRate: job.altFeeRate,
    altInvoice,
    altTotal,
    grossProfit,
    netProfit,
    /** Công nợ còn phải thu */
    remaining: contract - job.collected,
  };
}

/** Tài Chính · Đất — theo sheet "Tài Chính" */
export function landMetrics(
  f: {
    capitalPartner: number;
    capitalMine: number;
    loanPartner: number;
    loanMine: number;
    loanTotalStart: number;
    loanMonthlyAmort: number;
    loanStartDate: Date | string;
    salePrice: number;
    loanCost1: number;
    loanCost2: number;
    saleCommissionPct: number;
    partnerPrincipal: number;
  },
  now: Date = new Date()
) {
  // I · Góp vốn
  const capitalTotal = f.capitalPartner + f.capitalMine; // E5
  const ratioPartner = capitalTotal > 0 ? f.capitalPartner / capitalTotal : 0; // C6
  const ratioMine = capitalTotal > 0 ? f.capitalMine / capitalTotal : 0; // D6

  // II · Nợ ngân hàng — E10 giảm dần theo số tháng đã trả
  const start = new Date(f.loanStartDate);
  const monthsPaid = Math.max(
    0,
    (now.getFullYear() - start.getFullYear()) * 12 +
      (now.getMonth() - start.getMonth()) -
      (now.getDate() < start.getDate() ? 1 : 0)
  );
  const loanTotal = Math.max(
    0,
    f.loanTotalStart - f.loanMonthlyAmort * monthsPaid
  ); // E10 = E11

  // III · Lợi nhuận khi bán
  const commission = f.salePrice * f.saleCommissionPct; // E18
  const costTotal = f.loanCost1 + f.loanCost2 + commission; // E19
  const priceGain = f.salePrice - capitalTotal; // E20
  const netGain = priceGain - costTotal; // E21

  // IV · Chia lợi nhuận
  const profitPartner = ratioPartner * netGain; // C26
  const profitMine = ratioMine * netGain; // D26

  // V · Quyết toán của tôi
  const capitalBack = capitalTotal - loanTotal; // E31
  const loanCostsPaid = f.loanCost1 + f.loanCost2; // E32
  const takeHome = profitMine + capitalBack + loanCostsPaid - f.partnerPrincipal; // E35

  return {
    capitalTotal,
    ratioPartner,
    ratioMine,
    monthsPaid,
    loanTotal,
    commission,
    costTotal,
    priceGain,
    netGain,
    profitPartner,
    profitMine,
    capitalBack,
    loanCostsPaid,
    takeHome,
  };
}
