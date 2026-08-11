/**
 * Seed Bluescope từ "BLUESCOPE BOOKING 2026.xlsx" — chạy 1 lần.
 * Idempotent: chỉ seed khi bảng còn trống (không đè data user đã nhập).
 *   npm run db:seed:bluescope
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const d = (s: string) => new Date(`${s}T00:00:00.000Z`);

const RATES = [
  { role: "PHOTO - RETOUCH (FREE)", qty: 1, halfDay: 3_000_000, fullDay: 5_000_000 },
  { role: "CAMERA MAN", qty: 1, halfDay: 3_500_000, fullDay: 6_000_000 },
  { role: "EDIT VIDEO 9:16 - TIKTOK", qty: 1, halfDay: 5_000_000, fullDay: 0 },
  { role: "SHORT CLIP (VIE-ENG)", qty: 1, halfDay: 3_000_000, fullDay: 0 },
];

const EVENTS = [
  {
    name: "Quay Trồng Cây",
    briefBy: "NGUYÊN",
    deliverDate: d("2026-06-11"),
    eventType: "ĐI TỈNH",
    videographers: 1,
    recapClips: 1,
    duration: "CẢ NGÀY",
    shootCost: 5_000_000,
    editCost: 8_000_000,
  },
  {
    name: "Quay Bình Dương",
    briefBy: "NGUYÊN",
    deliverDate: d("2026-06-17"),
    eventType: "ĐI TỈNH",
    videographers: 1,
    recapClips: 2,
    duration: "CẢ NGÀY",
    shootCost: 5_000_000,
    editCost: 11_000_000,
    note: "Đi xa + 1 nhân sự quay chụp",
  },
  {
    name: "Sửa POSM",
    briefBy: "NGUYÊN",
    deliverDate: d("2026-06-26"),
    eventType: "BRIEF KHÁC",
    duration: "NỬA NGÀY",
    editCost: 3_000_000,
  },
  { name: "FY 26", eventType: "BRIEF KHÁC" },
  {
    name: "Recap Q3",
    briefBy: "NGUYÊN",
    deliverDate: d("2025-06-06"),
    eventType: "EDIT",
    recapClips: 1,
    duration: "NỬA NGÀY",
    editCost: 8_000_000,
  },
  {
    name: "POSM _ 2 banner",
    briefBy: "NGUYÊN",
    deliverDate: d("2025-07-04"),
    eventType: "BRIEF KHÁC",
    duration: "CẢ NGÀY",
    editCost: 2_000_000,
  },
  {
    name: "Recap Q3 fix 2",
    briefBy: "NGUYÊN",
    deliverDate: d("2026-07-19"),
    eventType: "HCM",
    duration: "CẢ NGÀY",
    editCost: 2_000_000,
  },
  { name: "Recap FY26", eventType: "EDIT" },
];

const PACKAGES = [
  {
    name: "VIDEO CƠ BẢN",
    items: [
      { name: "CAMERA MAN", unit: "NGƯỜI /1 BUỔI", qty: 1, unitPrice: 2_000_000 },
      { name: "THIẾT BỊ", unit: "MÁY", qty: 1, unitPrice: 4_000_000 },
    ],
  },
  {
    name: "PODCAST",
    items: [
      { name: "CAMERA MAN", unit: "NGƯỜI /1 BUỔI", qty: 3, unitPrice: 2_000_000 },
      { name: "CAM CẬN", unit: "MÁY", qty: 3, unitPrice: 4_000_000 },
      { name: "MAKE UP", unit: "NGƯỜI", qty: 1, unitPrice: 4_000_000 },
      { name: "LIGHTING CƠ BẢN", unit: "DỰ ÁN", qty: 1, unitPrice: 5_000_000 },
      { name: "MIC PODCAST", unit: "DỰ ÁN", qty: 1, unitPrice: 5_000_000 },
      { name: "EDIT VIDEO PODCAST (20-40P)", unit: "DỰ ÁN", qty: 2, unitPrice: 10_000_000 },
      { name: "EDIT SHORT VIDEO (2-4 VIDEO)", unit: "DỰ ÁN", qty: 2, unitPrice: 4_000_000 },
    ],
  },
  {
    name: "EVENT",
    items: [
      { name: "CAMERA MAN", unit: "NGƯỜI /1 BUỔI", qty: 3, unitPrice: 3_000_000 },
      { name: "SONY 4K", unit: "GÓI", qty: 3, unitPrice: 5_000_000 },
      { name: "PHOTO GRAPHER", unit: "GÓI", qty: 1, unitPrice: 4_000_000 },
      { name: "LIVE SỰ KIỆN LÊN LED", unit: "GÓI", qty: 1, unitPrice: 10_000_000 },
      { name: "EDIT VIDEO RECAP", unit: "GÓI", qty: 1, unitPrice: 8_000_000 },
    ],
  },
];

type C = {
  name: string;
  contentType?: string;
  publishDate?: Date;
  originalCost?: number;
  finalCost?: number;
  scope?: string;
};

const EXTERNAL: C[] = [
  { name: "Solar Live event", contentType: "Multi Image", publishDate: d("2026-07-11"), originalCost: 2_000_000, finalCost: 2_400_000, scope: "Chụp hình" },
  { name: "LEED event", contentType: "Video", publishDate: d("2026-07-14"), originalCost: 11_500_000, finalCost: 13_800_000, scope: "Quay, dựng" },
  { name: "EPD", contentType: "Multi Image", publishDate: d("2026-07-15"), scope: "PR" },
  { name: "Responsible Sourcing - Vietsuccess", contentType: "Video", publishDate: d("2026-08-06") },
  { name: "Responsible Sourcing - Vietsuccess", contentType: "Link Youtube", publishDate: d("2026-08-06") },
  { name: "Responsible Sourcing - Visit NCC", contentType: "Multi Image", publishDate: d("2026-08-12") },
  { name: "Forest planting", contentType: "Video", publishDate: d("2026-09-08"), originalCost: 18_000_000, finalCost: 20_700_000 },
  { name: "Safety Workshop Phu My", contentType: "Video", publishDate: d("2026-09-12"), originalCost: 20_000_000, finalCost: 24_000_000 },
  { name: "Responsible Sourcing Hoa Lam", contentType: "Video", publishDate: d("2026-09-15"), originalCost: 5_000_000, finalCost: 6_000_000, scope: "Dựng" },
  { name: "Inside Out Branding 1", contentType: "Video", publishDate: d("2026-10-01"), originalCost: 5_000_000, finalCost: 6_000_000 },
  { name: "Inside Out Branding 2", contentType: "Video", publishDate: d("2026-10-13"), originalCost: 5_000_000, finalCost: 6_000_000 },
  { name: "Inside Out Branding 3", contentType: "Video", publishDate: d("2026-10-15"), originalCost: 5_000_000, finalCost: 6_000_000 },
  { name: "Inside Out Branding 4", contentType: "Video", publishDate: d("2026-10-17"), originalCost: 5_000_000, finalCost: 6_000_000 },
  { name: "Responsible Sourcing Hiep Phat", contentType: "Video", publishDate: d("2026-10-20"), originalCost: 5_000_000, finalCost: 6_000_000 },
  { name: "University Partnership", contentType: "Multi Image", publishDate: d("2026-10-27"), originalCost: 10_000_000, finalCost: 12_000_000 },
  { name: "KKKNK x Insee", contentType: "Multi Image", publishDate: d("2026-10-31"), originalCost: 3_000_000, finalCost: 3_600_000 },
  { name: "VIPF event", contentType: "Multi Image", publishDate: d("2026-11-03") },
  { name: "Inside Out Branding 5", contentType: "Video", publishDate: d("2026-11-20"), originalCost: 5_000_000, finalCost: 6_000_000 },
  { name: "BlueScope 20 years", contentType: "Multi Image", publishDate: d("2026-11-22") },
  { name: "Inside Out Branding 6", contentType: "Video", publishDate: d("2026-11-25"), originalCost: 5_000_000, finalCost: 6_000_000 },
  { name: "Plant tour x Australian Embassy, the Consulate General and the Australian Trade Commission", contentType: "Multi Image", publishDate: d("2026-12-04") },
  { name: "BlueScope 20 years", contentType: "Video", publishDate: d("2026-12-18"), originalCost: 20_000_000, finalCost: 24_000_000 },
  { name: "Inside Out Branding 7", contentType: "Video", publishDate: d("2026-12-25"), originalCost: 5_000_000, finalCost: 6_000_000 },
  { name: "INSEE i2i Talks #8 | sustainable construction", contentType: "Multi Image", publishDate: d("2026-12-26") },
  { name: "Look back 2025", contentType: "Multi Image", publishDate: d("2026-01-01") },
  { name: "Inside Out Branding 8", contentType: "Video", publishDate: d("2026-01-04"), originalCost: 5_000_000, finalCost: 6_000_000 },
  { name: "Country President POV", contentType: "Video", publishDate: d("2026-03-16") },
  { name: "ACCA Approved Employer", contentType: "Multi Image", publishDate: d("2026-03-15") },
  { name: "Podcast chị Trinh", contentType: "Podcast", finalCost: 25_000_000 },
  { name: "Interview anh Bang", contentType: "Interview", finalCost: 25_000_000 },
];

const INTERNAL: C[] = [
  { name: "Recap Q1", contentType: "Video", originalCost: 5_000_000, finalCost: 6_000_000 },
  { name: "Recap Q2", contentType: "Video", originalCost: 5_000_000, finalCost: 6_000_000 },
  { name: "Recap Q3", contentType: "Video", originalCost: 5_000_000, finalCost: 6_000_000 },
  { name: "Sport Year End", contentType: "Video", originalCost: 5_000_000, finalCost: 6_000_000 },
  { name: "Chia tay a Nhựt", contentType: "Video", originalCost: 5_000_000, finalCost: 6_000_000 },
  { name: "Chụp hình CMT", contentType: "Photo shooting", originalCost: 24_000_000, finalCost: 28_800_000 },
];

async function main() {
  if ((await prisma.bluescopeRate.count()) === 0) {
    await prisma.bluescopeRate.createMany({
      data: RATES.map((r, i) => ({ ...r, sortOrder: i })),
    });
    console.log(`✓ ${RATES.length} rate card nhân sự`);
  } else console.log("• rate card đã có — bỏ qua");

  if ((await prisma.bluescopeEvent.count()) === 0) {
    await prisma.bluescopeEvent.createMany({
      data: EVENTS.map((e, i) => ({ ...e, sortOrder: i })),
    });
    console.log(`✓ ${EVENTS.length} booking sự kiện`);
  } else console.log("• events đã có — bỏ qua");

  if ((await prisma.bluescopePackage.count()) === 0) {
    for (const [i, p] of PACKAGES.entries()) {
      await prisma.bluescopePackage.create({
        data: {
          name: p.name,
          sortOrder: i,
          items: { create: p.items.map((it, j) => ({ ...it, sortOrder: j })) },
        },
      });
    }
    console.log(`✓ ${PACKAGES.length} gói báo giá`);
  } else console.log("• packages đã có — bỏ qua");

  if ((await prisma.bluescopeContent.count()) === 0) {
    await prisma.bluescopeContent.createMany({
      data: [
        ...EXTERNAL.map((c, i) => ({ ...c, channel: "EXTERNAL", sortOrder: i })),
        ...INTERNAL.map((c, i) => ({ ...c, channel: "INTERNAL", sortOrder: i })),
      ],
    });
    console.log(`✓ ${EXTERNAL.length + INTERNAL.length} dòng content list`);
  } else console.log("• content list đã có — bỏ qua");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
