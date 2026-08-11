export const JOB_TYPES = ["AGENCY", "EVENT", "BLUESCOPE"] as const;
export type JobType = (typeof JOB_TYPES)[number];

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  AGENCY: "Agency / Production",
  EVENT: "Sự kiện quay",
  BLUESCOPE: "Bluescope",
};

export const DEFAULT_AGENCY_EXPENSES = [
  "Camop 1",
  "Camop 2",
  "Producer",
  "Catering",
  "Talent",
  "Edit / Post",
  "Thiết bị / khác",
] as const;

export function isJobType(v: unknown): v is JobType {
  return typeof v === "string" && (JOB_TYPES as readonly string[]).includes(v);
}
