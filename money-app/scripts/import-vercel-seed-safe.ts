import { PrismaClient } from "@prisma/client";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

const prisma = new PrismaClient();

const DEFAULT_LOCAL_SEED = path.resolve(process.cwd(), "../money2026-seed.json");
const SOURCE =
  process.env.IMPORT_SEED_FILE ||
  process.env.IMPORT_SEED_URL ||
  (existsSync(DEFAULT_LOCAL_SEED) ? DEFAULT_LOCAL_SEED : "") ||
  "https://money-git-main-thanhvideo65.vercel.app/money2026-seed.json";

type LegacyJob = [string, string, number, number, boolean];
type LegacyDebt = [string, number, number];

type LegacySeed = {
  rate?: { rows?: Array<{ name: string; qty?: number; half?: number; full?: number }> };
  budget?: { ngansach?: number; danhan?: number };
  bluescope?: Array<{
    name?: string;
    brief?: string;
    date?: string;
    type?: string;
    time?: string;
    photo?: number;
    video?: number;
    recap?: number;
    dung?: number;
    discount?: number;
    chiho?: number;
    note?: string;
  }>;
  jobs?: LegacyJob[];
  debts?: LegacyDebt[];
  pros?: Array<{
    id?: string;
    name?: string;
    client?: string;
    contract?: number;
    feeRate?: number;
    vatRate?: number;
    atan?: number;
    prod?: Array<{
      ten?: string;
      note?: string;
      cp?: number;
      otTien?: number;
      loai?: string;
      paid?: boolean;
    }>;
  }>;
  inputs?: Record<string, string>;
};

function money(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v !== "string") return 0;
  return Number(v.replace(/[^\d.-]/g, "")) || 0;
}

function dateOrNull(v?: string): Date | null {
  if (!v) return null;
  const d = new Date(`${v}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function sameDay(a: Date | null, b: Date | null) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);
}

function slug(v: string): string {
  return v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
}

function jobCode(row: LegacyJob, index: number) {
  const [agency, name] = row;
  const label = name || agency || `JOB_${index + 1}`;
  const known: Record<string, string> = {
    Rivus: "JOB_RIVUS",
    Masteris: "JOB_MASTERIS",
    Elyse: "JOB_ELYSE",
    "2 Mic": "JOB_2MIC",
    "Sky slois": "JOB_SKY",
    "Sun Group": "JOB_SUNG",
    pbcm: "JOB_PBCM",
    LG: "JOB_LG",
  };
  return known[name] || known[agency] || `JOB_${slug(label)}`;
}

function legacyRate(seed: LegacySeed, index: number) {
  return seed.rate?.rows?.[index] || { half: 0, full: 0 };
}

function legacyBluescopeShootCost(seed: LegacySeed, e: NonNullable<LegacySeed["bluescope"]>[number]) {
  const photo = Number(e.photo || 0);
  const video = Number(e.video || 0);
  const photoRate = legacyRate(seed, 0);
  const videoRate = legacyRate(seed, 1);
  if (e.time === "NỬA NGÀY") {
    return Number(photoRate.half || 0) * photo + Number(videoRate.half || 0) * video;
  }
  return Number(photoRate.full || 0) * photo + Number(videoRate.full || 0) * video;
}

function legacyBluescopeEditCost(seed: LegacySeed, e: NonNullable<LegacySeed["bluescope"]>[number]) {
  const recap = Number(e.recap || 0);
  if (recap > 0) {
    const editBase = legacyRate(seed, 2);
    const shortClip = legacyRate(seed, 3);
    return Number(editBase.half || 0) + recap * Number(shortClip.half || 0);
  }
  return Number(e.dung || 0);
}

async function loadSeed(): Promise<LegacySeed> {
  if (!/^https?:\/\//i.test(SOURCE)) {
    const raw = await readFile(SOURCE, "utf8");
    const jsonText = raw.trim().startsWith("window.MONEY2026_SEED=")
      ? raw.trim().replace(/^window\.MONEY2026_SEED=/, "").replace(/;?\s*$/, "")
      : raw;
    return JSON.parse(jsonText) as LegacySeed;
  }

  const res = await fetch(SOURCE);
  if (!res.ok) throw new Error(`Không tải được seed: ${res.status} ${res.statusText}`);
  return (await res.json()) as LegacySeed;
}

async function upsertSettings(seed: LegacySeed) {
  const inputs = seed.inputs || {};
  await prisma.settings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      cashOnHand: money(inputs.t_tui21),
      invoiceFeeRate: (money(inputs["pro-feerate"]) || 4) / 100,
      aTanShareRate: (money(inputs["pro-atanrate"]) || 22) / 100,
    },
    update: {
      cashOnHand: money(inputs.t_tui21),
      invoiceFeeRate: (money(inputs["pro-feerate"]) || 4) / 100,
      aTanShareRate: (money(inputs["pro-atanrate"]) || 22) / 100,
    },
  });
}

async function upsertLand(seed: LegacySeed) {
  const i = seed.inputs || {};
  await prisma.landFinance.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {
      capitalPartner: money(i.t_c5),
      capitalMine: money(i.t_d5),
      loanPartner: money(i.t_c10),
      loanMine: money(i.t_d10),
      loanTotalStart: money(i.ln_bal),
      loanMonthlyAmort: money(i.ln_principal),
      loanStartDate: dateOrNull(i.ln_next) || undefined,
      salePrice: money(i.tt_price || i.t_e15),
      loanCost1: money(i.t_e16),
      loanCost2: money(i.t_e17),
      partnerPrincipal: money(i.t_e33),
    },
  });
}

async function mergeBluescope(seed: LegacySeed) {
  let rateCreated = 0;
  let rateUpdated = 0;
  for (const [idx, r] of (seed.rate?.rows || []).entries()) {
    const existing = await prisma.bluescopeRate.findFirst({ where: { role: r.name || "" } });
    const data = {
      role: r.name || "",
      qty: Number(r.qty || 1),
      halfDay: Number(r.half || 0),
      fullDay: Number(r.full || 0),
      sortOrder: idx,
    };
    if (existing) {
      await prisma.bluescopeRate.update({ where: { id: existing.id }, data });
      rateUpdated++;
    } else {
      await prisma.bluescopeRate.create({ data });
      rateCreated++;
    }
  }

  let eventCreated = 0;
  let eventUpdated = 0;
  const currentEvents = await prisma.bluescopeEvent.findMany();
  for (const [idx, e] of (seed.bluescope || []).entries()) {
    const deliverDate = dateOrNull(e.date);
    const existing = currentEvents.find(
      (row) => row.name.trim() === (e.name || "").trim() && sameDay(row.deliverDate, deliverDate)
    );
    const data = {
      name: e.name || "",
      briefBy: e.brief || null,
      deliverDate,
      eventType: e.type || null,
      duration: e.time || null,
      photographers: Number(e.photo || 0),
      videographers: Number(e.video || 0),
      recapClips: Number(e.recap || 0),
      shootCost: legacyBluescopeShootCost(seed, e),
      editCost: legacyBluescopeEditCost(seed, e),
      discount: Number(e.discount || 0),
      paidByUs: Number(e.chiho || 0),
      note: e.note || null,
      sortOrder: idx,
    };
    if (existing) {
      await prisma.bluescopeEvent.update({ where: { id: existing.id }, data });
      eventUpdated++;
    } else {
      await prisma.bluescopeEvent.create({ data });
      eventCreated++;
    }
  }

  await prisma.job.upsert({
    where: { code: "JOB_BLUESCOPE" },
    create: {
      code: "JOB_BLUESCOPE",
      jobType: "BLUESCOPE",
      agency: "Bluescope",
      name: "Booking Bluescope",
      status: "Đang làm",
      contractTotal: Number(seed.budget?.ngansach || 0),
      collected: Number(seed.budget?.danhan || 0),
      publicVisible: true,
      sortOrder: 1,
    },
    update: {
      agency: "Bluescope",
      name: "Booking Bluescope",
      contractTotal: Number(seed.budget?.ngansach || 0),
      collected: Number(seed.budget?.danhan || 0),
      publicVisible: true,
    },
  });

  return { rateCreated, rateUpdated, eventCreated, eventUpdated };
}

async function mergeJobs(seed: LegacySeed) {
  let created = 0;
  let updated = 0;
  for (const [idx, row] of (seed.jobs || []).entries()) {
    const [agency, name, total, collectedRaw, paid] = row;
    const code = jobCode(row, idx);
    const collected = paid ? Number(total || 0) : Number(collectedRaw || 0);
    const exists = await prisma.job.findUnique({ where: { code } });
    await prisma.job.upsert({
      where: { code },
      create: {
        code,
        jobType: "AGENCY",
        agency: agency || name || "Job / Linh tinh",
        name: name || agency || "Job",
        status: paid ? "Đã thu" : collected > 0 ? "Một phần" : "Chờ thu",
        contractTotal: Number(total || 0),
        collected,
        sortOrder: idx + 10,
      },
      update: {
        agency: agency || name || "Job / Linh tinh",
        name: name || agency || "Job",
        status: paid ? "Đã thu" : collected > 0 ? "Một phần" : "Chờ thu",
        contractTotal: Number(total || 0),
        collected,
        sortOrder: idx + 10,
      },
    });
    exists ? updated++ : created++;
  }
  return { created, updated };
}

async function mergeCards(seed: LegacySeed) {
  let created = 0;
  let updated = 0;
  for (const [idx, [bank, principal, monthly]] of (seed.debts || []).entries()) {
    const existing = await prisma.creditCard.findFirst({ where: { bank } });
    const data = {
      bank,
      principal: Number(principal || 0),
      monthly: Number(monthly || 0),
      dueDay: 10,
      fixedOnly: bank === "Tiền cố định",
      sortOrder: idx,
    };
    if (existing) {
      await prisma.creditCard.update({ where: { id: existing.id }, data });
      updated++;
    } else {
      await prisma.creditCard.create({ data });
      created++;
    }
  }
  return { created, updated };
}

async function mergeProduction(seed: LegacySeed) {
  let jobs = 0;
  let expensesCreated = 0;
  let expensesUpdated = 0;
  for (const [projectIdx, pro] of (seed.pros || []).entries()) {
    const code = `PRO_${slug(pro.id || pro.name || String(projectIdx + 1))}`;
    const job = await prisma.job.upsert({
      where: { code },
      create: {
        code,
        jobType: "EVENT",
        agency: pro.client || "Production",
        name: pro.name || "Production",
        status: "Đang làm",
        contractTotal: Number(pro.contract || 0),
        collected: 0,
        aTanAmount: Number(pro.atan || 0),
        feeRate: (Number(pro.feeRate || 4) || 4) / 100,
        altFeeRate: (Number(pro.vatRate || 8) || 8) / 100,
        sortOrder: projectIdx,
      },
      update: {
        agency: pro.client || "Production",
        name: pro.name || "Production",
        contractTotal: Number(pro.contract || 0),
        aTanAmount: Number(pro.atan || 0),
        feeRate: (Number(pro.feeRate || 4) || 4) / 100,
        altFeeRate: (Number(pro.vatRate || 8) || 8) / 100,
        sortOrder: projectIdx,
      },
    });
    jobs++;

    for (const [idx, r] of (pro.prod || []).entries()) {
      const name = r.ten || "Chi phí";
      const existing = await prisma.jobExpense.findFirst({ where: { jobId: job.id, name } });
      const data = {
        jobId: job.id,
        name,
        amount: Number(r.cp || 0) + Number(r.otTien || 0),
        note: [r.note, r.loai ? `loại: ${r.loai}` : "", r.otTien ? `OT: ${r.otTien}` : ""]
          .filter(Boolean)
          .join(" · "),
        person: name,
        paidStatus: r.paid ? "Đã" : "Chưa",
        sortOrder: idx,
      };
      if (existing) {
        await prisma.jobExpense.update({ where: { id: existing.id }, data });
        expensesUpdated++;
      } else {
        await prisma.jobExpense.create({ data });
        expensesCreated++;
      }
    }
  }
  return { jobs, expensesCreated, expensesUpdated };
}

async function main() {
  const seed = await loadSeed();
  await upsertSettings(seed);
  await upsertLand(seed);
  const bluescope = await mergeBluescope(seed);
  const jobs = await mergeJobs(seed);
  const cards = await mergeCards(seed);
  const production = await mergeProduction(seed);

  console.log(JSON.stringify({ source: SOURCE, merged: { bluescope, jobs, cards, production } }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
