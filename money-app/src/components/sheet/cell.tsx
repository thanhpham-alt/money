"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { parseMoneyInput } from "@/lib/utils";

/**
 * Ô nhập trong sheet. Commit khi blur hoặc Enter (không spam API mỗi keystroke).
 * Esc = huỷ, trả lại giá trị cũ.
 */

type Base = {
  className?: string;
  placeholder?: string;
  addStyle?: boolean;
};

function useDraft<T>(value: T) {
  const [draft, setDraft] = useState(value);
  // Server trả giá trị mới (sau reload) → đồng bộ lại ô
  useEffect(() => setDraft(value), [value]);
  return [draft, setDraft] as const;
}

export function TextCell({
  value,
  onCommit,
  className,
  placeholder,
  addStyle,
}: Base & {
  value: string | null;
  onCommit: (v: string | null) => void;
}) {
  const [draft, setDraft] = useDraft(value ?? "");

  function commit() {
    const next = draft.trim() || null;
    if (next !== (value ?? null)) onCommit(next);
  }

  return (
    <input
      className={cn("cell w-full", addStyle && "cell-add", className)}
      placeholder={placeholder}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          setDraft(value ?? "");
          e.currentTarget.blur();
        }
      }}
    />
  );
}

export function MoneyCell({
  value,
  onCommit,
  className,
  placeholder,
  addStyle,
  allowNull = false,
}: Base & {
  value: number | null;
  onCommit: (v: number | null) => void;
  /** true = ô rỗng lưu null (dùng cho Original/Final Cost "—") */
  allowNull?: boolean;
}) {
  const [draft, setDraft] = useDraft(
    value == null ? "" : new Intl.NumberFormat("vi-VN").format(value)
  );

  function commit() {
    const raw = draft.trim();
    const next = raw === "" ? (allowNull ? null : 0) : parseMoneyInput(raw);
    if (next !== value) onCommit(next);
    setDraft(next == null ? "" : new Intl.NumberFormat("vi-VN").format(next));
  }

  return (
    <input
      inputMode="numeric"
      className={cn("cell cell-num w-full", addStyle && "cell-add", className)}
      placeholder={placeholder ?? "0"}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onFocus={(e) => e.currentTarget.select()}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          setDraft(value == null ? "" : new Intl.NumberFormat("vi-VN").format(value));
          e.currentTarget.blur();
        }
      }}
    />
  );
}

export function NumCell({
  value,
  onCommit,
  className,
  placeholder,
  addStyle,
}: Base & {
  value: number | null;
  onCommit: (v: number) => void;
}) {
  const [draft, setDraft] = useDraft(value ? String(value) : "");

  function commit() {
    const next = draft.trim() === "" ? 0 : Math.trunc(Number(draft)) || 0;
    if (next !== (value ?? 0)) onCommit(next);
    setDraft(next ? String(next) : "");
  }

  return (
    <input
      inputMode="numeric"
      className={cn("cell cell-num w-full", addStyle && "cell-add", className)}
      placeholder={placeholder ?? "—"}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onFocus={(e) => e.currentTarget.select()}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          setDraft(value ? String(value) : "");
          e.currentTarget.blur();
        }
      }}
    />
  );
}

/** yyyy-MM-dd (giá trị gửi server), an toàn với null */
function toISO(v: string | Date | null): string {
  if (!v) return "";
  const d = typeof v === "string" ? new Date(v) : v;
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** dd/mm/yyyy để người dùng đọc & gõ */
function toDisplay(v: string | Date | null): string {
  const iso = toISO(v);
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/**
 * Hỗ trợ 2 cách gõ:
 *  · chỉ số     "26062026"  → tự chèn "/" theo 2-2-4
 *  · có sẵn "/" "5/6/2026"  → giữ nguyên, không ép 2 chữ số
 */
export function maskDate(raw: string): string {
  const s = raw.replace(/[^\d/]/g, "");
  const parts = s.split("/");

  if (parts.length === 1) {
    const n = parts[0].slice(0, 8);
    if (n.length <= 2) return n;
    if (n.length <= 4) return `${n.slice(0, 2)}/${n.slice(2)}`;
    return `${n.slice(0, 2)}/${n.slice(2, 4)}/${n.slice(4)}`;
  }

  return parts
    .slice(0, 3)
    .map((p, i) => p.slice(0, i === 2 ? 4 : 2))
    .join("/");
}

/**
 * dd/mm/yyyy → ISO. Trả null nếu chưa đủ/không hợp lệ.
 * Năm 2 số: 26 → 2026. Kiểm tra ngày thật (31/02 bị loại).
 */
export function parseDisplay(s: string): string | null {
  const t = s.trim();
  let d: number, m: number, y: number;

  if (t.includes("/")) {
    // "5/6/2026" · "05/06/26"
    const parts = t.split("/").map((x) => x.trim());
    if (parts.length !== 3 || parts.some((p) => p === "" || !/^\d+$/.test(p))) {
      return null;
    }
    d = Number(parts[0]);
    m = Number(parts[1]);
    y = parts[2].length <= 2 ? 2000 + Number(parts[2]) : Number(parts[2]);
  } else {
    // "26062026" · "260626"
    const n = t.replace(/\D/g, "");
    if (n.length !== 6 && n.length !== 8) return null;
    d = Number(n.slice(0, 2));
    m = Number(n.slice(2, 4));
    y = n.length === 6 ? 2000 + Number(n.slice(4, 6)) : Number(n.slice(4, 8));
  }

  if (d < 1 || d > 31 || m < 1 || m > 12 || y < 1900 || y > 2200) return null;
  const dt = new Date(y, m - 1, d);
  if (dt.getDate() !== d || dt.getMonth() !== m - 1) return null; // 31/02…
  const p = (x: number) => String(x).padStart(2, "0");
  return `${y}-${p(m)}-${p(d)}`;
}

/**
 * Ô ngày gõ tay: dd/mm/yyyy, tự chèn "/", commit khi blur/Enter.
 * Dễ nhập hơn <input type="date"> nhiều — không phải bấm từng ô.
 */
export function DateCell({
  value,
  onCommit,
  className,
  addStyle,
  placeholder,
}: Base & {
  value: string | Date | null;
  onCommit: (v: string | null) => void;
}) {
  const iso = toISO(value);
  const [draft, setDraft] = useDraft(toDisplay(value));
  const [bad, setBad] = useState(false);

  function commit() {
    const raw = draft.trim();
    if (raw === "") {
      setBad(false);
      if (iso) onCommit(null);
      return;
    }
    const next = parseDisplay(raw);
    if (!next) {
      setBad(true); // giữ nguyên chữ đang gõ để sửa, không xoá
      return;
    }
    setBad(false);
    setDraft(toDisplay(next));
    if (next !== iso) onCommit(next);
  }

  return (
    <input
      inputMode="numeric"
      placeholder={placeholder ?? "dd/mm/yyyy"}
      title="Gõ ngày kiểu 26/06/2026 — chỉ cần gõ số, dấu / tự thêm"
      className={cn(
        "cell w-full tabular-nums",
        addStyle && "cell-add",
        bad && "border-[var(--bad)] bg-[var(--bad-soft)]",
        className
      )}
      value={draft}
      onChange={(e) => {
        setDraft(maskDate(e.target.value));
        setBad(false);
      }}
      onFocus={(e) => e.currentTarget.select()}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          setDraft(toDisplay(value));
          setBad(false);
          e.currentTarget.blur();
        }
      }}
    />
  );
}
