"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export type RowTable = "rate" | "event" | "content" | "package" | "packageItem";

export type RateRow = {
  id: string;
  role: string;
  qty: number;
  halfDay: number;
  fullDay: number;
  note: string | null;
};

export type EventRow = {
  id: string;
  name: string;
  briefBy: string | null;
  deliverDate: string | null;
  brief: string | null;
  eventType: string | null;
  photographers: number;
  videographers: number;
  recapClips: number;
  duration: string | null;
  shootCost: number;
  editCost: number;
  discount: number;
  paidByUs: number;
  note: string | null;
  total: number;
};

export type PackageItemRow = {
  id: string;
  packageId: string;
  name: string;
  unit: string | null;
  qty: number;
  unitPrice: number;
  total: number;
};

export type PackageRow = {
  id: string;
  name: string;
  note: string | null;
  total: number;
  items: PackageItemRow[];
};

export type ContentRow = {
  id: string;
  channel: string;
  name: string;
  contentType: string | null;
  publishDate: string | null;
  originalCost: number | null;
  finalCost: number | null;
  scope: string | null;
};

export type BluescopeData = {
  job: {
    id: string;
    name: string;
    status: string;
    contractTotal: number;
    collected: number;
    publicVisible: boolean;
    notes: string | null;
  };
  budget: {
    budget: number;
    spent: number;
    remainingBudget: number;
    received: number;
    remainingReceivable: number;
    paidByUs: number;
    usedPct: number;
  };
  rates: RateRow[];
  events: EventRow[];
  packages: PackageRow[];
  contents: ContentRow[];
  publicPath: string;
};

const LIST_KEY: Record<RowTable, keyof BluescopeData | null> = {
  rate: "rates",
  event: "events",
  content: "contents",
  package: "packages",
  packageItem: null, // nằm lồng trong packages
};

export function useBluescope() {
  const [data, setData] = useState<BluescopeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  // Bỏ qua reload cũ về muộn hơn reload mới
  const reqId = useRef(0);

  const reload = useCallback(async () => {
    const id = ++reqId.current;
    const res = await fetch("/api/bluescope");
    const json = await res.json();
    if (id === reqId.current) setData(json);
  }, []);

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, [reload]);

  /** Sửa 1 ô: cập nhật local ngay, gọi API, rồi lấy số chuẩn từ server. */
  const patchRow = useCallback(
    async (table: RowTable, id: string, patch: Record<string, unknown>) => {
      setData((prev) => {
        if (!prev) return prev;
        const key = LIST_KEY[table];
        if (key === "packages" || table === "packageItem") {
          return {
            ...prev,
            packages: prev.packages.map((p) =>
              table === "package"
                ? p.id === id
                  ? { ...p, ...patch }
                  : p
                : {
                    ...p,
                    items: p.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
                  }
            ),
          };
        }
        if (!key) return prev;
        const list = prev[key] as unknown as { id: string }[];
        return {
          ...prev,
          [key]: list.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        } as BluescopeData;
      });

      setBusy(true);
      try {
        const res = await fetch("/api/bluescope/rows", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table, id, ...patch }),
        });
        if (!res.ok) throw new Error(await res.text());
        await reload();
      } catch {
        toast.error("Lưu thất bại — đã tải lại số cũ");
        await reload();
      } finally {
        setBusy(false);
      }
    },
    [reload]
  );

  const addRow = useCallback(
    async (table: RowTable, fields: Record<string, unknown> = {}) => {
      setBusy(true);
      try {
        const res = await fetch("/api/bluescope/rows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table, ...fields }),
        });
        if (!res.ok) throw new Error(await res.text());
        await reload();
        return true;
      } catch {
        toast.error("Thêm dòng thất bại");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [reload]
  );

  const deleteRow = useCallback(
    async (table: RowTable, id: string) => {
      setBusy(true);
      try {
        const res = await fetch(
          `/api/bluescope/rows?table=${table}&id=${encodeURIComponent(id)}`,
          { method: "DELETE" }
        );
        if (!res.ok) throw new Error(await res.text());
        await reload();
      } catch {
        toast.error("Xóa thất bại");
      } finally {
        setBusy(false);
      }
    },
    [reload]
  );

  const reorder = useCallback(
    async (table: RowTable, order: string[]) => {
      try {
        const res = await fetch("/api/bluescope/rows", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table, order }),
        });
        if (!res.ok) throw new Error(await res.text());
        await reload();
      } catch {
        toast.error("Sắp xếp thất bại");
        await reload();
      }
    },
    [reload]
  );

  const patchJob = useCallback(
    async (patch: Record<string, unknown>) => {
      setBusy(true);
      try {
        const res = await fetch("/api/bluescope", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!res.ok) throw new Error(await res.text());
        await reload();
      } catch {
        toast.error("Lưu ngân sách thất bại");
      } finally {
        setBusy(false);
      }
    },
    [reload]
  );

  return { data, loading, busy, reload, addRow, patchRow, deleteRow, reorder, patchJob };
}

/** Kéo-thả sắp xếp dòng bằng HTML5 drag, không cần thư viện. */
export function useRowDrag(
  ids: string[],
  onReorder: (order: string[]) => void | Promise<void>
) {
  const from = useRef<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  return {
    overId,
    rowProps(id: string) {
      return {
        draggable: true,
        onDragStart: (e: React.DragEvent) => {
          from.current = id;
          e.dataTransfer.effectAllowed = "move";
        },
        onDragOver: (e: React.DragEvent) => {
          e.preventDefault();
          if (from.current && from.current !== id) setOverId(id);
        },
        onDragLeave: () => setOverId((v) => (v === id ? null : v)),
        onDrop: (e: React.DragEvent) => {
          e.preventDefault();
          setOverId(null);
          const src = from.current;
          from.current = null;
          if (!src || src === id) return;
          const next = [...ids];
          const a = next.indexOf(src);
          const b = next.indexOf(id);
          if (a < 0 || b < 0) return;
          next.splice(b, 0, next.splice(a, 1)[0]);
          void onReorder(next);
        },
        onDragEnd: () => {
          from.current = null;
          setOverId(null);
        },
      };
    },
  };
}
