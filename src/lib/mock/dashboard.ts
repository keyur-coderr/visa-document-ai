/**
 * Realistic mock dashboard data for the Phase 1 UI foundation. Not
 * persisted, not fetched from any API — imported directly by pages.
 */

export interface KpiStat {
  id: string;
  label: string;
  value: string;
  delta: string;
  deltaTone: "up" | "down" | "flat";
}

export const dashboardKpis: KpiStat[] = [
  { id: "active-cases", label: "Active Cases", value: "38", delta: "+4 this month", deltaTone: "up" },
  { id: "pending-review", label: "Pending Review", value: "12", delta: "+2 since yesterday", deltaTone: "up" },
  { id: "open-flags", label: "Open Flags", value: "6", delta: "-3 this week", deltaTone: "down" },
  { id: "avg-turnaround", label: "Avg. Turnaround", value: "4.2 days", delta: "flat vs last month", deltaTone: "flat" },
];

export interface RecentActivityItem {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
}

export const recentActivity: RecentActivityItem[] = [
  {
    id: "act_1",
    actor: "Priya Nair, RCIC",
    action: "approved a classification result on",
    target: "Nguyen–Tremblay — Spousal Sponsorship (Inland)",
    timestamp: "2026-08-05T13:10:00Z",
  },
  {
    id: "act_2",
    actor: "System",
    action: "flagged an unexplained gap on",
    target: "Singh — Spousal Sponsorship (Outland)",
    timestamp: "2026-08-05T12:02:00Z",
  },
  {
    id: "act_3",
    actor: "James Whitfield, RCIC",
    action: "uploaded a document to",
    target: "Kowalski — Work Permit (LMIA-Based)",
    timestamp: "2026-08-05T11:41:00Z",
  },
  {
    id: "act_4",
    actor: "Ananya Sharma",
    action: "submitted intake responses for",
    target: "Sharma — Express Entry (FSWP)",
    timestamp: "2026-08-05T09:55:00Z",
  },
  {
    id: "act_5",
    actor: "Priya Nair, RCIC",
    action: "marked ready for submission:",
    target: "Okafor — Study Permit Renewal",
    timestamp: "2026-08-04T17:20:00Z",
  },
];

export interface AiProcessingSummary {
  queued: number;
  running: number;
  completedToday: number;
  failedToday: number;
}

export const aiProcessingSummary: AiProcessingSummary = {
  queued: 3,
  running: 2,
  completedToday: 17,
  failedToday: 1,
};

export interface DocumentStatSummary {
  totalDocuments: number;
  needsReview: number;
  approvedThisWeek: number;
  averageConfidence: number;
}

export const documentStatSummary: DocumentStatSummary = {
  totalDocuments: 214,
  needsReview: 9,
  approvedThisWeek: 31,
  averageConfidence: 0.84,
};
