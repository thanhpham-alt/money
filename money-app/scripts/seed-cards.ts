/** Thẻ tín dụng — số thật từ sheet CÔNG NỢ + ngày đáo hạn thật. */
import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

const CARDS = [
  { bank: "TECHCOMBANK", principal: 71_800_000, monthly: 0, dueDay: 5 },
  { bank: "TPBANK", principal: 24_568_000, monthly: 0, dueDay: 25 },
  { bank: "OCB", principal: 1_262_000, monthly: 0, dueDay: 25 },
  { bank: "SCB", principal: 8_610_000, monthly: 6_903_000, dueDay: 25 },
  { bank: "Tiền cố định", principal: 0, monthly: 8_000_000, dueDay: 5, fixedOnly: true },
];

async function main() {
  await p.creditCard.deleteMany();
  for (const [i, c] of CARDS.entries()) {
    await p.creditCard.create({
      data: { ...c, startDate: new Date("2026-08-01T00:00:00.000Z"), sortOrder: i },
    });
  }
  console.log(`✓ ${CARDS.length} thẻ (Techcombank ngày 5 · TPB/OCB/SCB ngày 25)`);
}
main().finally(() => p.$disconnect());
