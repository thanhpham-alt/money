import { Suspense } from "react";
import { JobsView } from "@/features/jobs/jobs-view";

export default function ProductionPage() {
  return (
    <Suspense fallback={<div className="page page-sub">Đang tải…</div>}>
      <JobsView />
    </Suspense>
  );
}
