"use client";

import { useCallback, useEffect, useState } from "react";
import { Calculator, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { DateCell, MoneyCell, TextCell } from "@/components/sheet/cell";
import { Button } from "@/components/ui/button";
import { formatPct, formatVnd } from "@/lib/utils";

/**
 * BẢNG TÍNH CHI PHÍ DỰ ÁN — popup mở từ 1 dòng trong JOB.
 * Đúng công thức sheet "JOB"; lợi nhuận còn lại chảy về Dashboard.
 */

type Expense = { id: string; name: string; amount: number };
type Advance = { id: string; paidAt: string | null; amount: number; note: string | null };

type Job = {
  id: string;
  agency: string;
  name: string;
  contractTotal: number;
  collected: number;
  aTanAmount: number | null;
  altFeeRate: number;
  expenses: Expense[];
  advances: Advance[];
  metrics: {
    feeRate: number;
    invoiceFee: number;
    productionCost: number;
    advanceTotal: number;
    advanceRemaining: number;
    aTan: number;
    aTanIsManual: boolean;
    distribution: number;
    altFeeRate: number;
    altTotal: number;
    grossProfit: number;
    netProfit: number;
    remaining: number;
  };
};

export function ProductionModal({
  jobId,
  onClose,
}: {
  jobId: string;
  onClose: (changed: boolean) => void;
}) {
  const [job, setJob] = useState<Job | null>(null);
  const [changed, setChanged] = useState(false);
  const [newExpense, setNewExpense] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/production");
    const json = await res.json();
    setJob(json.jobs.find((j: Job) => j.id === jobId) ?? null);
  }, [jobId]);

  useEffect(() => {
    load();
  }, [load]);

  // Esc để đóng
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose(changed);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [changed, onClose]);

  async function patchJob(patch: Record<string, unknown>) {
    const res = await fetch("/api/production", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: jobId, ...patch }),
    });
    if (!res.ok) return toast.error("Lưu thất bại");
    const json = await res.json();
    setJob(json.jobs.find((j: Job) => j.id === jobId) ?? null);
    setChanged(true);
  }

  async function expense(method: "POST" | "PATCH" | "DELETE", body: unknown) {
    const url =
      method === "DELETE"
        ? `/api/jobs/${jobId}/expenses?expenseId=${body}`
        : `/api/jobs/${jobId}/expenses`;
    await fetch(url, {
      method,
      ...(method === "DELETE"
        ? {}
        : {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }),
    });
    await load();
    setChanged(true);
  }

  async function advance(method: "POST" | "PATCH" | "DELETE", body: unknown) {
    const url =
      method === "DELETE"
        ? `/api/production/advances?id=${body}`
        : "/api/production/advances";
    await fetch(url, {
      method,
      ...(method === "DELETE"
        ? {}
        : {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }),
    });
    await load();
    setChanged(true);
  }

  const m = job?.metrics;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-auto bg-[#131829]/45 p-4 backdrop-blur-sm sm:p-8"
      onClick={() => onClose(changed)}
    >
      <div
        className="w-full max-w-[980px] rounded-[18px] bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center gap-3 border-b border-[var(--line)] px-5 py-4">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
            style={{ background: "linear-gradient(135deg,#5145e5,#7c5cf5)" }}
          >
            <Calculator className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold text-[var(--ink)]">
              Bảng tính chi phí dự án
            </p>
            <p className="truncate text-[12px] text-[var(--ink-3)]">
              {job ? `${job.agency} — ${job.name}` : "Đang tải…"}
            </p>
          </div>
          <button
            type="button"
            aria-label="Đóng"
            className="row-del"
            onClick={() => onClose(changed)}
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {!job || !m ? (
          <p className="p-8 text-center text-[13px] text-[var(--ink-3)]">Đang tải…</p>
        ) : (
          <div className="grid gap-5 p-5 lg:grid-cols-2">
            {/* A + B */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="calc-section">A. Thông tin hợp đồng</div>
                <div className="calc-row">
                  <span className="calc-label">
                    Tổng phí ký hợp đồng <span className="badge-input">nhập</span>
                  </span>
                  <MoneyCell
                    value={job.contractTotal}
                    addStyle
                    className="w-[150px] shrink-0"
                    onCommit={(v) => patchJob({ contractTotal: v ?? 0 })}
                  />
                </div>
                <div className="calc-row">
                  <span className="calc-label">
                    Phí xuất hoá đơn ({formatPct(m.feeRate, 0)}){" "}
                    <span className="badge-auto">tự tính</span>
                  </span>
                  <span className="calc-formula">{formatVnd(m.invoiceFee)}</span>
                </div>
                <div className="calc-row">
                  <span className="calc-label">
                    Đã thu <span className="badge-input">nhập</span>
                  </span>
                  <MoneyCell
                    value={job.collected}
                    addStyle
                    className="w-[150px] shrink-0"
                    onCommit={(v) => patchJob({ collected: v ?? 0 })}
                  />
                </div>
                <div className="calc-row">
                  <span className="calc-label">Còn phải thu</span>
                  <span className="calc-value money-warn">{formatVnd(m.remaining)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="calc-section">B. Chi phí sản xuất</div>
                <div className="flex items-center gap-2">
                  <input
                    className="cell cell-add"
                    placeholder="Thêm hạng mục… (Enter)"
                    value={newExpense}
                    onChange={(e) => setNewExpense(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newExpense.trim()) {
                        expense("POST", { name: newExpense.trim(), amount: 0 });
                        setNewExpense("");
                      }
                    }}
                  />
                </div>
                {job.expenses.map((e, i) => (
                  <div key={e.id} className="flex items-center gap-2">
                    <span className="w-4 shrink-0 text-right text-[11px] text-[var(--ink-3)]">
                      {i + 1}
                    </span>
                    <TextCell
                      value={e.name}
                      placeholder="Hạng mục"
                      onCommit={(v) => expense("PATCH", { id: e.id, name: v ?? "" })}
                    />
                    <MoneyCell
                      value={e.amount}
                      addStyle
                      className="w-[130px] shrink-0"
                      onCommit={(v) => expense("PATCH", { id: e.id, amount: v ?? 0 })}
                    />
                    <button
                      type="button"
                      aria-label={`Xóa ${e.name}`}
                      className="row-del"
                      onClick={() => expense("DELETE", e.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <div className="calc-row border-t-2 border-[var(--line)] pt-2">
                  <span className="calc-label font-semibold">Tổng chi phí sản xuất</span>
                  <span className="calc-formula">{formatVnd(m.productionCost)}</span>
                </div>
              </div>
            </div>

            {/* ĐÃ ỨNG + C */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="calc-section flex-1">B. Đã ứng</div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => advance("POST", { jobId, amount: 0 })}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {job.advances.length === 0 && (
                  <p className="py-2 text-center text-[12px] text-[var(--ink-3)]">
                    Chưa ứng lần nào
                  </p>
                )}
                {job.advances.map((a) => (
                  <div key={a.id} className="flex items-center gap-2">
                    <DateCell
                      value={a.paidAt}
                      addStyle
                      className="w-[130px] shrink-0"
                      onCommit={(v) => advance("PATCH", { id: a.id, paidAt: v })}
                    />
                    <MoneyCell
                      value={a.amount}
                      addStyle
                      className="w-[130px] shrink-0"
                      onCommit={(v) => advance("PATCH", { id: a.id, amount: v ?? 0 })}
                    />
                    <button
                      type="button"
                      aria-label="Xóa lần ứng"
                      className="row-del"
                      onClick={() => advance("DELETE", a.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <div className="calc-row border-t-2 border-[var(--line)] pt-2">
                  <span className="calc-label font-semibold">Tổng ứng</span>
                  <span className="calc-formula">{formatVnd(m.advanceTotal)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="calc-section">C. Tổng kết &amp; phân phối</div>
                <div className="calc-row">
                  <span className="calc-label">
                    💰 A Tân{" "}
                    <span className={m.aTanIsManual ? "badge-input" : "badge-auto"}>
                      {m.aTanIsManual ? "nhập" : "tự 20% LN"}
                    </span>
                  </span>
                  <MoneyCell
                    value={job.aTanAmount}
                    allowNull
                    addStyle
                    placeholder="tự tính"
                    className="w-[150px] shrink-0"
                    onCommit={(v) => patchJob({ aTanAmount: v })}
                  />
                </div>
                <div className="calc-row">
                  <span className="calc-label">A Tân + phí xuất HĐ</span>
                  <span className="calc-formula">{formatVnd(m.distribution)}</span>
                </div>
                <div className="calc-row">
                  <span className="calc-label">
                    Hoá đơn {formatPct(m.altFeeRate)} + tổng
                  </span>
                  <span className="calc-formula">{formatVnd(m.altTotal)}</span>
                </div>
                <div className="calc-row border-t-2 border-[var(--line)] pt-2">
                  <span className="calc-label font-semibold">Lợi nhuận (HĐ − CP SX)</span>
                  <span className="calc-value money-pos">
                    {formatVnd(m.grossProfit)}
                  </span>
                </div>
                <div
                  className="flex items-center justify-between rounded-xl px-3 py-3"
                  style={{ background: "var(--good-soft)" }}
                >
                  <span className="text-[13px] font-bold">
                    Lợi nhuận còn lại
                    <span className="block text-[11px] font-normal text-[var(--ink-3)]">
                      → Dashboard
                    </span>
                  </span>
                  <span className="text-[19px] font-bold tabular-nums text-[var(--good)]">
                    {formatVnd(m.netProfit)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <footer className="flex justify-end gap-2 border-t border-[var(--line)] px-5 py-3">
          <Button type="button" onClick={() => onClose(changed)}>
            Xong
          </Button>
        </footer>
      </div>
    </div>
  );
}
