"use client";

import { useEffect, useState } from "react";
import { Pill } from "@/components/sheet/pill";
import { cn, formatVnd } from "@/lib/utils";
import { CHANNEL_LABELS } from "@/lib/bluescope-const";

type PublicData = {
  title: string;
  agency: string;
  status: string;
  budget: number;
  spent: number;
  remaining: number;
  usedPct: number;
  rates: { id: string; role: string; qty: number; halfDay: number; fullDay: number }[];
  events: {
    id: string;
    name: string;
    deliverDate: string | null;
    eventType: string | null;
    duration: string | null;
    photographers: number;
    videographers: number;
    recapClips: number;
    shootCost: number;
    editCost: number;
    total: number;
    note: string | null;
  }[];
  contents: {
    id: string;
    channel: string;
    name: string;
    contentType: string | null;
    publishDate: string | null;
    finalCost: number | null;
    scope: string | null;
  }[];
  updatedAt: string;
};

const fmtDate = (v: string | null) =>
  v ? new Date(v).toLocaleDateString("vi-VN") : "—";

export function BluescopePublicView() {
  const [data, setData] = useState<PublicData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/public/bluescope")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Không tải được");
        setData(json);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-lg font-medium text-slate-800 dark:text-[var(--text-primary)]">
          {error}
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Liên hệ MAC Media nếu bạn cần truy cập bảng booking.
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-slate-500">
        Đang tải…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <header>
        <p className="text-sm font-semibold text-violet-600">{data.agency}</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-[var(--text-primary)]">
          {data.title}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Trạng thái: {data.status}
          {data.updatedAt && (
            <> · Cập nhật {new Date(data.updatedAt).toLocaleString("vi-VN")}</>
          )}
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Ngân sách", value: data.budget, tone: "" },
          { label: "Đã xài", value: data.spent, tone: "text-amber-600" },
          { label: "Còn lại", value: data.remaining, tone: "text-emerald-600" },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm dark:border-[var(--border-subtle)] dark:bg-[var(--surface-1)]"
          >
            <p className="text-xs font-medium text-slate-500">{c.label}</p>
            <p
              className={cn(
                "mt-1 text-xl font-semibold tabular-nums text-slate-900 dark:text-[var(--text-primary)]",
                c.tone
              )}
            >
              {formatVnd(c.value)}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-4 dark:border-[var(--border-subtle)] dark:bg-[var(--surface-1)]">
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-slate-500">Tiến độ chi</span>
          <span className="font-semibold tabular-nums">{data.usedPct.toFixed(1)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-[var(--surface-3)]">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              data.usedPct >= 100
                ? "bg-rose-500"
                : data.usedPct >= 80
                  ? "bg-amber-500"
                  : "bg-violet-500"
            )}
            style={{ width: `${Math.min(100, data.usedPct)}%` }}
          />
        </div>
      </section>

      {data.rates.length > 0 && (
        <PublicSection title="Rate card nhân sự">
          <table className="sheet min-w-[560px]">
            <thead>
              <tr>
                <th className="w-10">STT</th>
                <th>Nhân sự</th>
                <th className="w-[80px] text-right">SL</th>
                <th className="w-[140px] text-right">Nửa ngày</th>
                <th className="w-[140px] text-right">Cả ngày</th>
              </tr>
            </thead>
            <tbody>
              {data.rates.map((r, i) => (
                <tr key={r.id}>
                  <td className="text-center text-[12px] text-slate-400">{i + 1}</td>
                  <td className="px-2 font-medium">{r.role}</td>
                  <td className="px-2 text-right tabular-nums">{r.qty}</td>
                  <td className="px-2 text-right tabular-nums">
                    {r.halfDay ? formatVnd(r.halfDay) : "—"}
                  </td>
                  <td className="px-2 text-right tabular-nums">
                    {r.fullDay ? formatVnd(r.fullDay) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </PublicSection>
      )}

      {data.events.length > 0 && (
        <PublicSection title="Booking sự kiện">
          <table className="sheet min-w-[860px]">
            <thead>
              <tr>
                <th className="w-10">STT</th>
                <th className="min-w-[190px]">Sự kiện</th>
                <th className="w-[120px]">Ngày giao</th>
                <th className="w-[120px]">Loại</th>
                <th className="w-[110px]">Thời gian</th>
                <th className="w-[130px] text-right">Quay chụp</th>
                <th className="w-[130px] text-right">Dựng</th>
                <th className="w-[130px] text-right">Tổng</th>
              </tr>
            </thead>
            <tbody>
              {data.events.map((e, i) => (
                <tr key={e.id}>
                  <td className="text-center text-[12px] text-slate-400">{i + 1}</td>
                  <td className="px-2">
                    <span className="font-medium">{e.name || "—"}</span>
                    {e.note && (
                      <span className="block text-[11px] text-slate-400">{e.note}</span>
                    )}
                  </td>
                  <td className="px-2 tabular-nums">{fmtDate(e.deliverDate)}</td>
                  <td className="px-2">
                    <Pill value={e.eventType} />
                  </td>
                  <td className="px-2">
                    <Pill value={e.duration} />
                  </td>
                  <td className="px-2 text-right tabular-nums">
                    {e.shootCost ? formatVnd(e.shootCost) : "—"}
                  </td>
                  <td className="px-2 text-right tabular-nums">
                    {e.editCost ? formatVnd(e.editCost) : "—"}
                  </td>
                  <td className="px-2 text-right font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
                    {e.total ? formatVnd(e.total) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={7} className="px-2">
                  Tổng ({data.events.length} sự kiện)
                </td>
                <td className="px-2 text-right tabular-nums text-emerald-700 dark:text-emerald-300">
                  {formatVnd(data.events.reduce((s, e) => s + e.total, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </PublicSection>
      )}

    </div>
  );
}

function PublicSection({
  title,
  amount,
  children,
}: {
  title: string;
  amount?: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-3">
        <h2 className="text-[15px] font-semibold text-slate-900 dark:text-[var(--text-primary)]">
          {title}
        </h2>
        {amount != null && (
          <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-[13px] font-semibold tabular-nums text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
            {formatVnd(amount)}
          </span>
        )}
      </div>
      <div className="sheet-wrap">{children}</div>
    </section>
  );
}
