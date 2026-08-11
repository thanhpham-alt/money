import { Suspense } from "react";
import { JobsView } from "@/features/jobs/jobs-view";

export default function JobsPage() {
  return (
    <Suspense fallback={<div className="page page-sub">Đang tải…</div>}>
      <JobsView />
    </Suspense>
  );
}
