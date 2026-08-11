import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { collectStatus, jobMetrics } from "@/lib/money";
import { isJobType, type JobType } from "@/lib/job-types";
import { eventTotal } from "@/lib/bluescope";

export async function GET() {
  const [settings, jobs, bsEvents] = await Promise.all([
    prisma.settings.upsert({
      where: { id: "default" },
      create: { id: "default" },
      update: {},
    }),
    prisma.job.findMany({
      include: { expenses: { orderBy: { sortOrder: "asc" } } },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.bluescopeEvent.findMany(),
  ]);

  // Bluescope: chi phí = tổng booking events (xem /api/bluescope)
  const bluescopeSpent = bsEvents.reduce((s, e) => s + eventTotal(e), 0);

  const rows = jobs.map((j) => {
    const m = jobMetrics(
      j,
      settings.invoiceFeeRate,
      settings.aTanShareRate,
      j.jobType === "BLUESCOPE" ? bluescopeSpent : undefined
    );
    return {
      ...j,
      metrics: m,
      collectStatus: collectStatus(j.contractTotal, j.collected),
    };
  });

  return NextResponse.json({ jobs: rows, settings });
}

export async function POST(req: Request) {
  const body = await req.json();
  const jobType: JobType = isJobType(body.jobType) ? body.jobType : "AGENCY";

  const code =
    String(body.code || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "_") ||
    (jobType === "BLUESCOPE"
      ? "JOB_BLUESCOPE"
      : `JOB_${Date.now().toString(36).toUpperCase()}`);

  if (jobType === "BLUESCOPE") {
    const existing = await prisma.job.findFirst({
      where: { OR: [{ code: "JOB_BLUESCOPE" }, { jobType: "BLUESCOPE" }] },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Đã có job Bluescope — mở tab Bluescope hoặc Job Production", id: existing.id },
        { status: 409 }
      );
    }
  }

  const settings = await prisma.settings.findUnique({ where: { id: "default" } });
  const maxSort = await prisma.job.aggregate({ _max: { sortOrder: true } });

  const agency =
    String(body.agency || "").trim() ||
    (jobType === "BLUESCOPE" ? "Bluescope" : "Agency");
  const name =
    String(body.name || "").trim() ||
    (jobType === "BLUESCOPE"
      ? "Booking production"
      : jobType === "EVENT"
        ? "Sự kiện quay"
        : "Job production");

  // Không tạo sẵn dòng chi phí nào: form nhập 1 số TỔNG (PUT .../expenses).
  // Muốn tách chi tiết thì tự thêm dòng trong phần "Chi tiết chi phí".
  const defaultExpenses: { name: string; amount: number }[] = [];

  const job = await prisma.job.create({
    data: {
      code,
      jobType,
      agency,
      name,
      status: String(body.status || "Đang làm"),
      contractTotal: Number(body.contractTotal || 0),
      collected: Number(body.collected || 0),
      externalUrl:
        jobType === "BLUESCOPE"
          ? body.externalUrl || settings?.bluescopeUrl || null
          : body.externalUrl
            ? String(body.externalUrl)
            : null,
      notes: body.notes ? String(body.notes) : null,
      publicVisible: jobType === "BLUESCOPE" ? true : Boolean(body.publicVisible),
      sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
      expenses: {
        create: defaultExpenses.map((e, i) => ({
          name: e.name,
          amount: e.amount,
          paidStatus: "Chưa",
          sortOrder: i,
        })),
      },
    },
    include: { expenses: true },
  });

  return NextResponse.json(job, { status: 201 });
}
