"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatVnd, parseMoneyInput } from "@/lib/utils";

type Settings = {
  cashOnHand: number;
  invoiceFeeRate: number;
  aTanShareRate: number;
};

/** Cài đặt = modal nhỏ từ icon bánh răng, không chiếm 1 tab. */
export function SettingsModal({ onClose }: { onClose: () => void }) {
  const [s, setS] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setS);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function save() {
    if (!s) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s),
      });
      if (!res.ok) throw new Error();
      toast.success("Đã lưu cài đặt");
      onClose();
    } catch {
      toast.error("Lưu thất bại");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-auto bg-[#131829]/45 p-4 backdrop-blur-sm sm:p-10"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[420px] rounded-[18px] bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center gap-3 border-b border-[var(--line)] px-5 py-4">
          <p className="flex-1 text-[15px] font-bold text-[var(--ink)]">Cài đặt</p>
          <button type="button" aria-label="Đóng" className="row-del" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </header>

        {!s ? (
          <p className="p-8 text-center text-[13px] text-[var(--ink-3)]">Đang tải…</p>
        ) : (
          <div className="space-y-4 p-5">
            <label className="block">
              <span className="mb-1.5 block text-[12.5px] font-semibold text-[var(--ink-2)]">
                Tiền hiện có
              </span>
              <input
                inputMode="numeric"
                className="field field-money"
                value={s.cashOnHand ? s.cashOnHand.toLocaleString("vi-VN") : ""}
                placeholder="0"
                onChange={(e) =>
                  setS({ ...s, cashOnHand: parseMoneyInput(e.target.value) })
                }
              />
              <span className="mt-1 block text-[11.5px] text-[var(--ink-3)]">
                {formatVnd(s.cashOnHand)}
              </span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-semibold text-[var(--ink-2)]">
                  Phí xuất HĐ (%)
                </span>
                <input
                  type="number"
                  step="0.5"
                  className="field field-money"
                  value={(s.invoiceFeeRate * 100).toString()}
                  onChange={(e) =>
                    setS({ ...s, invoiceFeeRate: (Number(e.target.value) || 0) / 100 })
                  }
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-semibold text-[var(--ink-2)]">
                  A Tân (% LN)
                </span>
                <input
                  type="number"
                  step="1"
                  className="field field-money"
                  value={(s.aTanShareRate * 100).toString()}
                  onChange={(e) =>
                    setS({ ...s, aTanShareRate: (Number(e.target.value) || 0) / 100 })
                  }
                />
              </label>
            </div>
          </div>
        )}

        <footer className="flex justify-end gap-2 border-t border-[var(--line)] px-5 py-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button type="button" onClick={save} disabled={saving || !s}>
            {saving ? "Đang lưu…" : "Lưu"}
          </Button>
        </footer>
      </div>
    </div>
  );
}
