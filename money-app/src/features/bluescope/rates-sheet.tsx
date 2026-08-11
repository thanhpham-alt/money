"use client";

import { useState } from "react";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { MoneyCell, NumCell, TextCell } from "@/components/sheet/cell";
import { Button } from "@/components/ui/button";
import { cn, formatVnd } from "@/lib/utils";
import { useRowDrag, type RateRow } from "@/features/bluescope/use-bluescope";

type Props = {
  rows: RateRow[];
  onPatch: (id: string, patch: Record<string, unknown>) => void;
  onAdd: (fields: Record<string, unknown>) => Promise<boolean> | void;
  onDelete: (id: string) => void;
  onReorder: (order: string[]) => void;
};

export function RatesSheet({ rows, onPatch, onAdd, onDelete, onReorder }: Props) {
  const [role, setRole] = useState("");
  const drag = useRowDrag(
    rows.map((r) => r.id),
    onReorder
  );

  async function submit() {
    if (!role.trim()) return;
    const ok = await onAdd({ role: role.trim(), qty: 1 });
    if (ok !== false) setRole("");
  }

  return (
    <div className="sheet-wrap">
      <table className="sheet min-w-[720px]">
        <thead>
          <tr>
            <th className="w-8" />
            <th className="w-10">STT</th>
            <th className="min-w-[230px]">Nhân sự</th>
            <th className="w-[80px] text-right">Số lượng</th>
            <th className="w-[150px] text-right">Nửa ngày</th>
            <th className="w-[150px] text-right">Cả ngày</th>
            <th className="min-w-[160px]">Ghi chú</th>
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
                placeholder="Thêm nhân sự / hạng mục… (Enter)"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
            </td>
            <td colSpan={4} className="text-right">
              <Button type="button" size="sm" onClick={submit} disabled={!role.trim()}>
                <Plus className="h-3.5 w-3.5" />
                Thêm rate
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
                  value={r.role}
                  placeholder="Tên nhân sự"
                  className="font-medium"
                  onCommit={(v) => onPatch(r.id, { role: v ?? "" })}
                />
              </td>
              <td>
                <NumCell value={r.qty} onCommit={(v) => onPatch(r.id, { qty: v })} />
              </td>
              <td>
                <MoneyCell
                  value={r.halfDay}
                  onCommit={(v) => onPatch(r.id, { halfDay: v ?? 0 })}
                />
              </td>
              <td>
                <MoneyCell
                  value={r.fullDay}
                  onCommit={(v) => onPatch(r.id, { fullDay: v ?? 0 })}
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
                  aria-label={`Xóa ${r.role || "dòng"}`}
                  className="rounded p-1.5 text-stone-300 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                  onClick={() => {
                    if (confirm(`Xóa rate "${r.role || "dòng này"}"?`)) onDelete(r.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </td>
            </tr>
          ))}

          {rows.length === 0 && (
            <tr>
              <td colSpan={8} className="py-10 text-center text-slate-400">
                Chưa có rate — gõ tên nhân sự ở dòng trên
              </td>
            </tr>
          )}
        </tbody>

        <tfoot>
          <tr>
            <td colSpan={4}>Rate cao nhất</td>
            <td className="text-right tabular-nums">
              {formatVnd(Math.max(0, ...rows.map((r) => r.halfDay)))}
            </td>
            <td className="text-right tabular-nums">
              {formatVnd(Math.max(0, ...rows.map((r) => r.fullDay)))}
            </td>
            <td colSpan={2} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
