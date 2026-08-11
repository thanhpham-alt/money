"use client";

import { useState } from "react";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { DateCell, MoneyCell, TextCell } from "@/components/sheet/cell";
import { PillSelect } from "@/components/sheet/pill";
import { Button } from "@/components/ui/button";
import { cn, formatVnd } from "@/lib/utils";
import { CHANNELS, CHANNEL_LABELS, CONTENT_TYPES } from "@/lib/bluescope-const";
import { useRowDrag, type ContentRow } from "@/features/bluescope/use-bluescope";

type Props = {
  rows: ContentRow[];
  onPatch: (id: string, patch: Record<string, unknown>) => void;
  onAdd: (fields: Record<string, unknown>) => Promise<boolean> | void;
  onDelete: (id: string) => void;
  onReorder: (order: string[]) => void;
};

export function ContentsSheet({ rows, onPatch, onAdd, onDelete, onReorder }: Props) {
  const grand = rows.reduce(
    (a, r) => ({
      original: a.original + (r.originalCost ?? 0),
      final: a.final + (r.finalCost ?? 0),
    }),
    { original: 0, final: 0 }
  );

  return (
    <div className="space-y-4">
      {CHANNELS.map((ch) => (
        <ChannelTable
          key={ch}
          channel={ch}
          rows={rows.filter((r) => r.channel === ch)}
          onPatch={onPatch}
          onAdd={onAdd}
          onDelete={onDelete}
          onReorder={onReorder}
        />
      ))}

      <div className="flex flex-wrap justify-end gap-6 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm dark:border-[var(--border-subtle)] dark:bg-[var(--surface-2)]">
        <span className="text-slate-500">
          Tổng Original:{" "}
          <strong className="tabular-nums text-slate-800 dark:text-[var(--text-primary)]">
            {formatVnd(grand.original)}
          </strong>
        </span>
        <span className="text-slate-500">
          Tổng Final:{" "}
          <strong className="tabular-nums text-emerald-700 dark:text-emerald-300">
            {formatVnd(grand.final)}
          </strong>
        </span>
      </div>
    </div>
  );
}

function ChannelTable({
  channel,
  rows,
  onPatch,
  onAdd,
  onDelete,
  onReorder,
}: Props & { channel: string }) {
  const [name, setName] = useState("");
  const drag = useRowDrag(
    rows.map((r) => r.id),
    onReorder
  );

  const totals = rows.reduce(
    (a, r) => ({
      original: a.original + (r.originalCost ?? 0),
      final: a.final + (r.finalCost ?? 0),
    }),
    { original: 0, final: 0 }
  );

  async function submit() {
    if (!name.trim()) return;
    const ok = await onAdd({ channel, name: name.trim() });
    if (ok !== false) setName("");
  }

  return (
    <div className="sheet-wrap">
      <div className="flex items-center gap-2 border-b border-stone-100 px-3 py-2.5 dark:border-[var(--border-subtle)]">
        <span className="text-[13px] font-bold uppercase tracking-wide text-slate-600 dark:text-[var(--text-secondary)]">
          {CHANNEL_LABELS[channel] ?? channel}
        </span>
        <span className="rounded bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-[var(--surface-3)] dark:text-[var(--text-muted)]">
          {rows.length} nội dung
        </span>
        <span className="ml-auto text-[13px] font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
          {formatVnd(totals.final)}
        </span>
      </div>

      <table className="sheet min-w-[900px]">
        <thead>
          <tr>
            <th className="w-8" />
            <th className="w-10">STT</th>
            <th className="min-w-[260px]">Nội dung</th>
            <th className="w-[140px]">Loại</th>
            <th className="w-[140px]">Ngày</th>
            <th className="w-[140px] text-right">Original Cost</th>
            <th className="w-[140px] text-right">Final Cost</th>
            <th className="min-w-[130px]">Scope</th>
            <th className="w-9" />
          </tr>
        </thead>

        <tbody>
          <tr className="bg-orange-50/50 dark:bg-[var(--surface-2)]/60">
            <td />
            <td className="text-center">
              <Plus className="mx-auto h-3.5 w-3.5 text-orange-500" />
            </td>
            <td>
              <input
                className="cell cell-add"
                placeholder="Thêm nội dung… (Enter)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
            </td>
            <td colSpan={5} className="text-right">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={submit}
                disabled={!name.trim()}
              >
                <Plus className="h-3.5 w-3.5" />
                Thêm
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
                  placeholder="Tên nội dung"
                  className="font-medium"
                  onCommit={(v) => onPatch(r.id, { name: v ?? "" })}
                />
              </td>
              <td>
                <PillSelect
                  value={r.contentType}
                  options={CONTENT_TYPES}
                  placeholder="Loại"
                  onChange={(v) => onPatch(r.id, { contentType: v })}
                />
              </td>
              <td>
                <DateCell
                  value={r.publishDate}
                  onCommit={(v) => onPatch(r.id, { publishDate: v })}
                />
              </td>
              {/* allowNull: để trống = "—" giống sheet gốc, không phải 0 */}
              <td>
                <MoneyCell
                  value={r.originalCost}
                  allowNull
                  placeholder="—"
                  onCommit={(v) => onPatch(r.id, { originalCost: v })}
                />
              </td>
              <td>
                <MoneyCell
                  value={r.finalCost}
                  allowNull
                  placeholder="—"
                  className="text-emerald-700 dark:text-emerald-300"
                  onCommit={(v) => onPatch(r.id, { finalCost: v })}
                />
              </td>
              <td>
                <TextCell
                  value={r.scope}
                  placeholder="—"
                  onCommit={(v) => onPatch(r.id, { scope: v })}
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
              <td colSpan={9} className="py-8 text-center text-slate-400">
                Chưa có nội dung
              </td>
            </tr>
          )}
        </tbody>

        <tfoot>
          <tr>
            <td colSpan={5}>Tổng</td>
            <td className="text-right tabular-nums">{formatVnd(totals.original)}</td>
            <td className="text-right tabular-nums text-emerald-700 dark:text-emerald-300">
              {formatVnd(totals.final)}
            </td>
            <td colSpan={2} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
