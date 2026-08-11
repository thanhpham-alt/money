"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatVnd, parseMoneyInput } from "@/lib/utils";

type Settings = {
  cashOnHand: number;
  invoiceFeeRate: number;
  aTanShareRate: number;
  bluescopeUrl: string;
};

export function SettingsView() {
  const [draft, setDraft] = useState<Settings | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/settings");
    const data = await res.json();
    setDraft(data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    if (!draft) return;
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    if (!res.ok) {
      toast.error("Lưu thất bại");
      return;
    }
    setDraft(await res.json());
    toast.success("Đã lưu cài đặt");
  }

  if (!draft) {
    return (
      <div className="page">
        <p className="page-sub">Đang tải…</p>
      </div>
    );
  }

  return (
    <div className="page space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Cài đặt</h1>
          <p className="page-sub">Tiền hiện có · % phí xuất HĐ · % chia A Tân</p>
        </div>
        <Button type="button" onClick={save}>
          Lưu
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tài chính chung</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <label className="grid gap-1 text-sm">
              <span className="text-slate-500">Tiền hiện có</span>
              <Input
                className="input-money"
                value={draft.cashOnHand}
                onChange={(e) =>
                  setDraft({ ...draft, cashOnHand: parseMoneyInput(e.target.value) })
                }
              />
              <span className="text-xs text-slate-400">
                Hiện tại: {formatVnd(draft.cashOnHand)}
              </span>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-500">Phí xuất HĐ (0.04 = 4%)</span>
              <Input
                type="number"
                step="0.01"
                value={draft.invoiceFeeRate}
                onChange={(e) =>
                  setDraft({ ...draft, invoiceFeeRate: Number(e.target.value) || 0 })
                }
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-500">A Tân share (0.2 = 20% LN)</span>
              <Input
                type="number"
                step="0.01"
                value={draft.aTanShareRate}
                onChange={(e) =>
                  setDraft({ ...draft, aTanShareRate: Number(e.target.value) || 0 })
                }
              />
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bluescope</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <p className="text-slate-600 dark:text-[var(--text-secondary)]">
              Bluescope đã build hẳn trong app — nhập trực tiếp, không còn link Google
              Sheets.
            </p>
            <ul className="grid gap-1.5 text-slate-500">
              <li>
                <strong>Ngân sách · Đã nhận</strong> — nhập ở đầu tab Bluescope
              </li>
              <li>
                <strong>Đã xài</strong> — tự tính từ bảng Booking
              </li>
              <li>
                <strong>Rate card · Gói báo giá · Content list</strong> — 4 tab trong
                module
              </li>
            </ul>
            <Link href="/bluescope">
              <Button type="button" variant="outline" size="sm">
                Mở module Bluescope →
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
