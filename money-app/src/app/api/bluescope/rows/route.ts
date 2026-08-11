import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * CRUD 1 dòng cho mọi bảng Bluescope — 1 endpoint, whitelist field theo bảng.
 *   POST   { table, ...fields }        → thêm dòng (sortOrder tự tăng)
 *   PATCH  { table, id, ...fields }    → sửa 1 ô
 *   PATCH  { table, order: [id,…] }    → sắp xếp lại
 *   DELETE ?table=…&id=…               → xóa dòng
 */

type Kind = "num" | "int" | "str" | "date";

const TABLES = {
  rate: {
    model: "bluescopeRate",
    fields: {
      role: "str",
      qty: "int",
      halfDay: "num",
      fullDay: "num",
      note: "str",
    },
    defaults: { role: "" },
  },
  event: {
    model: "bluescopeEvent",
    fields: {
      name: "str",
      briefBy: "str",
      deliverDate: "date",
      brief: "str",
      eventType: "str",
      photographers: "int",
      videographers: "int",
      recapClips: "int",
      duration: "str",
      shootCost: "num",
      editCost: "num",
      discount: "num",
      paidByUs: "num",
      note: "str",
    },
    defaults: { name: "" },
  },
  content: {
    model: "bluescopeContent",
    fields: {
      channel: "str",
      name: "str",
      contentType: "str",
      publishDate: "date",
      originalCost: "num",
      finalCost: "num",
      scope: "str",
    },
    defaults: { name: "", channel: "EXTERNAL" },
  },
  package: {
    model: "bluescopePackage",
    fields: { name: "str", note: "str" },
    defaults: { name: "Gói mới" },
  },
  packageItem: {
    model: "bluescopePackageItem",
    fields: {
      packageId: "str",
      name: "str",
      unit: "str",
      qty: "num",
      unitPrice: "num",
    },
    defaults: { name: "" },
  },
} as const satisfies Record<
  string,
  { model: string; fields: Record<string, Kind>; defaults: Record<string, unknown> }
>;

type TableName = keyof typeof TABLES;

function isTable(v: unknown): v is TableName {
  return typeof v === "string" && v in TABLES;
}

/** Ép giá trị theo kind; "" / null → null cho str/date, 0 cho số. */
function coerce(kind: Kind, raw: unknown): unknown {
  if (kind === "num" || kind === "int") {
    if (raw === null || raw === "") return null;
    const n = Number(raw);
    if (!Number.isFinite(n)) return null;
    return kind === "int" ? Math.trunc(n) : n;
  }
  if (kind === "date") {
    if (!raw) return null;
    const dt = new Date(String(raw));
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  if (raw === null || raw === undefined) return null;
  const s = String(raw);
  return s === "" ? null : s;
}

/** Chỉ lấy field có trong whitelist và có mặt trong body. */
function pick(table: TableName, body: Record<string, unknown>) {
  const spec = TABLES[table].fields as Record<string, Kind>;
  const data: Record<string, unknown> = {};
  for (const [key, kind] of Object.entries(spec)) {
    if (key in body) data[key] = coerce(kind, body[key]);
  }
  return data;
}

// Prisma delegate cùng shape cho mọi bảng Bluescope
type Delegate = {
  create: (a: { data: Record<string, unknown> }) => Promise<unknown>;
  update: (a: {
    where: { id: string };
    data: Record<string, unknown>;
  }) => Promise<unknown>;
  delete: (a: { where: { id: string } }) => Promise<unknown>;
  aggregate: (a: {
    _max: { sortOrder: true };
    where?: Record<string, unknown>;
  }) => Promise<{ _max: { sortOrder: number | null } }>;
};

function delegate(table: TableName): Delegate {
  return (prisma as unknown as Record<string, Delegate>)[TABLES[table].model];
}

export async function POST(req: Request) {
  const body = (await req.json()) as Record<string, unknown>;
  if (!isTable(body.table)) {
    return NextResponse.json({ error: "table không hợp lệ" }, { status: 400 });
  }
  const table = body.table;
  const db = delegate(table);

  // Dòng mới xuống cuối, tính trong phạm vi nhóm (channel / packageId)
  const scope: Record<string, unknown> = {};
  if (table === "content" && body.channel) scope.channel = String(body.channel);
  if (table === "packageItem" && body.packageId)
    scope.packageId = String(body.packageId);

  const agg = await db.aggregate({
    _max: { sortOrder: true },
    ...(Object.keys(scope).length ? { where: scope } : {}),
  });

  const row = await db.create({
    data: {
      ...TABLES[table].defaults,
      ...pick(table, body),
      sortOrder: (agg._max.sortOrder ?? -1) + 1,
    },
  });

  return NextResponse.json({ row });
}

export async function PATCH(req: Request) {
  const body = (await req.json()) as Record<string, unknown>;
  if (!isTable(body.table)) {
    return NextResponse.json({ error: "table không hợp lệ" }, { status: 400 });
  }
  const table = body.table;
  const db = delegate(table);

  // Sắp xếp lại: mảng id theo thứ tự mới
  if (Array.isArray(body.order)) {
    const ids = body.order.filter((x): x is string => typeof x === "string");
    await prisma.$transaction(async () => {
      for (const [i, id] of ids.entries()) {
        await db.update({ where: { id }, data: { sortOrder: i } });
      }
    });
    return NextResponse.json({ ok: true, reordered: ids.length });
  }

  if (typeof body.id !== "string") {
    return NextResponse.json({ error: "thiếu id" }, { status: 400 });
  }

  const data = pick(table, body);
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "không có field nào để sửa" }, { status: 400 });
  }

  const row = await db.update({ where: { id: body.id }, data });
  return NextResponse.json({ row });
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const table = url.searchParams.get("table");
  const id = url.searchParams.get("id");
  if (!isTable(table)) {
    return NextResponse.json({ error: "table không hợp lệ" }, { status: 400 });
  }
  if (!id) return NextResponse.json({ error: "thiếu id" }, { status: 400 });

  await delegate(table).delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
