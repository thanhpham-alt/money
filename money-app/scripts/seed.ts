import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BLUESCOPE_URL =
  "https://docs.google.com/spreadsheets/d/1ygn6O9Ej1-AmaeCVDOp6UD3pnbiyhG0c-ZUJ4MgNzdo/edit";

async function main() {
  await prisma.settings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      cashOnHand: 71_000_000,
      invoiceFeeRate: 0.04,
      aTanShareRate: 0.2,
      bluescopeUrl: BLUESCOPE_URL,
    },
    update: {},
  });

  await prisma.personalDebt.upsert({
    where: { key: "MOM" },
    create: {
      key: "MOM",
      label: "Nợ MOM",
      principal: 88_000_000,
      monthlyPayment: 2_000_000,
      monthsPaid: 0,
      amountPaid: 0,
      notes: "Trả 2tr/tháng",
    },
    update: {},
  });
  await prisma.personalDebt.upsert({
    where: { key: "TRI" },
    create: {
      key: "TRI",
      label: "Nợ a Trí",
      principal: 175_000_000,
      monthlyPayment: 0,
      monthsPaid: 0,
      amountPaid: 0,
    },
    update: {},
  });

  const banks = [
    { bank: "TPBANK", principal: 2_000_000 },
    { bank: "TECHCOMBANK", principal: 2_500_000 },
    { bank: "OCB", principal: 2_000_000 },
    { bank: "SCB", principal: 4_000_000 },
  ];
  for (let i = 0; i < banks.length; i++) {
    const existing = await prisma.creditCard.findFirst({
      where: { bank: banks[i].bank },
    });
    if (!existing) {
      await prisma.creditCard.create({
        data: { ...banks[i], sortOrder: i },
      });
    }
  }

  const lgExpenses = [
    { name: "Camop 1", amount: 8_000_000, note: "Camera Operator 1" },
    { name: "Camop 2", amount: 6_000_000, note: "Camera Operator 2" },
    { name: "Producer", amount: 5_000_000, note: "Producer" },
    { name: "Catering", amount: 2_000_000, note: "Ăn uống" },
    { name: "Talent", amount: 3_000_000, note: "Talent" },
    { name: "Edit / Post", amount: 10_000_000, note: "Dựng" },
    { name: "Thiết bị / khác", amount: 4_000_000, note: "Thuê TB" },
  ];

  await prisma.job.upsert({
    where: { code: "JOB_LG" },
    create: {
      code: "JOB_LG",
      jobType: "AGENCY",
      agency: "LG",
      name: "LG Production",
      status: "Chờ thu",
      contractTotal: 63_104_000,
      collected: 0,
      sortOrder: 0,
      expenses: {
        create: lgExpenses.map((e, i) => ({
          ...e,
          paidStatus: "Chưa",
          sortOrder: i,
        })),
      },
    },
    update: { jobType: "AGENCY" },
  });

  await prisma.job.upsert({
    where: { code: "JOB_BLUESCOPE" },
    create: {
      code: "JOB_BLUESCOPE",
      jobType: "BLUESCOPE",
      agency: "Bluescope",
      name: "Booking production 2025–2026",
      status: "Đang làm",
      contractTotal: 100_000_000,
      collected: 0,
      externalUrl: BLUESCOPE_URL,
      publicVisible: true,
      notes: "Single source of truth — module /bluescope + public view",
      sortOrder: 1,
      expenses: {
        create: [
          {
            name: "Đã xài (tổng booking)",
            amount: 44_000_000,
            note: "Từ booking sheet",
            paidStatus: "Một phần",
            sortOrder: 0,
          },
        ],
      },
    },
    update: {
      jobType: "BLUESCOPE",
      publicVisible: true,
      externalUrl: BLUESCOPE_URL,
    },
  });

  const others = [
    { code: "JOB_RIVUS", agency: "Bizeyes - Thảo Hiếu", name: "Rivus", contractTotal: 10_700_000 },
    { code: "JOB_MASTERIS", agency: "Bizeyes - Hiếu", name: "Masteris", contractTotal: 2_500_000 },
    { code: "JOB_ELYSE", agency: "Bizeyes - Tuan", name: "Elyse", contractTotal: 5_000_000 },
    { code: "JOB_2MIC", agency: "2 Mic", name: "2 Mic", contractTotal: 7_000_000 },
    { code: "JOB_TRI", agency: "a Trí", name: "Job a Trí", contractTotal: 3_500_000 },
    { code: "JOB_SKY", agency: "Sky slois", name: "Sky slois", contractTotal: 20_000_000 },
    { code: "JOB_SUNG", agency: "Sun Group", name: "Sun Group", contractTotal: 23_000_000 },
    { code: "JOB_PBCM", agency: "pbcm", name: "pbcm", contractTotal: 26_000_000 },
  ];

  for (let i = 0; i < others.length; i++) {
    const o = others[i];
    await prisma.job.upsert({
      where: { code: o.code },
      create: {
        ...o,
        jobType: "AGENCY",
        status: "Chờ thu",
        collected: 0,
        sortOrder: i + 2,
      },
      update: { jobType: "AGENCY" },
    });
  }

  console.log("Seed OK");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
