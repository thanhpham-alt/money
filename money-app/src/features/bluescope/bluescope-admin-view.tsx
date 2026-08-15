"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarRange,
  ChevronDown,
  Copy,
  Eye,
  Layers,
  Plus,
  Tags,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { MoneyCell, TextCell } from "@/components/sheet/cell";
import { Button } from "@/components/ui/button";
import { cn, formatVnd } from "@/lib/utils";
import { JOB_STATUSES } from "@/lib/bluescope-const";
import { useBluescope, type RateRow } from "@/features/bluescope/use-bluescope";
import { EventsSheet } from "@/features/bluescope/events-sheet";
import { RatesSheet } from "@/features/bluescope/rates-sheet";
import { PackagesSheet } from "@/features/bluescope/packages-sheet";

const TABS = [
  { key: "booking", label: "Booking", icon: CalendarRange },
  { key: "rates", label: "Rate card", icon: Tags },
  { key: "packages", label: "Gói báo giá", icon: Layers },
] as const;

const BLUESCOPE_PUBLIC_ORIGIN =
  process.env.NEXT_PUBLIC_BLUESCOPE_PUBLIC_ORIGIN || "https://bluescope.thanhpham.fun";

type TabKey = (typeof TABS)[number]["key"];

export function BluescopeAdminView() {
  const bs = useBluescope();
  const [tab, setTab] = useState<TabKey>("booking");

  if (bs.loading || !bs.data) {
    return (
      <div className="page">
        <p className="page-sub">Đang tải Bluescope…</p>
      </div>
    );
  }

  const { job, budget, rates, events, packages } = bs.data;

  function copyPublicLink() {
    void navigator.clipboard.writeText(BLUESCOPE_PUBLIC_ORIGIN);
    toast.success("Đã copy link public cho khách");
  }

  const counts: Record<TabKey, number> = {
    booking: events.length,
    rates: rates.length,
    packages: packages.length,
  };

  return (
    <div className="page space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="page-title">Bluescope</h1>
          <p className="page-sub">
            Nhập trực tiếp trong app — booking · rate card · gói báo giá
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="h-9 rounded-md border border-stone-200 bg-white px-2.5 text-[13px] dark:border-[var(--border-default)] dark:bg-[var(--surface-2)]"
            value={job.status}
            onChange={(e) => bs.patchJob({ status: e.target.value })}
          >
            {JOB_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <label className="flex cursor-pointer items-center gap-1.5 rounded-md border border-stone-200 bg-white px-2.5 py-2 text-[13px] dark:border-[var(--border-default)] dark:bg-[var(--surface-2)]">
            <input
              type="checkbox"
              checked={job.publicVisible}
              onChange={(e) => bs.patchJob({ publicVisible: e.target.checked })}
            />
            Public
          </label>
          <Button type="button" variant="outline" size="sm" onClick={copyPublicLink}>
            <Copy className="h-4 w-4" />
            Copy link
          </Button>
          <Link href={BLUESCOPE_PUBLIC_ORIGIN} target="_blank">
            <Button type="button" variant="secondary" size="sm">
              <Eye className="h-4 w-4" />
              Xem như khách
            </Button>
          </Link>
        </div>
      </div>

      {/* Ngân sách — chỉ NGÂN SÁCH và ĐÃ NHẬN nhập tay, còn lại tự tính */}
      <section className="rounded-xl border border-stone-200 bg-white p-4 dark:border-[var(--border-subtle)] dark:bg-[var(--surface-1)]">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <BudgetField
            label="Ngân sách"
            hint="nhập tay"
            value={budget.budget}
            onCommit={(v) => bs.patchJob({ contractTotal: v ?? 0 })}
          />
          <BudgetField
            label="Đã nhận"
            hint="nhập tay"
            value={budget.received}
            onCommit={(v) => bs.patchJob({ collected: v ?? 0 })}
          />
          <ReadOnlyField
            label="Đã xài"
            hint={`${events.length} booking`}
            value={budget.spent}
            tone="warn"
          />
          <ReadOnlyField
            label="Còn lại ngân sách"
            hint="ngân sách − đã xài"
            value={budget.remainingBudget}
            tone={budget.remainingBudget >= 0 ? "success" : "danger"}
          />
          <ReadOnlyField
            label="Chi hộ"
            hint="ngoài ngân sách"
            value={budget.paidByUs}
          />
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-[12px]">
            <span className="text-slate-500">Tiến độ chi ngân sách</span>
            <span className="font-semibold tabular-nums">
              {budget.usedPct.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-[var(--surface-3)]">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                budget.usedPct >= 100
                  ? "bg-rose-500"
                  : budget.usedPct >= 80
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              )}
              style={{ width: `${Math.min(100, budget.usedPct)}%` }}
            />
          </div>
        </div>
      </section>

      {/* Rate card ngay đầu trang — vừa nhập booking vừa xem/sửa giá */}
      <RateStrip
        rows={rates}
        onPatch={(id, patch) => bs.patchRow("rate", id, patch)}
        onAdd={(fields) => bs.addRow("rate", fields)}
        onDelete={(id) => bs.deleteRow("rate", id)}
      />

      {/* Tabs */}
      <div className="tabs">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            data-active={tab === key}
            className="tab"
          >
            <Icon className="h-4 w-4" />
            {label}
            <span className="tab-count">{counts[key]}</span>
          </button>
        ))}
      </div>

      {tab === "booking" && (
        <EventsSheet
          rows={events}
          onPatch={(id, patch) => bs.patchRow("event", id, patch)}
          onAdd={(fields) => bs.addRow("event", fields)}
          onDelete={(id) => bs.deleteRow("event", id)}
          onReorder={(order) => bs.reorder("event", order)}
        />
      )}

      {tab === "rates" && (
        <RatesSheet
          rows={rates}
          onPatch={(id, patch) => bs.patchRow("rate", id, patch)}
          onAdd={(fields) => bs.addRow("rate", fields)}
          onDelete={(id) => bs.deleteRow("rate", id)}
          onReorder={(order) => bs.reorder("rate", order)}
        />
      )}

      {tab === "packages" && (
        <PackagesSheet
          packages={packages}
          onPatchPackage={(id, patch) => bs.patchRow("package", id, patch)}
          onPatchItem={(id, patch) => bs.patchRow("packageItem", id, patch)}
          onAddPackage={(fields) => bs.addRow("package", fields)}
          onAddItem={(fields) => bs.addRow("packageItem", fields)}
          onDeletePackage={(id) => bs.deleteRow("package", id)}
          onDeleteItem={(id) => bs.deleteRow("packageItem", id)}
        />
      )}

    </div>
  );
}

/**
 * Rate card dạng dải ngang, sửa tại chỗ — luôn thấy khi nhập booking.
 * Cùng nguồn dữ liệu với tab "Rate card" (table rate), sửa bên nào cũng như nhau.
 */
function RateStrip({
  rows,
  onPatch,
  onAdd,
  onDelete,
}: {
  rows: RateRow[];
  onPatch: (id: string, patch: Record<string, unknown>) => void;
  onAdd: (fields: Record<string, unknown>) => Promise<boolean> | void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const [draft, setDraft] = useState("");

  async function submit() {
    if (!draft.trim()) return;
    const ok = await onAdd({ role: draft.trim(), qty: 1 });
    if (ok !== false) setDraft("");
  }

  return (
    <section className="card overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span
          className="tile-icon h-8 w-8"
          style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
        >
          <Tags className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-bold text-[var(--ink)]">
            Rate card nhân sự
          </span>
          <span className="block text-[12px] text-[var(--ink-3)]">
            {rows.length} hạng mục — sửa trực tiếp, dùng khi điền booking
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-[var(--ink-3)] transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="border-t border-[var(--line)] p-3">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((r) => (
              <div key={r.id} className="rounded-xl bg-[#fafaff] p-2">
                {/* Tên riêng 1 dòng để không bị cắt chữ */}
                <div className="flex items-center gap-1">
                  <TextCell
                    value={r.role}
                    placeholder="Tên nhân sự"
                    className="flex-1 font-semibold"
                    onCommit={(v) => onPatch(r.id, { role: v ?? "" })}
                  />
                  <button
                    type="button"
                    aria-label={`Xoá ${r.role || "rate"}`}
                    className="row-del shrink-0"
                    onClick={() => {
                      if (confirm(`Xoá rate "${r.role || "dòng này"}"?`)) onDelete(r.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="w-[62px] shrink-0 text-right text-[10.5px] font-bold uppercase text-[var(--ink-3)]">
                    nửa ngày
                  </span>
                  <MoneyCell
                    value={r.halfDay}
                    addStyle
                    className="flex-1"
                    onCommit={(v) => onPatch(r.id, { halfDay: v ?? 0 })}
                  />
                  <span className="w-[52px] shrink-0 text-right text-[10.5px] font-bold uppercase text-[var(--ink-3)]">
                    cả ngày
                  </span>
                  <MoneyCell
                    value={r.fullDay}
                    addStyle
                    className="flex-1"
                    onCommit={(v) => onPatch(r.id, { fullDay: v ?? 0 })}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-2 flex items-center gap-2">
            <input
              className="cell cell-add max-w-xs"
              placeholder="Thêm nhân sự… (Enter)"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={submit}
              disabled={!draft.trim()}
            >
              <Plus className="h-3.5 w-3.5" />
              Thêm
            </Button>
            <span className="ml-auto text-[11.5px] text-[var(--ink-3)]">
              Sửa ở đây hay ở tab Rate card đều được — cùng 1 nguồn số
            </span>
          </div>
        </div>
      )}
    </section>
  );
}

function BudgetField({
  label,
  hint,
  value,
  onCommit,
}: {
  label: string;
  hint: string;
  value: number;
  onCommit: (v: number | null) => void;
}) {
  return (
    <div>
      <p className="mb-1 text-[12px] font-medium text-slate-500">
        {label}
        <span className="ml-1.5 rounded bg-amber-100 px-1.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
          {hint}
        </span>
      </p>
      <MoneyCell
        value={value}
        addStyle
        className="h-10 text-[16px] font-semibold"
        onCommit={onCommit}
      />
    </div>
  );
}

function ReadOnlyField({
  label,
  hint,
  value,
  tone,
}: {
  label: string;
  hint: string;
  value: number;
  tone?: "success" | "warn" | "danger";
}) {
  return (
    <div>
      <p className="mb-1 text-[12px] font-medium text-slate-500">
        {label}
        <span className="ml-1.5 text-[10px] text-slate-400">{hint}</span>
      </p>
      <p
        className={cn(
          "flex h-10 items-center px-2 text-[16px] font-semibold tabular-nums",
          tone === "success" && "text-emerald-600 dark:text-emerald-400",
          tone === "warn" && "text-amber-600 dark:text-amber-400",
          tone === "danger" && "text-rose-600 dark:text-rose-400",
          !tone && "text-slate-800 dark:text-[var(--text-primary)]"
        )}
      >
        {formatVnd(value)}
      </p>
    </div>
  );
}
