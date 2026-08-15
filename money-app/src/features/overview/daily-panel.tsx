"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, Loader2, Plus, RefreshCw, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn, formatVnd } from "@/lib/utils";

type DailyExpense = {
  id: string;
  occurredAt: string;
  kind: "income" | "expense" | "job";
  amount: number;
  description: string;
  category: string;
  source: "manual" | "ocr";
  bankRef: string | null;
  bank: string | null;
  note: string | null;
};

type ApiResponse = {
  items: DailyExpense[];
  totals: { income: number; expense: number; job: number };
};

const KIND_LABELS: Record<DailyExpense["kind"], string> = {
  job: "Job linh tinh",
  income: "Đã thu",
  expense: "Đã chi",
};

const KIND_STYLES: Record<DailyExpense["kind"], string> = {
  job: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
  income: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  expense: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
};

const EMPTY_DRAFT = {
  occurredAt: new Date().toISOString().slice(0, 10),
  kind: "expense" as DailyExpense["kind"],
  amount: "",
  description: "",
  category: "khac",
  bank: "",
  note: "",
};

export function DailyPanel() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [draft, setDraft] = useState({ ...EMPTY_DRAFT });
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/daily-expenses");
      const json = (await res.json()) as ApiResponse;
      setData(json);
    } catch (e) {
      toast.error("Không tải được chi tiêu hằng ngày");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submitDraft(e?: React.FormEvent) {
    e?.preventDefault();
    if (!draft.description.trim() || !draft.amount) return;
    const res = await fetch("/api/daily-expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...draft,
        amount: Number(draft.amount) || 0,
      }),
    });
    if (!res.ok) {
      toast.error("Không lưu được");
      return;
    }
    setDraft({ ...EMPTY_DRAFT });
    void load();
  }

  async function remove(id: string) {
    if (!confirm("Xoá dòng này?")) return;
    const res = await fetch(`/api/daily-expenses?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Không xoá được");
      return;
    }
    void load();
  }

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Chỉ upload ảnh");
      return;
    }
    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      const ocrRes = await fetch("/api/daily-expenses/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
      });
      const ocrJson = await ocrRes.json();
      if (!ocrRes.ok) {
        toast.error(ocrJson.error || "OCR thất bại");
        return;
      }
      // Tự lưu ngay vào DB, không cần confirm
      const saveRes = await fetch("/api/daily-expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...ocrJson,
          source: "ocr",
        }),
      });
      if (!saveRes.ok) {
        toast.error("OCR OK nhưng không lưu được");
        return;
      }
      toast.success(
        `Đã trích xuất: ${formatVnd(ocrJson.amount)} · ${ocrJson.description}`
      );
      void load();
    } catch (e) {
      toast.error("Lỗi xử lý ảnh");
      console.error(e);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const grouped = useMemo(() => {
    if (!data?.items) return [] as { date: string; items: DailyExpense[] }[];
    const map = new Map<string, DailyExpense[]>();
    for (const it of data.items) {
      const day = it.occurredAt.slice(0, 10);
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(it);
    }
    return [...map.entries()]
      .map(([date, items]) => ({ date, items }))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [data]);

  return (
    <section className="card overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
        <div>
          <h2 className="section-title flex items-center gap-2">
            <Camera className="h-4 w-4 text-violet-500" />
            Hằng ngày
          </h2>
          <p className="text-[12px] text-[var(--ink-3)]">
            Job linh tinh · Đã thu · Đã chi — upload bill để OCR
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Đang OCR…
              </>
            ) : (
              <>
                <Upload className="h-3.5 w-3.5" />
                Upload bill (ảnh)
              </>
            )}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => void load()}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </header>

      {/* Totals */}
      {data && (
        <div className="grid gap-3 border-b border-[var(--line)] bg-[var(--bg)] px-4 py-3 sm:grid-cols-3">
          <TotalTile label="Job linh tinh" value={data.totals.job} tone="brand" />
          <TotalTile label="Đã thu" value={data.totals.income} tone="good" />
          <TotalTile label="Đã chi" value={data.totals.expense} tone="warn" />
        </div>
      )}

      {/* Quick add */}
      <form
        onSubmit={submitDraft}
        className="grid gap-2 border-b border-[var(--line)] bg-[var(--bg)] px-4 py-3 md:grid-cols-[110px_120px_130px_1fr_100px]"
      >
        <input
          type="date"
          className="cell cell-add"
          value={draft.occurredAt}
          onChange={(e) => setDraft({ ...draft, occurredAt: e.target.value })}
        />
        <select
          className="cell cell-add"
          value={draft.kind}
          onChange={(e) =>
            setDraft({ ...draft, kind: e.target.value as DailyExpense["kind"] })
          }
        >
          <option value="expense">Đã chi</option>
          <option value="income">Đã thu</option>
          <option value="job">Job linh tinh</option>
        </select>
        <input
          type="number"
          className="cell cell-add text-right tabular-nums"
          placeholder="Số tiền"
          value={draft.amount}
          onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
        />
        <input
          className="cell cell-add"
          placeholder="Mô tả (VD: cafe cùng khách, chuyển khoản TCB…)"
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
        />
        <Button
          type="submit"
          size="sm"
          disabled={!draft.description.trim() || !draft.amount}
        >
          <Plus className="h-3.5 w-3.5" />
          Thêm
        </Button>
      </form>

      {/* List */}
      <div className="max-h-[520px] overflow-auto">
        {loading && (
          <p className="px-4 py-8 text-center text-[13px] text-[var(--ink-3)]">
            Đang tải…
          </p>
        )}
        {!loading && grouped.length === 0 && (
          <p className="px-4 py-8 text-center text-[13px] text-[var(--ink-3)]">
            Chưa có ghi chép — upload bill hoặc thêm dòng ở trên
          </p>
        )}
        {grouped.map(({ date, items }) => (
          <div key={date} className="border-b border-[var(--line)] last:border-b-0">
            <p className="sticky top-0 bg-[var(--bg)] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-3)]">
              {new Date(date).toLocaleDateString("vi-VN", {
                weekday: "short",
                day: "2-digit",
                month: "2-digit",
              })}
            </p>
            {items.map((it) => (
              <div
                key={it.id}
                className="flex items-center gap-3 px-4 py-2 hover:bg-[var(--surface-2)]"
              >
                <span
                  className={cn(
                    "shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase",
                    KIND_STYLES[it.kind]
                  )}
                >
                  {KIND_LABELS[it.kind]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">{it.description}</p>
                  <p className="text-[11px] text-[var(--ink-3)]">
                    {it.bank && `${it.bank} · `}
                    {it.bankRef && `#${it.bankRef} · `}
                    {it.source === "ocr" ? "OCR" : "Nhập tay"}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 text-right text-[14px] font-bold tabular-nums",
                    it.kind === "income"
                      ? "text-emerald-600"
                      : it.kind === "expense"
                        ? "text-rose-600"
                        : "text-violet-600"
                  )}
                >
                  {it.kind === "expense" ? "−" : "+"}
                  {formatVnd(it.amount)}
                </span>
                <button
                  type="button"
                  className="row-del shrink-0"
                  onClick={() => void remove(it.id)}
                  aria-label="Xoá"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function TotalTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "good" | "warn" | "brand";
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
    <div className="rounded-xl px-3 py-2" style={{ background: bg }}>
      <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: fg }}>
        {label}
      </p>
      <p className="mt-0.5 text-[18px] font-bold tabular-nums" style={{ color: fg }}>
        {formatVnd(value)}
      </p>
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] || result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
