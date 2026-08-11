"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MetricCard } from "@/components/shared/metric-card";
import { formatVnd, parseMoneyInput } from "@/lib/utils";

type Debt = {
  id: string;
  key: string;
  label: string;
  principal: number;
  monthlyPayment: number;
  monthsPaid: number;
  amountPaid: number;
  remaining: number;
  notes: string | null;
};

type CardRow = {
  id: string;
  bank: string;
  principal: number;
};

export function DebtsView() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [cards, setCards] = useState<CardRow[]>([]);

  const load = useCallback(async () => {
    const res = await fetch("/api/debts");
    const data = await res.json();
    setDebts(data.debts ?? []);
    setCards(data.cards ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function patchDebt(id: string, patch: Record<string, unknown>) {
    await fetch("/api/debts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "debt", id, ...patch }),
    });
    toast.success("Đã cập nhật nợ");
    await load();
  }

  async function patchCard(id: string, patch: Record<string, unknown>) {
    await fetch("/api/debts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "card", id, ...patch }),
    });
    toast.success("Đã cập nhật thẻ");
    await load();
  }

  async function addCard() {
    await fetch("/api/debts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "card-create", bank: "Bank mới", principal: 0 }),
    });
    await load();
  }

  async function recordPayment(debtId: string, amount: number) {
    await fetch("/api/debts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "debt-payment", debtId, amount }),
    });
    toast.success("Đã ghi nhận thanh toán");
    await load();
  }

  const creditTotal = cards.reduce((s, c) => s + c.principal, 0);
  const debtTotal = debts.reduce((s, d) => s + d.remaining, 0);

  return (
    <div className="page space-y-4">
      <div>
        <h1 className="page-title">Nợ cá nhân &amp; tín dụng</h1>
        <p className="page-sub">MOM · a Trí · thẻ — Dashboard đọc tổng dư nợ</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard title="Tổng nợ cá nhân" value={formatVnd(debtTotal)} tone="danger" />
        <MetricCard title="Tổng thẻ tín dụng" value={formatVnd(creditTotal)} />
        <MetricCard
          title="Tổng phải trả"
          value={formatVnd(debtTotal + creditTotal)}
          tone="warn"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {debts.map((d) => (
          <Card key={d.id}>
            <CardHeader>
              <CardTitle>
                {d.label}{" "}
                <span className="ml-2 text-sm font-normal text-slate-400">({d.key})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1 text-sm">
                  <span className="text-slate-500">Nợ gốc</span>
                  <Input
                    className="input-money"
                    defaultValue={d.principal}
                    onBlur={(e) => {
                      const v = parseMoneyInput(e.target.value);
                      if (v !== d.principal) patchDebt(d.id, { principal: v });
                    }}
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="text-slate-500">Còn lại</span>
                  <Input className="input-money" value={d.remaining} readOnly />
                </label>
              </div>
              {d.key === "MOM" ? (
                <div className="grid grid-cols-2 gap-3">
                  <label className="grid gap-1 text-sm">
                    <span className="text-slate-500">Trả / tháng</span>
                    <Input
                      className="input-money"
                      defaultValue={d.monthlyPayment}
                      onBlur={(e) => {
                        const v = parseMoneyInput(e.target.value);
                        if (v !== d.monthlyPayment)
                          patchDebt(d.id, { monthlyPayment: v });
                      }}
                    />
                  </label>
                  <label className="grid gap-1 text-sm">
                    <span className="text-slate-500">Số tháng đã trả</span>
                    <Input
                      type="number"
                      defaultValue={d.monthsPaid}
                      onBlur={(e) => {
                        const v = Number(e.target.value) || 0;
                        if (v !== d.monthsPaid) patchDebt(d.id, { monthsPaid: v });
                      }}
                    />
                  </label>
                </div>
              ) : (
                <label className="grid gap-1 text-sm">
                  <span className="text-slate-500">Đã trả tích lũy</span>
                  <Input
                    className="input-money"
                    defaultValue={d.amountPaid}
                    onBlur={(e) => {
                      const v = parseMoneyInput(e.target.value);
                      if (v !== d.amountPaid) patchDebt(d.id, { amountPaid: v });
                    }}
                  />
                </label>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  recordPayment(
                    d.id,
                    d.key === "MOM" ? d.monthlyPayment || 0 : 1_000_000
                  )
                }
              >
                Ghi nhận 1 lần trả
                {d.key === "MOM" ? ` (${formatVnd(d.monthlyPayment)})` : ""}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Thẻ tín dụng</CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={addCard}>
            + Thẻ
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="table-wrap border-0">
            <table className="data-table min-w-[400px]">
              <thead>
                <tr>
                  <th>Ngân hàng</th>
                  <th className="text-right">Dư nợ gốc</th>
                </tr>
              </thead>
              <tbody>
                {cards.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Input
                        className="h-9 border-0 bg-transparent shadow-none"
                        defaultValue={c.bank}
                        onBlur={(e) => {
                          if (e.target.value !== c.bank)
                            patchCard(c.id, { bank: e.target.value });
                        }}
                      />
                    </td>
                    <td>
                      <Input
                        className="input-money h-9 border-0 bg-transparent shadow-none"
                        defaultValue={c.principal}
                        onBlur={(e) => {
                          const v = parseMoneyInput(e.target.value);
                          if (v !== c.principal) patchCard(c.id, { principal: v });
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-semibold dark:bg-[var(--surface-2)]">
                  <td>Tổng</td>
                  <td className="text-right tabular-nums">{formatVnd(creditTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
