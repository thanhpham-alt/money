import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const JOB_STATUS: Record<string, string> = {
  "Đang làm": "bg-orange-50 text-orange-700 border-orange-200",
  "Chờ thu": "bg-amber-50 text-amber-800 border-amber-200",
  "Đã xong": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Tạm dừng": "bg-slate-100 text-slate-600 border-slate-200",
};

const COLLECT: Record<string, string> = {
  "Đã thu": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Một phần": "bg-amber-50 text-amber-800 border-amber-200",
  "Chưa thu": "bg-red-50 text-red-700 border-red-200",
  "—": "bg-slate-50 text-slate-500 border-slate-200",
};

export function JobStatusBadge({ status }: { status: string }) {
  return (
    <Badge className={cn("border", JOB_STATUS[status] ?? "bg-slate-50 text-slate-600")}>
      {status}
    </Badge>
  );
}

export function CollectStatusBadge({ status }: { status: string }) {
  return (
    <Badge className={cn("border", COLLECT[status] ?? "bg-slate-50 text-slate-600")}>
      {status}
    </Badge>
  );
}
