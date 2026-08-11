"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { JOB_TYPE_LABELS, type JobType } from "@/lib/job-types";
import { parseMoneyInput } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function CreateJobModal({ open, onClose }: Props) {
  const router = useRouter();
  const [jobType, setJobType] = useState<JobType>("AGENCY");
  const [agency, setAgency] = useState("");
  const [name, setName] = useState("");
  const [contractTotal, setContractTotal] = useState("0");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function submit() {
    setLoading(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobType,
          agency:
            agency.trim() ||
            (jobType === "BLUESCOPE" ? "Bluescope" : undefined),
          name:
            name.trim() ||
            (jobType === "BLUESCOPE" ? "Booking production" : undefined),
          contractTotal: parseMoneyInput(contractTotal),
        }),
      });
      const data = await res.json();
      if (res.status === 409 && data.id) {
        toast.message("Đã có job Bluescope — mở job hiện có");
        onClose();
        router.push(jobType === "BLUESCOPE" ? "/bluescope" : `/jobs/${data.id}`);
        return;
      }
      if (!res.ok) throw new Error(data.error || "fail");
      toast.success("Đã tạo job");
      onClose();
      if (jobType === "BLUESCOPE") {
        router.push("/bluescope");
      } else {
        router.push(`/jobs/${data.id}`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tạo được job");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        aria-label="Đóng"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-stone-200 bg-white p-5 shadow-xl dark:border-[var(--border-default)] dark:bg-[var(--surface-1)]">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-[var(--text-primary)]">
          Thêm job
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Chọn loại — cùng khuôn P&amp;L cho mọi job
        </p>

        <div className="mt-4 grid gap-2">
          {(Object.keys(JOB_TYPE_LABELS) as JobType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setJobType(t)}
              className={cn(
                "rounded-md border px-3 py-2.5 text-left text-sm transition-colors",
                jobType === t
                  ? "border-orange-400 bg-orange-50 font-medium text-orange-800 dark:bg-[var(--accent-soft)]"
                  : "border-stone-200 hover:bg-stone-50 dark:border-[var(--border-default)] dark:hover:bg-[var(--surface-hover)]"
              )}
            >
              {JOB_TYPE_LABELS[t]}
              {t === "EVENT" && (
                <span className="mt-0.5 block text-xs font-normal text-slate-400">
                  Tùy chọn — form sự kiện (tên / brief) có thể mở rộng sau
                </span>
              )}
              {t === "BLUESCOPE" && (
                <span className="mt-0.5 block text-xs font-normal text-slate-400">
                  1 job duy nhất + public view cho khách
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3">
          <label className="grid gap-1 text-sm">
            <span className="text-slate-500">Agency</span>
            <Input
              placeholder={jobType === "BLUESCOPE" ? "Bluescope" : "VD: LG, Sun Group"}
              value={agency}
              onChange={(e) => setAgency(e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-500">Tên job</span>
            <Input
              placeholder="VD: LG Production"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-500">Tổng HĐ / Ngân sách</span>
            <Input
              className="input-money"
              value={contractTotal}
              onChange={(e) => setContractTotal(e.target.value)}
            />
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button type="button" onClick={submit} disabled={loading}>
            {loading ? "Đang tạo…" : "Tạo job"}
          </Button>
        </div>
      </div>
    </div>
  );
}
