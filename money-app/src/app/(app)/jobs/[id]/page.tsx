import { JobDetailView } from "@/features/jobs/job-detail-view";

type Props = { params: Promise<{ id: string }> };

export default async function JobDetailPage({ params }: Props) {
  const { id } = await params;
  return <JobDetailView id={id} />;
}
