import type { LifecycleStageKey } from "@/server/workflow/stage-registry";

export interface MockWorkflowMilestone {
  id: string;
  caseId: string;
  stageKey: LifecycleStageKey;
  stageOrder: number;
  status: "not_started" | "in_progress" | "completed" | "blocked" | "overdue";
  startedAt: string | null;
  completedAt: string | null;
  assignedUserId: string | null;
  notes: string | null;
  attachments: string[];
  durationMinutes: number | null;
  overdue: boolean;
  history: Array<{ at: string; actorId: string; from: string; to: string; reason: string | null }>;
}

export interface MockCaseTask {
  id: string;
  caseId: string;
  milestoneId: string | null;
  title: string;
  priority: "low" | "medium" | "high" | "urgent";
  dueAt: string | null;
  status: "open" | "in_progress" | "completed" | "cancelled";
  assignedTo: string | null;
  notes: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface MockTimelineEvent {
  id: string;
  caseId: string;
  actor: string;
  actorRole: string;
  eventKey: string;
  eventLabel: string;
  icon: string;
  createdAt: string;
  metadata: Record<string, unknown>;
}

export interface MockNotification {
  id: string;
  caseId: string | null;
  recipientId: string;
  channel: "email" | "whatsapp" | "in_app";
  status: "queued" | "sent" | "failed" | "dismissed" | "read";
  title: string;
  body: string;
  templateKey: string;
  createdAt: string;
  readAt: string | null;
}

export const mockWorkflowMilestones: MockWorkflowMilestone[] = [
  { id: "ms-1001-lead", caseId: "case_1001", stageKey: "lead", stageOrder: 1, status: "completed", startedAt: "2026-07-20T09:00:00Z", completedAt: "2026-07-20T10:00:00Z", assignedUserId: "u_priya", notes: null, attachments: [], durationMinutes: 60, overdue: false, history: [{ at: "2026-07-20T10:00:00Z", actorId: "u_priya", from: "in_progress", to: "completed", reason: null }] },
  { id: "ms-1001-consultation", caseId: "case_1001", stageKey: "consultation", stageOrder: 2, status: "completed", startedAt: "2026-07-21T09:00:00Z", completedAt: "2026-07-22T12:00:00Z", assignedUserId: "u_priya", notes: null, attachments: [], durationMinutes: 1620, overdue: false, history: [] },
  { id: "ms-1001-agreement", caseId: "case_1001", stageKey: "agreement_signed", stageOrder: 3, status: "completed", startedAt: "2026-07-23T09:00:00Z", completedAt: "2026-07-24T10:00:00Z", assignedUserId: "u_priya", notes: null, attachments: [], durationMinutes: 1500, overdue: false, history: [] },
  { id: "ms-1001-docs-requested", caseId: "case_1001", stageKey: "documents_requested", stageOrder: 4, status: "completed", startedAt: "2026-07-24T10:15:00Z", completedAt: "2026-07-25T11:00:00Z", assignedUserId: "u_olivia", notes: null, attachments: [], durationMinutes: 1485, overdue: false, history: [] },
  { id: "ms-1001-docs-received", caseId: "case_1001", stageKey: "documents_received", stageOrder: 5, status: "completed", startedAt: "2026-07-25T11:00:00Z", completedAt: "2026-07-30T14:00:00Z", assignedUserId: "u_olivia", notes: null, attachments: [], durationMinutes: 7380, overdue: false, history: [] },
  { id: "ms-1001-ai", caseId: "case_1001", stageKey: "ai_processing", stageOrder: 6, status: "completed", startedAt: "2026-07-30T14:00:00Z", completedAt: "2026-07-31T11:00:00Z", assignedUserId: "u_olivia", notes: null, attachments: [], durationMinutes: 1260, overdue: false, history: [] },
  { id: "ms-1001-review", caseId: "case_1001", stageKey: "consultant_review", stageOrder: 7, status: "in_progress", startedAt: "2026-07-31T11:00:00Z", completedAt: null, assignedUserId: "u_priya", notes: "Pending final quality review", attachments: [], durationMinutes: null, overdue: false, history: [] },
];

export const mockCaseTasks: MockCaseTask[] = [
  { id: "task-1", caseId: "case_1001", milestoneId: "ms-1001-review", title: "Review extraction", priority: "high", dueAt: "2026-08-07T16:00:00Z", status: "in_progress", assignedTo: "u_priya", notes: "Check employment dates", createdAt: "2026-08-05T09:00:00Z", completedAt: null },
  { id: "task-2", caseId: "case_1001", milestoneId: "ms-1001-review", title: "Approve forms", priority: "high", dueAt: "2026-08-08T16:00:00Z", status: "open", assignedTo: "u_priya", notes: null, createdAt: "2026-08-05T09:15:00Z", completedAt: null },
  { id: "task-3", caseId: "case_1002", milestoneId: null, title: "Upload missing passport", priority: "urgent", dueAt: "2026-08-06T16:00:00Z", status: "open", assignedTo: "u_daniel", notes: "Client follow-up required", createdAt: "2026-08-05T10:00:00Z", completedAt: null },
  { id: "task-4", caseId: "case_1002", milestoneId: null, title: "ADR follow-up", priority: "urgent", dueAt: "2026-08-06T18:00:00Z", status: "open", assignedTo: "u_priya", notes: "Send response package", createdAt: "2026-08-05T12:00:00Z", completedAt: null },
  { id: "task-5", caseId: "case_1003", milestoneId: null, title: "Medical follow-up", priority: "medium", dueAt: "2026-08-09T16:00:00Z", status: "open", assignedTo: "u_james", notes: null, createdAt: "2026-08-04T14:00:00Z", completedAt: null },
  { id: "task-6", caseId: "case_1007", milestoneId: null, title: "Close case", priority: "low", dueAt: null, status: "open", assignedTo: "u_priya", notes: "Awaiting COPR", createdAt: "2026-08-03T08:00:00Z", completedAt: null },
];

export const mockTimelineEvents: MockTimelineEvent[] = [
  { id: "te-1", caseId: "case_1001", actor: "Ananya Sharma", actorRole: "client", eventKey: "passport_uploaded", eventLabel: "Passport uploaded", icon: "upload", createdAt: "2026-08-01T10:00:00Z", metadata: {} },
  { id: "te-2", caseId: "case_1001", actor: "System", actorRole: "system", eventKey: "ocr_completed", eventLabel: "OCR completed", icon: "cpu", createdAt: "2026-08-01T10:30:00Z", metadata: {} },
  { id: "te-3", caseId: "case_1001", actor: "Priya Nair", actorRole: "practitioner", eventKey: "extraction_approved", eventLabel: "Extraction approved", icon: "shield-check", createdAt: "2026-08-04T15:10:00Z", metadata: {} },
  { id: "te-4", caseId: "case_1001", actor: "System", actorRole: "system", eventKey: "forms_generated", eventLabel: "Forms generated", icon: "file-text", createdAt: "2026-08-05T08:00:00Z", metadata: {} },
  { id: "te-5", caseId: "case_1001", actor: "Priya Nair", actorRole: "practitioner", eventKey: "forms_approved", eventLabel: "Forms approved", icon: "check-circle", createdAt: "2026-08-05T10:00:00Z", metadata: {} },
  { id: "te-6", caseId: "case_1003", actor: "James Whitfield", actorRole: "practitioner", eventKey: "application_submitted", eventLabel: "Application submitted", icon: "send", createdAt: "2026-08-03T12:00:00Z", metadata: {} },
  { id: "te-7", caseId: "case_1003", actor: "System", actorRole: "system", eventKey: "medical_received", eventLabel: "Medical received", icon: "heart-pulse", createdAt: "2026-08-04T08:40:00Z", metadata: {} },
  { id: "te-8", caseId: "case_1007", actor: "System", actorRole: "system", eventKey: "ppr_received", eventLabel: "PPR received", icon: "mail-open", createdAt: "2026-08-05T17:00:00Z", metadata: {} },
];

export const mockNotifications: MockNotification[] = [
  { id: "not-1", caseId: "case_1001", recipientId: "u_priya", channel: "in_app", status: "queued", title: "Forms ready", body: "Forms are ready for review in Sharma case.", templateKey: "forms_ready", createdAt: "2026-08-05T08:05:00Z", readAt: null },
  { id: "not-2", caseId: "case_1002", recipientId: "u_daniel", channel: "in_app", status: "queued", title: "Documents missing", body: "Missing passport document in Nguyen case.", templateKey: "documents_missing", createdAt: "2026-08-05T10:05:00Z", readAt: null },
  { id: "not-3", caseId: "case_1003", recipientId: "u_james", channel: "in_app", status: "sent", title: "Medical update", body: "Medical step updated for Okafor case.", templateKey: "medical", createdAt: "2026-08-04T08:45:00Z", readAt: "2026-08-04T09:10:00Z" },
  { id: "not-4", caseId: "case_1007", recipientId: "u_priya", channel: "in_app", status: "queued", title: "ADR urgent", body: "ADR received and urgent follow-up task created.", templateKey: "adr", createdAt: "2026-08-05T12:02:00Z", readAt: null },
];

export function currentStageForCase(caseId: string): LifecycleStageKey {
  const milestones = mockWorkflowMilestones.filter((item) => item.caseId === caseId).sort((a, b) => a.stageOrder - b.stageOrder);
  const active = milestones.find((item) => item.status === "in_progress" || item.status === "overdue");
  if (active) return active.stageKey;
  const latestCompleted = [...milestones].reverse().find((item) => item.status === "completed");
  return latestCompleted?.stageKey ?? "lead";
}
