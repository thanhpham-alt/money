"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  FilePlus2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MoneyCell, TextCell } from "@/components/sheet/cell";
import { cn, formatVnd, parseMoneyInput } from "@/lib/utils";
import { JOB_TYPE_LABELS, JOB_TYPES, type JobType } from "@/lib/job-types";

type Expense = { id: string; name: string; amount: number };

type Job = {
  id: string;
  code: string;
  jobType: string;
  agency: string;
  name: string;
  status: string;
  contractTotal: number;
  collected: number;
  expenses: Expense[];
  metrics: { remaining: number; totalCost: number; grossProfit: number };
};

const STATUSES = ["Đang làm", "Chờ thu", "Đã xong", "Tạm dừng"] as const;

const BLANK = {
  name: "",
  agency: "",
  jobType: "AGENCY" as JobType,
  contractTotal: 0,
  collected: 0,
  expense: 0,
  status: "Đang làm" as string,
};

export function EntryView() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...BLANK });
  const [saving, setSaving] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/jobs");
    const json = await res.json();
    setJobs(json.jobs ?? []);
    return json.jobs as Job[];
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const editing = useMemo(
    () => jobs.find((j) => j.id === editingId) ?? null,
    [jobs, editingId]
  );

  // Nhiều dòng chi phí → ô tổng chỉ xem, phải mở chi tiết mới sửa được
  const lines = editing?.expenses.length ?? 0;
  const lumpLocked = lines >= 2;

  function startNew() {
    setEditingId(null);
    setForm({ ...BLANK });
    setShowDetail(false);
  }

  function startEdit(j: Job) {
    setEditingId(j.id);
    setForm({
      name: j.name,
      agency: j.agency,
      jobType: j.jobType as JobType,
      contractTotal: j.contractTotal,
      collected: j.collected,
      expense: j.expenses.reduce((s, e) => s + e.amount, 0),
      status: j.status,
    });
    setShowDetail(false);
  }

  const remaining = form.contractTotal - form.collected;
  const grossProfit = form.contractTotal - form.expense;

  async function save() {
    if (!form.name.trim()) return toast.error("Chưa có tên job");
    setSaving(true);
    try {
      let jobId = editingId;

      if (jobId) {
        const res = await fetch(`/api/jobs/${jobId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            agency: form.agency.trim() || form.name.trim(),
            jobType: form.jobType,
            status: form.status,
            contractTotal: form.contractTotal,
            collected: form.collected,
          }),
        });
        if (!res.ok) throw new Error();
      } else {
        const res = await fetch("/api/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            agency: form.agency.trim() || form.name.trim(),
            jobType: form.jobType,
            status: form.status,
            contractTotal: form.contractTotal,
            collected: form.collected,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "");
        }
        jobId = (await res.json()).id;
      }

      // Chi phí: đặt bằng 1 số tổng (chỉ khi job không có nhiều dòng)
      if (jobId && !lumpLocked) {
        const res = await fetch(`/api/jobs/${jobId}/expenses`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lump: form.expense }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          toast.error(err.error || "Không lưu được tổng chi phí");
        }
      }

      const fresh = await load();
      toast.success(editingId ? "Đã cập nhật job" : "Đã thêm job");
      if (!editingId) {
        const created = fresh.find((j) => j.id === jobId);
        if (created) startEdit(created);
      }
    } catch (e) {
      toast.error((e as Error).message || "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  }

  async function remove(j: Job) {
    if (!confirm(`Xoá job "${j.name}"?`)) return;
    await fetch(`/api/jobs/${j.id}`, { method: "DELETE" });
    if (editingId === j.id) startNew();
    await load();
    toast.success("Đã xoá job");
  }

  async function expenseLine(
    method: "POST" | "PATCH" | "DELETE",
    body: Record<string, unknown> | string
  ) {
    if (!editingId) return;
    const url =
      method === "DELETE"
        ? `/api/jobs/${editingId}/expenses?expenseId=${body}`
        : `/api/jobs/${editingId}/expenses`;
    await fetch(url, {
      method,
      ...(method === "DELETE"
        ? {}
        : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    });
    const fresh = await load();
    const j = fresh.find((x) => x.id === editingId);
    if (j) setForm((f) => ({ ...f, expense: j.expenses.reduce((s, e) => s + e.amount, 0) }));
  }

  return (
    <div className="page space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Nhập liệu</h1>
          <p className="page-sub">Thêm hoặc sửa job — chỉ 5 ô, dưới 30 giây</p>
        </div>
        {editingId && (
          <Button type="button" variant="outline" size="sm" onClick={startNew}>
            <FilePlus2 className="h-4 w-4" />
            Job mới
          </Button>
        )}
      </div>

      {/* ── FORM ── */}
      <div className="card card-pad space-y-4">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase",
              editingId
                ? "bg-[var(--warn-soft)] text-[var(--warn)]"
                : "bg-[var(--good-soft)] text-[var(--good)]"
            )}
          >
            {editingId ? "Đang sửa" : "Job mới"}
          </span>
          {editing && (
            <span className="truncate text-[12px] text-[var(--ink-3)]">
              {editing.code}
            </span>
          )}
        </div>

        <Field label="Tên job">
          <input
            className="field"
            placeholder="VD: LG Production"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Agency / khách">
            <input
              className="field"
              placeholder="VD: Bizeyes"
              value={form.agency}
              onChange={(e) => setForm({ ...form, agency: e.target.value })}
            />
          </Field>
          <Field label="Loại">
            <select
              className="field"
              value={form.jobType}
              onChange={(e) => setForm({ ...form, jobType: e.target.value as JobType })}
            >
              {JOB_TYPES.map((t) => (
                <option key={t} value={t}>
                  {JOB_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Tổng hợp đồng">
            <input
              inputMode="numeric"
              className="field field-money"
              value={form.contractTotal ? form.contractTotal.toLocaleString("vi-VN") : ""}
              placeholder="0"
              onChange={(e) =>
                setForm({ ...form, contractTotal: parseMoneyInput(e.target.value) })
              }
            />
          </Field>
          <Field label="Đã thu">
            <input
              inputMode="numeric"
              className="field field-money"
              value={form.collected ? form.collected.toLocaleString("vi-VN") : ""}
              placeholder="0"
              onChange={(e) =>
                setForm({ ...form, collected: parseMoneyInput(e.target.value) })
              }
            />
          </Field>
          <Field
            label="Tổng chi phí"
            hint={lumpLocked ? `${lines} dòng — mở chi tiết để sửa` : undefined}
          >
            <input
              inputMode="numeric"
              className={cn("field field-money", lumpLocked && "opacity-60")}
              value={form.expense ? form.expense.toLocaleString("vi-VN") : ""}
              placeholder="0"
              readOnly={lumpLocked}
              onChange={(e) =>
                setForm({ ...form, expense: parseMoneyInput(e.target.value) })
              }
            />
          </Field>
        </div>

        {/* Tự tính */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Auto label="Còn lại (HĐ − đã thu)" value={remaining} tone="warn" />
          <Auto label="LN gộp (HĐ − chi phí)" value={grossProfit} tone="good" />
        </div>

        <Field label="Trạng thái">
          <div className="flex flex-wrap gap-1.5">
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setForm({ ...form, status: s })}
                data-active={form.status === s}
                className="tab"
              >
                {s}
              </button>
            ))}
          </div>
        </Field>

        <div className="flex flex-wrap items-center gap-2 border-t border-[var(--line)] pt-4">
          <Button type="button" size="lg" onClick={save} disabled={saving}>
            <Check className="h-4 w-4" />
            {saving ? "Đang lưu…" : editingId ? "Lưu thay đổi" : "Thêm job"}
          </Button>
          {editingId && (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--ink-3)] hover:text-[var(--brand)]"
              onClick={() => setShowDetail((v) => !v)}
            >
              <ChevronDown
                className={cn("h-4 w-4 transition-transform", showDetail && "rotate-180")}
              />
              Chi tiết chi phí ({lines})
            </button>
          )}
        </div>

        {/* Chi tiết chi phí — không bắt buộc */}
        {editingId && showDetail && (
          <div className="space-y-2 rounded-xl bg-[#fafaff] p-3">
            <ExpenseAdder onAdd={(name) => expenseLine("POST", { name, amount: 0 })} />
            {editing?.expenses.map((e, i) => (
              <div key={e.id} className="flex items-center gap-2">
                <span className="w-4 shrink-0 text-right text-[11px] text-[var(--ink-3)]">
                  {i + 1}
                </span>
                <TextCell
                  value={e.name}
                  placeholder="Hạng mục"
                  onCommit={(v) => expenseLine("PATCH", { id: e.id, name: v ?? "" })}
                />
                <MoneyCell
                  value={e.amount}
                  addStyle
                  className="w-[130px] shrink-0"
                  onCommit={(v) => expenseLine("PATCH", { id: e.id, amount: v ?? 0 })}
                />
                <button
                  type="button"
                  aria-label={`Xoá ${e.name}`}
                  className="row-del"
                  onClick={() => expenseLine("DELETE", e.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {lines === 0 && (
              <p className="py-2 text-center text-[12px] text-[var(--ink-3)]">
                Chưa có dòng nào — dùng ô “Tổng chi phí” ở trên là đủ
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── DANH SÁCH JOB ── */}
      <div>
        <h2 className="section-title mb-2">Job đã có ({jobs.length})</h2>
        <div className="card overflow-hidden">
          {jobs.map((j) => (
            <div key={j.id} className="list-row">
              <span
                className="avatar shrink-0"
                style={{ background: avatarColor(j.name || j.agency) }}
              >
                {(j.name || j.agency).slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-[var(--ink)]">
                  {j.name}
                </p>
                <p className="truncate text-[12px] text-[var(--ink-3)]">
                  {j.agency} · {JOB_TYPE_LABELS[j.jobType as JobType] ?? j.jobType}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[14px] font-bold tabular-nums text-[var(--ink)]">
                  {formatVnd(j.contractTotal)}
                </p>
                <p className="text-[11.5px] tabular-nums text-[var(--good)]">
                  LN {formatVnd(j.metrics.grossProfit)}
                </p>
              </div>
              <button
                type="button"
                aria-label={`Sửa ${j.name}`}
                className="row-del shrink-0 hover:bg-[var(--brand-soft)] hover:text-[var(--brand)]"
                onClick={() => startEdit(j)}
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label={`Xoá ${j.name}`}
                className="row-del shrink-0"
                onClick={() => remove(j)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          {jobs.length === 0 && (
            <p className="py-10 text-center text-[13px] text-[var(--ink-3)]">
              Chưa có job nào
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ExpenseAdder({ onAdd }: { onAdd: (name: string) => void }) {
  const [v, setV] = useState("");
  return (
    <div className="flex items-center gap-2">
      <input
        className="cell cell-add"
        placeholder="Thêm hạng mục… (Enter)"
        value={v}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && v.trim()) {
            onAdd(v.trim());
            setV("");
          }
        }}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={!v.trim()}
        onClick={() => {
          onAdd(v.trim());
          setV("");
        }}
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12.5px] font-semibold text-[var(--ink-2)]">
        {label}
        {hint && (
          <span className="ml-1.5 font-normal text-[var(--warn)]">· {hint}</span>
        )}
      </span>
      {children}
    </label>
  );
}

function Auto({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "good" | "warn";
}) {
  const color = tone === "good" ? "var(--good)" : "var(--warn)";
  const bg = tone === "good" ? "var(--good-soft)" : "var(--warn-soft)";
  return (
    <div
      className="flex items-center justify-between rounded-xl px-3 py-2.5"
      style={{ background: bg }}
    >
      <span className="text-[12.5px] font-semibold text-[var(--ink-2)]">
        {label} <span className="badge-auto">tự tính</span>
      </span>
      <span className="text-[16px] font-bold tabular-nums" style={{ color }}>
        {formatVnd(value)}
      </span>
    </div>
  );
}

const AVATAR_COLORS = [
  "#5145e5",
  "#0fa47f",
  "#e8912a",
  "#e5484d",
  "#7c5cf5",
  "#0ea5e9",
  "#db2777",
  "#65a30d",
];

function avatarColor(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
