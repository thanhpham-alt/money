"use client";

import { useState } from "react";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { DateCell, MoneyCell, NumCell, TextCell } from "@/components/sheet/cell";
import { PillSelect } from "@/components/sheet/pill";
import { Button } from "@/components/ui/button";
import { cn, formatVnd } from "@/lib/utils";
import { DURATIONS, EVENT_TYPES } from "@/lib/bluescope-const";
import { useRowDrag, type EventRow } from "@/features/bluescope/use-bluescope";

type Props = {
  rows: EventRow[];
  onPatch: (id: string, patch: Record<string, unknown>) => void;
  onAdd: (fields: Record<string, unknown>) => Promise<boolean> | void;
  onDelete: (id: string) => void;
  onReorder: (order: string[]) => void;
};

const EMPTY_DRAFT = { name: "", briefBy: "", eventType: "", duration: "" };

export function EventsSheet({ rows, onPatch, onAdd, onDelete, onReorder }: Props) {
  const [draft, setDraft] = useState({ ...EMPTY_DRAFT });
  const drag = useRowDrag(
    rows.map((r) => r.id),
    onReorder
  );

  const totals = rows.reduce(
    (a, r) => ({
      shoot: a.shoot + r.shootCost,
      edit: a.edit + r.editCost,
      discount: a.discount + r.discount,
      total: a.total + r.total,
      paidByUs: a.paidByUs + r.paidByUs,
    }),
    { shoot: 0, edit: 0, discount: 0, total: 0, paidByUs: 0 }
  );

  async function submitDraft() {
    if (!draft.name.trim()) return;
    const ok = await onAdd({
      name: draft.name.trim(),
      briefBy: draft.briefBy.trim() || null,
      eventType: draft.eventType || null,
      duration: draft.duration || null,
    });
    if (ok !== false) setDraft({ ...EMPTY_DRAFT });
  }

  return (
    <div className="sheet-wrap">
      <table className="sheet min-w-[1420px]">
        <thead>
          <tr>
            <th className="w-8" />
            <th className="w-10">STT</th>
            <th className="min-w-[190px]">Tên sự kiện</th>
            <th className="w-[110px]">Người brief</th>
            <th className="w-[140px]">Ngày giao</th>
            <th className="w-[130px]">Loại event</th>
            <th className="w-[120px]">Thời gian</th>
            <th className="w-[64px] text-right">Thợ chụp</th>
            <th className="w-[64px] text-right">Thợ quay</th>
            <th className="w-[70px] text-right">Recap/Clip</th>
            <th className="w-[130px] text-right">CP quay chụp</th>
            <th className="w-[130px] text-right">CP dựng</th>
            <th className="w-[120px] text-right">Chiết khấu</th>
            <th className="w-[130px] text-right">Tổng</th>
            <th className="w-[120px] text-right">Chi hộ</th>
            <th className="min-w-[150px]">Ghi chú</th>
            <th className="w-9" />
          </tr>
        </thead>

        <tbody>
          {/* Quick add — gõ tên rồi Enter là xong */}
          <tr className="bg-orange-50/50 dark:bg-[var(--surface-2)]/60">
            <td />
            <td className="text-center">
              <Plus className="mx-auto h-3.5 w-3.5 text-orange-500" />
            </td>
            <td>
              <input
                className="cell cell-add"
                placeholder="Thêm sự kiện… (Enter)"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && submitDraft()}
              />
            </td>
            <td>
              <input
                className="cell cell-add"
                placeholder="Ai brief"
                value={draft.briefBy}
                onChange={(e) => setDraft({ ...draft, briefBy: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && submitDraft()}
              />
            </td>
            <td />
            <td>
              <select
                className="cell cell-add"
                value={draft.eventType}
                onChange={(e) => setDraft({ ...draft, eventType: e.target.value })}
              >
                <option value="">Loại…</option>
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </td>
            <td>
              <select
                className="cell cell-add"
                value={draft.duration}
                onChange={(e) => setDraft({ ...draft, duration: e.target.value })}
              >
                <option value="">Thời gian…</option>
                {DURATIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </td>
            <td colSpan={9} className="text-right">
              <Button type="button" size="sm" onClick={submitDraft} disabled={!draft.name.trim()}>
                <Plus className="h-3.5 w-3.5" />
                Thêm dòng
              </Button>
            </td>
            <td />
          </tr>

          {rows.map((r, i) => (
            <tr
              key={r.id}
              {...drag.rowProps(r.id)}
              className={cn(
                drag.overId === r.id && "outline-2 -outline-offset-2 outline-orange-400"
              )}
            >
              <td className="text-center">
                <GripVertical className="sheet-row-drag mx-auto h-4 w-4" />
              </td>
              <td className="text-center text-[12px] text-slate-400">{i + 1}</td>
              <td>
                <TextCell
                  value={r.name}
                  placeholder="Tên sự kiện"
                  className="font-medium"
                  onCommit={(v) => onPatch(r.id, { name: v ?? "" })}
                />
              </td>
              <td>
                <TextCell
                  value={r.briefBy}
                  placeholder="—"
                  onCommit={(v) => onPatch(r.id, { briefBy: v })}
                />
              </td>
              <td>
                <DateCell
                  value={r.deliverDate}
                  onCommit={(v) => onPatch(r.id, { deliverDate: v })}
                />
              </td>
              <td>
                <PillSelect
                  value={r.eventType}
                  options={EVENT_TYPES}
                  placeholder="Loại"
                  onChange={(v) => onPatch(r.id, { eventType: v })}
                />
              </td>
              <td>
                <PillSelect
                  value={r.duration}
                  options={DURATIONS}
                  placeholder="Thời gian"
                  onChange={(v) => onPatch(r.id, { duration: v })}
                />
              </td>
              <td>
                <NumCell
                  value={r.photographers}
                  onCommit={(v) => onPatch(r.id, { photographers: v })}
                />
              </td>
              <td>
                <NumCell
                  value={r.videographers}
                  onCommit={(v) => onPatch(r.id, { videographers: v })}
                />
              </td>
              <td>
                <NumCell
                  value={r.recapClips}
                  onCommit={(v) => onPatch(r.id, { recapClips: v })}
                />
              </td>
              <td>
                <MoneyCell
                  value={r.shootCost}
                  onCommit={(v) => onPatch(r.id, { shootCost: v ?? 0 })}
                />
              </td>
              <td>
                <MoneyCell
                  value={r.editCost}
                  onCommit={(v) => onPatch(r.id, { editCost: v ?? 0 })}
                />
              </td>
              <td>
                <MoneyCell
                  value={r.discount}
                  onCommit={(v) => onPatch(r.id, { discount: v ?? 0 })}
                />
              </td>
              {/* TỔNG = quay chụp + dựng − chiết khấu → chỉ đọc */}
              <td className="text-right font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
                {r.total ? formatVnd(r.total) : "—"}
              </td>
              <td>
                <MoneyCell
                  value={r.paidByUs}
                  onCommit={(v) => onPatch(r.id, { paidByUs: v ?? 0 })}
                />
              </td>
              <td>
                <TextCell
                  value={r.note}
                  placeholder="—"
                  onCommit={(v) => onPatch(r.id, { note: v })}
                />
              </td>
              <td>
                <button
                  type="button"
                  aria-label={`Xóa ${r.name || "dòng"}`}
                  className="rounded p-1.5 text-stone-300 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                  onClick={() => {
                    if (confirm(`Xóa "${r.name || "dòng này"}"?`)) onDelete(r.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </td>
            </tr>
          ))}

          {rows.length === 0 && (
            <tr>
              <td colSpan={17} className="py-10 text-center text-slate-400">
                Chưa có booking — gõ tên sự kiện ở dòng trên
              </td>
            </tr>
          )}
        </tbody>

        <tfoot>
          <tr>
            <td colSpan={10}>Tổng ({rows.length} sự kiện)</td>
            <td className="text-right tabular-nums">{formatVnd(totals.shoot)}</td>
            <td className="text-right tabular-nums">{formatVnd(totals.edit)}</td>
            <td className="text-right tabular-nums text-rose-600">
              {totals.discount ? `−${formatVnd(totals.discount)}` : "—"}
            </td>
            <td className="text-right tabular-nums text-emerald-700 dark:text-emerald-300">
              {formatVnd(totals.total)}
            </td>
            <td className="text-right tabular-nums">{formatVnd(totals.paidByUs)}</td>
            <td colSpan={2} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
