import "server-only";

export interface ReminderPlanItem {
  reminderType: "days_7" | "days_3" | "days_1" | "due_today" | "overdue" | "escalation";
  scheduledFor: string;
  escalationLevel: number;
}

function addDays(base: Date, days: number): Date {
  const copy = new Date(base.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

export function buildReminderPlan(dueAtIso: string): ReminderPlanItem[] {
  const dueAt = new Date(dueAtIso);
  if (Number.isNaN(dueAt.getTime())) return [];

  const startOfDueDay = new Date(Date.UTC(dueAt.getUTCFullYear(), dueAt.getUTCMonth(), dueAt.getUTCDate(), 9, 0, 0));
  const plan: ReminderPlanItem[] = [
    { reminderType: "days_7", scheduledFor: addDays(startOfDueDay, -7).toISOString(), escalationLevel: 0 },
    { reminderType: "days_3", scheduledFor: addDays(startOfDueDay, -3).toISOString(), escalationLevel: 0 },
    { reminderType: "days_1", scheduledFor: addDays(startOfDueDay, -1).toISOString(), escalationLevel: 0 },
    { reminderType: "due_today", scheduledFor: startOfDueDay.toISOString(), escalationLevel: 0 },
    { reminderType: "overdue", scheduledFor: addDays(startOfDueDay, 1).toISOString(), escalationLevel: 1 },
    { reminderType: "escalation", scheduledFor: addDays(startOfDueDay, 3).toISOString(), escalationLevel: 2 },
  ];

  return plan;
}

export interface ReminderQueueInput {
  caseId: string;
  firmId: string;
  dueAt: string;
  taskId?: string;
  milestoneId?: string;
  metadata?: Record<string, unknown>;
}

export function materializeReminderQueueRows(input: ReminderQueueInput): Array<{
  caseId: string;
  firmId: string;
  taskId?: string;
  milestoneId?: string;
  reminderType: string;
  scheduledFor: string;
  dueAt: string;
  escalationLevel: number;
  metadata: Record<string, unknown>;
}> {
  return buildReminderPlan(input.dueAt).map((item) => ({
    caseId: input.caseId,
    firmId: input.firmId,
    taskId: input.taskId,
    milestoneId: input.milestoneId,
    reminderType: item.reminderType,
    scheduledFor: item.scheduledFor,
    dueAt: input.dueAt,
    escalationLevel: item.escalationLevel,
    metadata: input.metadata ?? {},
  }));
}
