"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MetricCard } from "@/components/shared/metric-card";
import { formatPct, formatVnd, parseMoneyInput } from "@/lib/utils";

type Expense = {
  id: string;
  name: string;
  amount: number;
  note: string | null;
  person: string | null;
  paidStatus: string;
};

type JobDetail = {
  id: string;
  code: string;
  jobType: string;
  agency: string;
  name: string;
  status: string;
  contractTotal: number;
  collected: number;
  externalUrl: string | null;
  notes: string | null;
  publicVisible?: boolean;
  expenses: Expense[];
  metrics: {
    expenseTotal: number;
    invoiceFee: number;
    totalCost: number;
    grossProfit: number;
    aTan: number;
    netProfit: number;
    remaining: number;
  };
};

const STATUSES = ["Đang làm", "Chờ thu", "Đã xong", "Tạm dừng"];
const PAID = ["Chưa", "Một phần", "Xong"];

export function JobDetailView({ id }: { id: string }) {
  const router = useRouter();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [settings, setSettings] = useState<{
    invoiceFeeRate: number;
    aTanShareRate: number;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/jobs/${id}`);
    if (!res.ok) {
      toast.error("Không tìm thấy job");
      router.push("/jobs");
      return;
    }
    const data = await res.json();
    setJob(data.job);
    setSettings(data.settings);
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveJob(patch: Partial<JobDetail>) {
    if (!job) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("fail");
      toast.success("Đã lưu");
      await load();
    } catch {
      toast.error("Lưu thất bại");
    } finally {
      setSaving(false);
    }
  }

  async function saveExpense(expense: Expense, patch: Partial<Expense>) {
    await fetch(`/api/jobs/${id}/expenses`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: expense.id, ...patch }),
    });
    await load();
  }

  async function addExpense() {
    await fetch(`/api/jobs/${id}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Chi phí mới", amount: 0 }),
    });
    toast.success("Đã thêm dòng chi phí");
    await load();
  }

  async function removeExpense(expenseId: string) {
    if (!confirm("Xóa dòng chi phí này?")) return;
    await fetch(`/api/jobs/${id}/expenses?expenseId=${expenseId}`, {
      method: "DELETE",
    });
    await load();
  }

  async function deleteJob() {
    if (!confirm("Xóa toàn bộ job này?")) return;
    await fetch(`/api/jobs/${id}`, { method: "DELETE" });
    toast.success("Đã xóa job");
    router.push("/jobs");
  }

  if (!job) {
    return (
      <div className="page">
        <p className="page-sub">Đang tải job…</p>
      </div>
    );
  }

  const m = job.metrics;

  return (
    <div className="page space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/jobs">
          <Button variant="ghost" size="sm" type="button">
            <ArrowLeft className="h-4 w-4" />
            Job Agency
          </Button>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="page-title truncate">
            {job.agency} — {job.name}
          </h1>
          <p className="page-sub font-mono text-xs">
            {job.code}
            <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-sans font-medium text-slate-600 dark:bg-[var(--surface-2)]">
              {job.jobType}
            </span>
            {job.jobType === "BLUESCOPE" && (
              <Link href="/bluescope" className="ml-2 font-sans text-violet-600 hover:underline">
                → Module Bluescope
              </Link>
            )}
          </p>
        </div>
        <Button variant="destructive" size="sm" type="button" onClick={deleteJob}>
          <Trash2 className="h-4 w-4" />
          Xóa job
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Còn phải thu" value={formatVnd(m.remaining)} tone="warn" />
        <MetricCard title="Tổng chi phí" value={formatVnd(m.totalCost)} />
        <MetricCard title="Lợi nhuận gộp" value={formatVnd(m.grossProfit)} tone="success" />
        <MetricCard
          title={`A Tân (${settings ? formatPct(settings.aTanShareRate) : "20%"})`}
          value={formatVnd(m.aTan)}
          subtitle={`Còn lại: ${formatVnd(m.netProfit)}`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>A. Hợp đồng</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <label className="grid gap-1 text-sm">
              <span className="text-slate-500">Agency</span>
              <Input
                defaultValue={job.agency}
                onBlur={(e) => {
                  if (e.target.value !== job.agency) saveJob({ agency: e.target.value });
                }}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-500">Tên job</span>
              <Input
                defaultValue={job.name}
                onBlur={(e) => {
                  if (e.target.value !== job.name) saveJob({ name: e.target.value });
                }}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-500">Code (sheet)</span>
              <Input
                defaultValue={job.code}
                className="font-mono"
                onBlur={(e) => {
                  if (e.target.value !== job.code) saveJob({ code: e.target.value });
                }}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-500">Trạng thái</span>
              <select
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-[15px] dark:border-[var(--border-default)] dark:bg-[var(--surface-2)]"
                value={job.status}
                onChange={(e) => saveJob({ status: e.target.value })}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm">
                <span className="text-slate-500">Tổng HĐ</span>
                <Input
                  className="input-money"
                  defaultValue={job.contractTotal}
                  onBlur={(e) => {
                    const v = parseMoneyInput(e.target.value);
                    if (v !== job.contractTotal) saveJob({ contractTotal: v });
                  }}
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-slate-500">Đã thu</span>
                <Input
                  className="input-money"
                  defaultValue={job.collected}
                  onBlur={(e) => {
                    const v = parseMoneyInput(e.target.value);
                    if (v !== job.collected) saveJob({ collected: v });
                  }}
                />
              </label>
            </div>
            <p className="text-xs text-slate-500">
              Phí HĐ: {formatVnd(m.invoiceFee)} (
              {settings ? formatPct(settings.invoiceFeeRate) : "4%"})
            </p>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-500">Link ngoài (Bluescope / Drive…)</span>
              <div className="flex gap-2">
                <Input
                  defaultValue={job.externalUrl ?? ""}
                  placeholder="https://…"
                  onBlur={(e) => {
                    const v = e.target.value.trim() || null;
                    if (v !== job.externalUrl) saveJob({ externalUrl: v });
                  }}
                />
                {job.externalUrl && (
                  <a href={job.externalUrl} target="_blank" rel="noreferrer">
                    <Button type="button" variant="outline" size="icon">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                )}
              </div>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-500">Ghi chú</span>
              <Textarea
                defaultValue={job.notes ?? ""}
                onBlur={(e) => {
                  const v = e.target.value || null;
                  if (v !== job.notes) saveJob({ notes: v });
                }}
              />
            </label>
            {saving && <p className="text-xs text-orange-600">Đang lưu…</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>C. Tổng kết P&amp;L</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(
              [
                ["Tổng HĐ", job.contractTotal],
                ["Phí xuất HĐ", m.invoiceFee],
                ["Chi phí SX", m.expenseTotal],
                ["Tổng chi phí", m.totalCost],
                ["Lợi nhuận gộp", m.grossProfit],
                ["A Tân", m.aTan],
                ["LN còn lại", m.netProfit],
                ["Công nợ còn", m.remaining],
              ] as const
            ).map(([label, val]) => (
              <div key={String(label)} className="flex justify-between border-b border-stone-100 py-1.5 dark:border-[var(--border-subtle)]">
                <span className="text-slate-500">{label as string}</span>
                <span className="font-medium tabular-nums">{formatVnd(val as number)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {job.jobType === "BLUESCOPE" ? (
        <Card>
          <CardHeader>
            <CardTitle>B. Chi phí sản xuất</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-slate-600 dark:text-[var(--text-secondary)]">
              Chi phí Bluescope đến từ bảng <strong>Booking</strong> trong module riêng —
              không nhập ở đây để tránh lệch số.
            </p>
            <p className="text-slate-500">
              Đã xài hiện tại:{" "}
              <strong className="tabular-nums">{formatVnd(m.expenseTotal)}</strong>
            </p>
            <Link href="/bluescope">
              <Button type="button" variant="outline" size="sm">
                Mở module Bluescope →
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>B. Chi phí sản xuất</CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={addExpense}>
            <Plus className="h-4 w-4" />
            Thêm dòng
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="table-wrap border-0">
            <table className="data-table min-w-[640px]">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Hạng mục</th>
                  <th className="text-right">Số tiền</th>
                  <th>Ghi chú</th>
                  <th>Người nhận</th>
                  <th>Đã chi?</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {job.expenses.map((e, i) => (
                  <tr key={e.id}>
                    <td className="text-slate-400">{i + 1}</td>
                    <td>
                      <Input
                        className="h-9 border-0 bg-transparent shadow-none focus-visible:ring-1"
                        defaultValue={e.name}
                        onBlur={(ev) => {
                          if (ev.target.value !== e.name)
                            saveExpense(e, { name: ev.target.value });
                        }}
                      />
                    </td>
                    <td>
                      <Input
                        className="input-money h-9 border-0 bg-transparent shadow-none focus-visible:ring-1"
                        defaultValue={e.amount}
                        onBlur={(ev) => {
                          const v = parseMoneyInput(ev.target.value);
                          if (v !== e.amount) saveExpense(e, { amount: v });
                        }}
                      />
                    </td>
                    <td>
                      <Input
                        className="h-9 border-0 bg-transparent shadow-none focus-visible:ring-1"
                        defaultValue={e.note ?? ""}
                        onBlur={(ev) => {
                          const v = ev.target.value || null;
                          if (v !== e.note) saveExpense(e, { note: v });
                        }}
                      />
                    </td>
                    <td>
                      <Input
                        className="h-9 border-0 bg-transparent shadow-none focus-visible:ring-1"
                        defaultValue={e.person ?? ""}
                        onBlur={(ev) => {
                          const v = ev.target.value || null;
                          if (v !== e.person) saveExpense(e, { person: v });
                        }}
                      />
                    </td>
                    <td>
                      <select
                        className="h-9 rounded border border-slate-200 bg-white px-2 text-sm dark:border-[var(--border-default)] dark:bg-[var(--surface-2)]"
                        value={e.paidStatus}
                        onChange={(ev) => saveExpense(e, { paidStatus: ev.target.value })}
                      >
                        {PAID.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500"
                        onClick={() => removeExpense(e.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-semibold dark:bg-[var(--surface-2)]">
                  <td colSpan={2}>Tổng chi phí SX</td>
                  <td className="text-right tabular-nums">{formatVnd(m.expenseTotal)}</td>
                  <td colSpan={4} />
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  );
}
