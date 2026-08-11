"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { MoneyCell, NumCell, TextCell } from "@/components/sheet/cell";
import { Button } from "@/components/ui/button";
import { formatVnd } from "@/lib/utils";
import type { PackageRow } from "@/features/bluescope/use-bluescope";

type Props = {
  packages: PackageRow[];
  onPatchPackage: (id: string, patch: Record<string, unknown>) => void;
  onPatchItem: (id: string, patch: Record<string, unknown>) => void;
  onAddPackage: (fields: Record<string, unknown>) => Promise<boolean> | void;
  onAddItem: (fields: Record<string, unknown>) => Promise<boolean> | void;
  onDeletePackage: (id: string) => void;
  onDeleteItem: (id: string) => void;
};

export function PackagesSheet({
  packages,
  onPatchPackage,
  onPatchItem,
  onAddPackage,
  onAddItem,
  onDeletePackage,
  onDeleteItem,
}: Props) {
  const [newPkg, setNewPkg] = useState("");
  const grandTotal = packages.reduce((s, p) => s + p.total, 0);

  async function submitPkg() {
    if (!newPkg.trim()) return;
    const ok = await onAddPackage({ name: newPkg.trim() });
    if (ok !== false) setNewPkg("");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          className="cell cell-add h-9 max-w-xs"
          placeholder="Tên gói mới (VD: WEBSITE)… Enter"
          value={newPkg}
          onChange={(e) => setNewPkg(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitPkg()}
        />
        <Button type="button" size="sm" onClick={submitPkg} disabled={!newPkg.trim()}>
          <Plus className="h-3.5 w-3.5" />
          Thêm gói
        </Button>
        <span className="ml-auto text-sm text-slate-500">
          Tổng tất cả gói:{" "}
          <strong className="tabular-nums text-slate-800 dark:text-[var(--text-primary)]">
            {formatVnd(grandTotal)}
          </strong>
        </span>
      </div>

      {packages.map((p) => (
        <PackageCard
          key={p.id}
          pkg={p}
          onPatchPackage={onPatchPackage}
          onPatchItem={onPatchItem}
          onAddItem={onAddItem}
          onDeletePackage={onDeletePackage}
          onDeleteItem={onDeleteItem}
        />
      ))}

      {packages.length === 0 && (
        <p className="rounded-xl border border-dashed border-stone-200 py-10 text-center text-sm text-slate-400 dark:border-[var(--border-subtle)]">
          Chưa có gói báo giá nào
        </p>
      )}
    </div>
  );
}

function PackageCard({
  pkg,
  onPatchPackage,
  onPatchItem,
  onAddItem,
  onDeletePackage,
  onDeleteItem,
}: {
  pkg: PackageRow;
  onPatchPackage: Props["onPatchPackage"];
  onPatchItem: Props["onPatchItem"];
  onAddItem: Props["onAddItem"];
  onDeletePackage: Props["onDeletePackage"];
  onDeleteItem: Props["onDeleteItem"];
}) {
  const [itemName, setItemName] = useState("");

  async function submitItem() {
    if (!itemName.trim()) return;
    const ok = await onAddItem({ packageId: pkg.id, name: itemName.trim(), qty: 1 });
    if (ok !== false) setItemName("");
  }

  return (
    <div className="sheet-wrap">
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-100 px-3 py-2.5 dark:border-[var(--border-subtle)]">
        <input
          className="cell h-8 max-w-[260px] text-[13px] font-bold uppercase tracking-wide"
          defaultValue={pkg.name}
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v && v !== pkg.name) onPatchPackage(pkg.id, { name: v });
          }}
        />
        <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-[13px] font-semibold tabular-nums text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
          {formatVnd(pkg.total)}
        </span>
        <button
          type="button"
          aria-label={`Xóa gói ${pkg.name}`}
          className="ml-auto rounded p-1.5 text-stone-300 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
          onClick={() => {
            if (confirm(`Xóa gói "${pkg.name}" và toàn bộ hạng mục?`))
              onDeletePackage(pkg.id);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <table className="sheet min-w-[760px]">
        <thead>
          <tr>
            <th className="w-10">STT</th>
            <th className="min-w-[240px]">Hạng mục</th>
            <th className="w-[150px]">Đơn vị tính</th>
            <th className="w-[80px] text-right">Số lượng</th>
            <th className="w-[150px] text-right">Đơn giá</th>
            <th className="w-[150px] text-right">Thành tiền</th>
            <th className="w-9" />
          </tr>
        </thead>
        <tbody>
          <tr className="bg-orange-50/50 dark:bg-[var(--surface-2)]/60">
            <td className="text-center">
              <Plus className="mx-auto h-3.5 w-3.5 text-orange-500" />
            </td>
            <td>
              <input
                className="cell cell-add"
                placeholder="Thêm hạng mục… (Enter)"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitItem()}
              />
            </td>
            <td colSpan={4} className="text-right">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={submitItem}
                disabled={!itemName.trim()}
              >
                <Plus className="h-3.5 w-3.5" />
                Thêm
              </Button>
            </td>
            <td />
          </tr>

          {pkg.items.map((it, i) => (
            <tr key={it.id}>
              <td className="text-center text-[12px] text-slate-400">{i + 1}</td>
              <td>
                <TextCell
                  value={it.name}
                  placeholder="Hạng mục"
                  className="font-medium"
                  onCommit={(v) => onPatchItem(it.id, { name: v ?? "" })}
                />
              </td>
              <td>
                <TextCell
                  value={it.unit}
                  placeholder="Đơn vị"
                  onCommit={(v) => onPatchItem(it.id, { unit: v })}
                />
              </td>
              <td>
                <NumCell value={it.qty} onCommit={(v) => onPatchItem(it.id, { qty: v })} />
              </td>
              <td>
                <MoneyCell
                  value={it.unitPrice}
                  onCommit={(v) => onPatchItem(it.id, { unitPrice: v ?? 0 })}
                />
              </td>
              {/* Thành tiền = SL × đơn giá → chỉ đọc */}
              <td className="text-right font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
                {it.total ? formatVnd(it.total) : "—"}
              </td>
              <td>
                <button
                  type="button"
                  aria-label={`Xóa ${it.name || "hạng mục"}`}
                  className="rounded p-1.5 text-stone-300 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                  onClick={() => onDeleteItem(it.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </td>
            </tr>
          ))}

          {pkg.items.length === 0 && (
            <tr>
              <td colSpan={7} className="py-6 text-center text-slate-400">
                Chưa có hạng mục
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={5}>Tổng cộng — {pkg.name}</td>
            <td className="text-right tabular-nums text-emerald-700 dark:text-emerald-300">
              {formatVnd(pkg.total)}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
