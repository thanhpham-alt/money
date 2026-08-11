"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Plus, Search } from "lucide-react";
import { CollectStatusBadge, JobStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CreateJobModal } from "@/features/jobs/create-job-modal";
import { JOB_TYPE_LABELS, type JobType } from "@/lib/job-types";
import { formatVnd } from "@/lib/utils";

type JobRow = {
  id: string;
  code: string;
  jobType: string;
  agency: string;
  name: string;
  status: string;
  contractTotal: number;
  collected: number;
  externalUrl: string | null;
  metrics: {
    remaining: number;
    totalCost: number;
    grossProfit: number;
  };
  collectStatus: string;
};

export function JobsView() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [q, setQ] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/jobs");
    const data = await res.json();
    setJobs(data.jobs ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = jobs.filter((j) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return (
      j.agency.toLowerCase().includes(s) ||
      j.name.toLowerCase().includes(s) ||
      j.code.toLowerCase().includes(s) ||
      j.jobType.toLowerCase().includes(s)
    );
  });

  const totals = filtered.reduce(
    (acc, j) => {
      acc.contract += j.contractTotal;
      acc.remaining += j.metrics.remaining;
      acc.profit += j.metrics.grossProfit;
      return acc;
    },
    { contract: 0, remaining: 0, profit: 0 }
  );

  return (
    <div className="page space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Job Production</h1>
          <p className="page-sub">
            Mọi job (Agency · Event · Bluescope) — 1 khuôn P&amp;L, công nợ đổ về Dashboard
          </p>
        </div>
        <Button type="button" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Thêm job
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          className="pl-9"
          placeholder="Tìm agency, job, code, type…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Type</th>
              <th>Agency</th>
              <th>Tên job</th>
              <th>Code</th>
              <th className="text-right">Tổng HĐ</th>
              <th className="text-right">Đã thu</th>
              <th className="text-right">Còn lại</th>
              <th className="text-right">Chi phí</th>
              <th className="text-right">LN gộp</th>
              <th>TT</th>
              <th>Thu</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((j, i) => (
              <tr key={j.id}>
                <td className="text-slate-400">{i + 1}</td>
                <td>
                  <Badge className="border border-stone-200 bg-slate-50 text-slate-600">
                    {JOB_TYPE_LABELS[j.jobType as JobType] ?? j.jobType}
                  </Badge>
                </td>
                <td className="font-medium">{j.agency}</td>
                <td>
                  <Link href={`/jobs/${j.id}`} className="text-orange-600 hover:underline">
                    {j.name}
                  </Link>
                </td>
                <td className="font-mono text-xs text-slate-500">{j.code}</td>
                <td className="text-right tabular-nums">{formatVnd(j.contractTotal)}</td>
                <td className="text-right tabular-nums">{formatVnd(j.collected)}</td>
                <td className="text-right tabular-nums font-medium text-amber-700">
                  {formatVnd(j.metrics.remaining)}
                </td>
                <td className="text-right tabular-nums">{formatVnd(j.metrics.totalCost)}</td>
                <td className="text-right tabular-nums text-emerald-700">
                  {formatVnd(j.metrics.grossProfit)}
                </td>
                <td>
                  <JobStatusBadge status={j.status} />
                </td>
                <td>
                  <CollectStatusBadge status={j.collectStatus} />
                </td>
                <td>
                  {j.jobType === "BLUESCOPE" ? (
                    <Link
                      href="/bluescope"
                      className="text-xs font-medium text-violet-600 hover:underline"
                    >
                      Module
                    </Link>
                  ) : j.externalUrl ? (
                    <a
                      href={j.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex text-violet-600"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : null}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={13} className="py-8 text-center text-slate-500">
                  Chưa có job — bấm “Thêm job”
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 font-semibold dark:bg-[var(--surface-2)]">
              <td colSpan={5}>Tổng ({filtered.length} job)</td>
              <td className="text-right tabular-nums">{formatVnd(totals.contract)}</td>
              <td />
              <td className="text-right tabular-nums text-amber-700">
                {formatVnd(totals.remaining)}
              </td>
              <td />
              <td className="text-right tabular-nums text-emerald-700">
                {formatVnd(totals.profit)}
              </td>
              <td colSpan={3} />
            </tr>
          </tfoot>
        </table>
      </div>

      <CreateJobModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          void load();
        }}
      />
    </div>
  );
}
