"use client";

import { useEffect, useState } from "react";
import { Pill } from "@/components/sheet/pill";
import { formatVnd } from "@/lib/utils";

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

  const totalBooking = data.events.reduce((s, e) => s + e.total, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-8">
      <header>
        <p className="text-sm font-semibold text-violet-600">{data.agency}</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-[var(--text-primary)]">
          Bảng booking Bluescope
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {data.events.length} sự kiện
          {data.updatedAt && (
            <> · Cập nhật {new Date(data.updatedAt).toLocaleString("vi-VN")}</>
          )}
        </p>
      </header>

      {data.events.length > 0 && (
        <PublicSection title="Booking sự kiện" amount={totalBooking}>
          <table className="sheet min-w-[860px]">
            <thead>
              <tr>
                <th className="w-10">STT</th>
                <th className="min-w-[190px]">Sự kiện</th>
                <th className="w-[120px]">Ngày giao</th>
                <th className="w-[120px]">Loại</th>
                <th className="w-[110px]">Thời gian</th>
                <th className="w-[80px] text-right">Chụp</th>
                <th className="w-[80px] text-right">Quay</th>
                <th className="w-[80px] text-right">Recap</th>
                <th className="w-[120px] text-right">CP dựng</th>
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
                    {e.photographers || "—"}
                  </td>
                  <td className="px-2 text-right tabular-nums">
                    {e.videographers || "—"}
                  </td>
                  <td className="px-2 text-right tabular-nums">
                    {e.recapClips || "—"}
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
                <td colSpan={9} className="px-2">
                  Tổng ({data.events.length} sự kiện)
                </td>
                <td className="px-2 text-right tabular-nums text-emerald-700 dark:text-emerald-300">
                  {formatVnd(totalBooking)}
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
