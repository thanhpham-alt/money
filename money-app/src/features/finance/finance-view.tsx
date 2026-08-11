"use client";

import { useCallback, useEffect, useState } from "react";
import { Landmark, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { MoneyCell } from "@/components/sheet/cell";
import { formatPct, formatVnd } from "@/lib/utils";

type Land = {
  capitalPartner: number;
  capitalMine: number;
  loanPartner: number;
  loanMine: number;
  loanTotalStart: number;
  loanMonthlyAmort: number;
  loanStartDate: string;
  salePrice: number;
  loanCost1: number;
  loanCost2: number;
  saleCommissionPct: number;
  partnerPrincipal: number;
};

type Metrics = {
  capitalTotal: number;
  ratioPartner: number;
  ratioMine: number;
  monthsPaid: number;
  loanTotal: number;
  commission: number;
  costTotal: number;
  priceGain: number;
  netGain: number;
  profitPartner: number;
  profitMine: number;
  capitalBack: number;
  loanCostsPaid: number;
  takeHome: number;
};

export function FinanceView() {
  const [land, setLand] = useState<Land | null>(null);
  const [m, setM] = useState<Metrics | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/finance");
    const json = await res.json();
    setLand(json.land);
    setM(json.metrics);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function patch(body: Record<string, unknown>) {
    const res = await fetch("/api/finance", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return toast.error("Lưu thất bại");
    const json = await res.json();
    setLand(json.land);
    setM(json.metrics);
  }

  if (!land || !m) {
    return (
      <div className="page">
        <p className="page-sub">Đang tải Tài chính…</p>
      </div>
    );
  }

  return (
    <div className="page space-y-5">
      <div>
        <h1 className="page-title">Tài chính · Đất</h1>
        <p className="page-sub">
          Góp vốn 2021 · khoản vay · lợi nhuận khi bán · quyết toán phần của tôi
        </p>
      </div>

      {/* Hero — số thực nhận */}
      <section className="hero">
        <div className="hero-inner flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="flex items-center gap-2 text-[13px] font-medium text-white/80">
              <Landmark className="h-4 w-4" />
              Tổng tiền tôi nhận về tay (sau trả nợ)
            </p>
            <p className="mt-2 text-[36px] font-bold leading-none tracking-[-0.02em] tabular-nums">
              {formatVnd(m.takeHome)}
            </p>
            <p className="mt-2 text-[12px] text-white/75">
              Lợi nhuận {formatVnd(m.profitMine)} + vốn gốc {formatVnd(m.capitalBack)} + CF
              vay {formatVnd(m.loanCostsPaid)} − nợ a Trường{" "}
              {formatVnd(land.partnerPrincipal)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <div className="glass px-3.5 py-2.5">
              <p className="text-[11px] text-white/75">LN ròng khi bán</p>
              <p className="mt-0.5 text-[16px] font-bold tabular-nums">
                {formatVnd(m.netGain)}
              </p>
            </div>
            <div className="glass px-3.5 py-2.5">
              <p className="text-[11px] text-white/75">Tỉ lệ của tôi</p>
              <p className="mt-0.5 text-[16px] font-bold tabular-nums">
                {formatPct(m.ratioMine, 2)}
              </p>
            </div>
            <div className="glass px-3.5 py-2.5">
              <p className="text-[11px] text-white/75">Nợ NH còn lại</p>
              <p className="mt-0.5 text-[16px] font-bold tabular-nums">
                {formatVnd(m.loanTotal)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* I · Góp vốn */}
        <div className="card card-pad space-y-3">
          <div className="calc-section">I · Góp vốn mua đất (2021)</div>
          <Row label="Anh · Trường góp" badge="nhập">
            <MoneyCell
              value={land.capitalPartner}
              addStyle
              className="w-[160px] shrink-0"
              onCommit={(v) => patch({ capitalPartner: v ?? 0 })}
            />
          </Row>
          <Row label="Tôi · Thành góp" badge="nhập">
            <MoneyCell
              value={land.capitalMine}
              addStyle
              className="w-[160px] shrink-0"
              onCommit={(v) => patch({ capitalMine: v ?? 0 })}
            />
          </Row>
          <Row label="Tổng góp vốn" auto>
            <span className="calc-formula">{formatVnd(m.capitalTotal)}</span>
          </Row>
          <Row label="Tỉ lệ — a Trường / tôi" auto>
            <span className="calc-formula">
              {formatPct(m.ratioPartner, 2)} / {formatPct(m.ratioMine, 2)}
            </span>
          </Row>
        </div>

        {/* II · Khoản vay */}
        <div className="card card-pad space-y-3">
          <div className="calc-section">II · Khoản vay ngân hàng</div>
          <Row label="Tổng vay gốc ban đầu (2026)" badge="nhập">
            <MoneyCell
              value={land.loanTotalStart}
              addStyle
              className="w-[160px] shrink-0"
              onCommit={(v) => patch({ loanTotalStart: v ?? 0 })}
            />
          </Row>
          <Row label="Trả gốc mỗi tháng" badge="nhập">
            <MoneyCell
              value={land.loanMonthlyAmort}
              addStyle
              className="w-[160px] shrink-0"
              onCommit={(v) => patch({ loanMonthlyAmort: v ?? 0 })}
            />
          </Row>
          <Row label={`Đã trả ${m.monthsPaid} tháng → nợ còn lại`} auto>
            <span className="calc-formula">{formatVnd(m.loanTotal)}</span>
          </Row>
          <Row label="Phần vay của a Trường" badge="nhập">
            <MoneyCell
              value={land.loanPartner}
              addStyle
              className="w-[160px] shrink-0"
              onCommit={(v) => patch({ loanPartner: v ?? 0 })}
            />
          </Row>
          <Row label="Phần vay của tôi" badge="nhập">
            <MoneyCell
              value={land.loanMine}
              addStyle
              className="w-[160px] shrink-0"
              onCommit={(v) => patch({ loanMine: v ?? 0 })}
            />
          </Row>
        </div>

        {/* III · Lợi nhuận khi bán */}
        <div className="card card-pad space-y-3">
          <div className="calc-section">III · Tính lợi nhuận khi bán</div>
          <Row label="Giá bán đất tương lai" badge="nhập">
            <MoneyCell
              value={land.salePrice}
              addStyle
              className="w-[160px] shrink-0"
              onCommit={(v) => patch({ salePrice: v ?? 0 })}
            />
          </Row>
          <Row label="(–) CF vay đợt 1 · định giá 2021" badge="nhập">
            <MoneyCell
              value={land.loanCost1}
              addStyle
              className="w-[160px] shrink-0"
              onCommit={(v) => patch({ loanCost1: v ?? 0 })}
            />
          </Row>
          <Row label="(–) CF vay đợt 2 · định giá + BH + tất toán" badge="nhập">
            <MoneyCell
              value={land.loanCost2}
              addStyle
              className="w-[160px] shrink-0"
              onCommit={(v) => patch({ loanCost2: v ?? 0 })}
            />
          </Row>
          <Row label={`(–) Hoa hồng sale ${formatPct(land.saleCommissionPct)}`} auto>
            <span className="calc-formula">{formatVnd(m.commission)}</span>
          </Row>
          <Row label="Tổng chi phí" auto>
            <span className="calc-formula">{formatVnd(m.costTotal)}</span>
          </Row>
          <Row label="Chênh lệch giá đất (bán − mua)" auto>
            <span className="calc-value money-pos">{formatVnd(m.priceGain)}</span>
          </Row>
          <div
            className="flex items-center justify-between rounded-xl px-3 py-2.5"
            style={{ background: "var(--good-soft)" }}
          >
            <span className="text-[13px] font-bold">Lợi nhuận ròng sau chi phí</span>
            <span className="text-[17px] font-bold tabular-nums text-[var(--good)]">
              {formatVnd(m.netGain)}
            </span>
          </div>
        </div>

        {/* IV + V */}
        <div className="card card-pad space-y-3">
          <div className="calc-section">IV · Chia LN &amp; V · Quyết toán của tôi</div>
          <Row label={`A Trường được chia (${formatPct(m.ratioPartner, 2)})`} auto>
            <span className="calc-formula">{formatVnd(m.profitPartner)}</span>
          </Row>
          <Row label={`Tôi được chia (${formatPct(m.ratioMine, 2)})`} auto>
            <span className="calc-formula">{formatVnd(m.profitMine)}</span>
          </Row>
          <Row label="(+) Vốn gốc lấy lại (tổng góp − nợ NH)" auto>
            <span className="calc-formula">{formatVnd(m.capitalBack)}</span>
          </Row>
          <Row label="(+) CF vay tôi đã bỏ ra" auto>
            <span className="calc-formula">{formatVnd(m.loanCostsPaid)}</span>
          </Row>
          <Row label="(−) Gốc nhà a Trường (trả 2025)" badge="nhập">
            <MoneyCell
              value={land.partnerPrincipal}
              addStyle
              className="w-[160px] shrink-0"
              onCommit={(v) => patch({ partnerPrincipal: v ?? 0 })}
            />
          </Row>
          <div
            className="flex items-center justify-between rounded-xl px-3 py-3"
            style={{ background: "var(--brand-soft)" }}
          >
            <span className="flex items-center gap-1.5 text-[13px] font-bold">
              <TrendingUp className="h-4 w-4 text-[var(--brand)]" />
              Thực nhận về tay
            </span>
            <span className="text-[19px] font-bold tabular-nums text-[var(--brand)]">
              {formatVnd(m.takeHome)}
            </span>
          </div>
        </div>
      </div>

      <p className="text-[11.5px] text-[var(--ink-3)]">
        Ô <span className="badge-input">nhập</span> = số bạn tự điền · ô{" "}
        <span className="badge-auto">tự tính</span> = công thức, không sửa được
      </p>
    </div>
  );
}

function Row({
  label,
  badge,
  auto,
  children,
}: {
  label: string;
  badge?: string;
  auto?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="calc-row">
      <span className="calc-label">
        {label}{" "}
        {badge && <span className="badge-input">{badge}</span>}
        {auto && <span className="badge-auto">tự tính</span>}
      </span>
      {children}
    </div>
  );
}
