"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  CreditCard,
  Landmark,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { cn, formatVnd } from "@/lib/utils";
import { JOB_TYPE_LABELS, type JobType } from "@/lib/job-types";

type Job = {
  id: string;
  name: string;
  agency: string;
  jobType: string;
  contractTotal: number;
  collected: number;
  grossProfit: number;
  remaining: number;
  status: string;
};

type Dash = {
  kpis: {
    cash: number;
    momRemaining: number;
    triRemaining: number;
    creditTotal: number;
    totalDebt: number;
    netWorth: number;
    totalContract: number;
    totalCollected: number;
    totalRemaining: number;
    totalProfit: number;
    totalNetProfit: number;
    health: number;
    landTakeHome: number;
  };
  jobs: Job[];
};

type Debts = {
  debts: { id: string; key: string; label: string; remaining: number }[];
  cards: {
    id: string;
    bank: string;
    principal: number;
    monthly: number;
    dueDay: number;
    remaining: number;
    thisMonth: number;
    daysToDue: number;
    fixedOnly: boolean;
  }[];
  cardTotals: { principal: number; thisMonth: number; remaining: number };
};

export function OverviewView() {
  const [dash, setDash] = useState<Dash | null>(null);
  const [debts, setDebts] = useState<Debts | null>(null);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    const [a, b] = await Promise.all([
      fetch("/api/dashboard").then((r) => r.json()),
      fetch("/api/debts").then((r) => r.json()),
    ]);
    setDash(a);
    setDebts(b);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!dash) {
    return (
      <div className="page">
        <p className="page-sub">Đang tải…</p>
      </div>
    );
  }

  const k = dash.kpis;

  return (
    <div className="page space-y-5">
      <div>
        <h1 className="page-title">Tổng quan</h1>
        <p className="page-sub">Tiền · job · công nợ — 1 màn hình là hiểu</p>
      </div>

      {/* Hero */}
      <section className="hero">
        <div className="hero-inner flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="flex items-center gap-2 text-[13px] font-medium text-white/80">
              <Wallet className="h-4 w-4" />
              Thực có (tiền − nợ)
            </p>
            <p className="mt-2 text-[34px] font-bold leading-none tracking-[-0.02em] tabular-nums">
              {formatVnd(k.netWorth)}
            </p>
            <p className="mt-2 text-[12px] text-white/75">
              Tiền {formatVnd(k.cash)} − nợ {formatVnd(k.totalDebt)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <div className="glass px-3.5 py-2.5">
              <p className="text-[11px] text-white/75">Còn phải thu</p>
              <p className="mt-0.5 text-[16px] font-bold tabular-nums">
                {formatVnd(k.totalRemaining)}
              </p>
            </div>
            <div className="glass px-3.5 py-2.5">
              <p className="text-[11px] text-white/75">Net sức khoẻ</p>
              <p className="mt-0.5 text-[16px] font-bold tabular-nums">
                {formatVnd(k.health)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4 KPI */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile
          label="Tổng doanh thu"
          value={formatVnd(k.totalContract)}
          icon={<TrendingUp className="h-[18px] w-[18px]" />}
        />
        <Tile label="Tổng đã thu" value={formatVnd(k.totalCollected)} tone="good" />
        <Tile label="Tổng LN gộp" value={formatVnd(k.totalProfit)} tone="good" />
        <Tile
          label="Tổng công nợ còn lại"
          value={formatVnd(k.totalRemaining)}
          tone="warn"
        />
      </section>

      {/* Bảng job — 4 cột */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="section-title">Job ({dash.jobs.length})</h2>
          <Link
            href="/"
            className="text-[13px] font-semibold text-[var(--brand)] hover:underline"
          >
            + Nhập liệu
          </Link>
        </div>
        <div className="table-wrap">
          <table className="data-table min-w-[540px]">
            <thead>
              <tr>
                <th>Tên job</th>
                <th className="text-right">Tổng HĐ</th>
                <th className="text-right">Đã thu</th>
                <th className="text-right">LN gộp</th>
              </tr>
            </thead>
            <tbody>
              {dash.jobs.map((j) => (
                <tr key={j.id}>
                  <td>
                    <span className="font-semibold">{j.name}</span>
                    <span className="ml-2 rounded-md bg-[#eef0f7] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[var(--ink-3)]">
                      {JOB_TYPE_LABELS[j.jobType as JobType] ?? j.jobType}
                    </span>
                    <span className="block text-[11.5px] text-[var(--ink-3)]">
                      {j.agency}
                    </span>
                  </td>
                  <td className="text-right font-semibold tabular-nums">
                    {formatVnd(j.contractTotal)}
                  </td>
                  <td className="text-right tabular-nums">{formatVnd(j.collected)}</td>
                  <td className="text-right money-pos">{formatVnd(j.grossProfit)}</td>
                </tr>
              ))}
              {dash.jobs.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-[var(--ink-3)]">
                    Chưa có job — qua tab Nhập liệu
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td>Tổng</td>
                <td className="text-right tabular-nums">{formatVnd(k.totalContract)}</td>
                <td className="text-right tabular-nums">{formatVnd(k.totalCollected)}</td>
                <td className="text-right money-pos">{formatVnd(k.totalProfit)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* Accordion: Công nợ & Vốn */}
      <section className="card overflow-hidden">
        <button
          type="button"
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
          onClick={() => setOpen((v) => !v)}
        >
          <span
            className="tile-icon"
            style={{ background: "var(--bad-soft)", color: "var(--bad)" }}
          >
            <CreditCard className="h-[18px] w-[18px]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-bold text-[var(--ink)]">
              Công nợ &amp; Vốn
            </span>
            <span className="block text-[12px] text-[var(--ink-3)]">
              Nợ cá nhân {formatVnd(k.momRemaining + k.triRemaining)} · thẻ{" "}
              {formatVnd(k.creditTotal)} · đất {formatVnd(k.landTakeHome)}
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
          <div className="space-y-4 border-t border-[var(--line)] p-4">
            {/* Nợ cá nhân */}
            <div>
              <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-[var(--ink-3)]">
                Nợ cá nhân
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {debts?.debts.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between rounded-xl bg-[#fafaff] px-3 py-2.5"
                  >
                    <span className="text-[13px] font-semibold">{d.label}</span>
                    <span className="text-[14px] font-bold tabular-nums text-[var(--bad)]">
                      {formatVnd(d.remaining)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Thẻ tín dụng */}
            <div>
              <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-[var(--ink-3)]">
                Thẻ tín dụng — trừ dần theo ngày đáo hạn
              </p>
              <div className="table-wrap">
                <table className="data-table min-w-[520px]">
                  <thead>
                    <tr>
                      <th>Thẻ</th>
                      <th className="text-right">Dư nợ</th>
                      <th className="text-right">Tháng này</th>
                      <th className="text-right">Còn lại</th>
                      <th className="text-right">Đáo hạn</th>
                    </tr>
                  </thead>
                  <tbody>
                    {debts?.cards.map((c) => (
                      <tr key={c.id}>
                        <td className="font-semibold">{c.bank}</td>
                        <td className="text-right tabular-nums">
                          {c.fixedOnly ? "—" : formatVnd(c.principal)}
                        </td>
                        <td className="text-right money-warn">
                          {formatVnd(c.thisMonth)}
                        </td>
                        <td className="text-right tabular-nums">
                          {c.fixedOnly ? "—" : formatVnd(c.remaining)}
                        </td>
                        <td className="text-right text-[12px] text-[var(--ink-3)]">
                          ngày {c.dueDay} · còn {c.daysToDue}d
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td>Tổng nợ thẻ</td>
                      <td className="text-right tabular-nums">
                        {formatVnd(debts?.cardTotals.principal ?? 0)}
                      </td>
                      <td className="text-right money-warn">
                        {formatVnd(debts?.cardTotals.thisMonth ?? 0)}
                      </td>
                      <td className="text-right tabular-nums">
                        {formatVnd(debts?.cardTotals.remaining ?? 0)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
              <Link
                href="/debts"
                className="mt-2 inline-block text-[12.5px] font-semibold text-[var(--brand)] hover:underline"
              >
                Sửa nợ &amp; thẻ →
              </Link>
            </div>

            {/* Vốn / đất */}
            <div>
              <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-[var(--ink-3)]">
                Vốn · đất
              </p>
              <div
                className="flex items-center justify-between rounded-xl px-3 py-3"
                style={{ background: "var(--brand-soft)" }}
              >
                <span className="flex items-center gap-2 text-[13px] font-bold">
                  <Landmark className="h-4 w-4 text-[var(--brand)]" />
                  Đất — thực nhận khi bán
                </span>
                <span className="text-[17px] font-bold tabular-nums text-[var(--brand)]">
                  {formatVnd(k.landTakeHome)}
                </span>
              </div>
              <Link
                href="/finance"
                className="mt-2 inline-block text-[12.5px] font-semibold text-[var(--brand)] hover:underline"
              >
                Xem chi tiết góp vốn &amp; khoản vay →
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Tile({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone?: "good" | "warn";
  icon?: React.ReactNode;
}) {
  const fg =
    tone === "good" ? "var(--good)" : tone === "warn" ? "var(--warn)" : "var(--brand)";
  const bg =
    tone === "good"
      ? "var(--good-soft)"
      : tone === "warn"
        ? "var(--warn-soft)"
        : "var(--brand-soft)";
  return (
    <div className="tile">
      {icon && (
        <span className="tile-icon" style={{ background: bg, color: fg }}>
          {icon}
        </span>
      )}
      <div className="min-w-0">
        <p className="tile-label">{label}</p>
        <p className="tile-value" style={tone ? { color: fg } : undefined}>
          {value}
        </p>
      </div>
    </div>
  );
}
