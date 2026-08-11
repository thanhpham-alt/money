/**
 * Hằng số Bluescope — KHÔNG import prisma, để client component dùng được.
 * (lib/bluescope.ts là server-only vì có prisma.)
 */

export const EVENT_TYPES = [
  "ĐI TỈNH",
  "HCM",
  "EDIT",
  "PODCAST",
  "EVENT",
  "BRIEF KHÁC",
] as const;

export const DURATIONS = ["NỬA NGÀY", "CẢ NGÀY"] as const;

export const CONTENT_TYPES = [
  "Video",
  "Multi Image",
  "Podcast",
  "Interview",
  "Link Youtube",
  "Photo shooting",
] as const;

export const CHANNELS = ["EXTERNAL", "INTERNAL"] as const;

export const CHANNEL_LABELS: Record<string, string> = {
  EXTERNAL: "External Communication",
  INTERNAL: "Internal Communication",
};

export const JOB_STATUSES = ["Đang làm", "Chờ thu", "Đã xong", "Tạm dừng"] as const;
