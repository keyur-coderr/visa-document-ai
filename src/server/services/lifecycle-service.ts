import "server-only";

import { randomUUID } from "node:crypto";
import { isSupabaseEnabled } from "@/lib/env/supabase";
import { getCaseById, getClientById, getUserNameById, mockCaseRecords } from "@/lib/mock/case-management";
import {
  currentStageForCase,
  mockCaseTasks,
  mockNotifications,
  mockTimelineEvents,
  mockWorkflowMilestones,
} from "@/lib/mock/lifecycle";
import { safeLog } from "@/lib/security/safe-logger";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getAuthSession } from "@/server/auth/session";
import { getNotificationProvider } from "@/server/notifications/providers";
import { getNotificationTemplate, renderTemplate } from "@/server/notifications/templates";
import { materializeReminderQueueRows } from "@/server/notifications/reminder-scheduler";
import { getAutomationRulesForEvent } from "@/server/workflow/automation-rules";
import { DEFAULT_WORKFLOW_STAGES, getStageConfig, type LifecycleStageKey } from "@/server/workflow/stage-registry";

export interface CaseWorkflowStageView {
  key: LifecycleStageKey;
  name: string;
  order: number;
  icon: string;
  color: string;
  description: string;
  slaDays: number | null;
  status: "not_started" | "in_progress" | "completed" | "blocked" | "overdue";
  startedAt: string | null;
  completedAt: string | null;
  overdue: boolean;
  durationMinutes: number | null;
  assignedUserName: string;
  notes: string | null;
}

export interface CaseLifecycleWorkspace {
  caseId: string;
  caseTitle: string;
  streamKey: string;
  clientName: string;
  stages: CaseWorkflowStageView[];
  currentStage: LifecycleStageKey;
  completionPercent: number;
  estimatedCompletionDate: string | null;
  tasks: Array<{
    id: string;
    title: string;
    priority: string;
    dueAt: string | null;
    status: string;
    assignedTo: string;
    milestoneId: string | null;
  }>;
  timeline: Array<{
    id: string;
    actor: string;
    actorRole: string;
    eventKey: string;
    eventLabel: string;
    icon: string;
    createdAt: string;
  }>;
  notifications: Array<{
    id: string;
    title: string;
    body: string;
    status: string;
    createdAt: string;
  }>;
}

function assertLifecycleAccess(role: string | null) {
  if (role !== "practitioner" && role !== "assistant") throw new Error("forbidden");
}

function assertCanApprove(role: string | null) {
  if (role !== "practitioner") throw new Error("forbidden_practitioner");
}

function computeEstimatedCompletion(stages: CaseWorkflowStageView[]): string | null {
  const active = stages.find((item) => item.status === "in_progress" || item.status === "overdue");
  if (!active) return null;
  const activeIndex = stages.findIndex((item) => item.key === active.key);
  const remaining = stages.slice(activeIndex).reduce((sum, stage) => sum + (stage.slaDays ?? 0), 0);
  const estimate = new Date();
  estimate.setDate(estimate.getDate() + remaining);
  return estimate.toISOString();
}

function applyProgress(stages: CaseWorkflowStageView[]): number {
  if (stages.length === 0) return 0;
  const completed = stages.filter((item) => item.status === "completed").length;
  return Math.round((completed / stages.length) * 100);
}

export async function getCaseLifecycleWorkspace(caseId: string): Promise<CaseLifecycleWorkspace | null> {
  const session = await getAuthSession();
  assertLifecycleAccess(session.role);

  if (!isSupabaseEnabled()) {
    const caseRecord = getCaseById(caseId);
    if (!caseRecord) return null;
    const client = getClientById(caseRecord.clientId);

    const milestones = mockWorkflowMilestones.filter((item) => item.caseId === caseId);
    const stageViews = DEFAULT_WORKFLOW_STAGES.map((stage) => {
      const milestone = milestones.find((item) => item.stageKey === stage.key);
      return {
        key: stage.key,
        name: stage.name,
        order: stage.displayOrder,
        icon: stage.icon,
        color: stage.color,
        description: stage.description,
        slaDays: stage.slaDays,
        status: milestone?.status ?? "not_started",
        startedAt: milestone?.startedAt ?? null,
        completedAt: milestone?.completedAt ?? null,
        overdue: milestone?.overdue ?? false,
        durationMinutes: milestone?.durationMinutes ?? null,
        assignedUserName: getUserNameById(milestone?.assignedUserId ?? null),
        notes: milestone?.notes ?? null,
      };
    });

    const tasks = mockCaseTasks
      .filter((item) => item.caseId === caseId)
      .sort((a, b) => (a.dueAt ?? "9999").localeCompare(b.dueAt ?? "9999"))
      .map((item) => ({
        id: item.id,
        title: item.title,
        priority: item.priority,
        dueAt: item.dueAt,
        status: item.status,
        assignedTo: getUserNameById(item.assignedTo),
        milestoneId: item.milestoneId,
      }));

    const timeline = mockTimelineEvents
      .filter((item) => item.caseId === caseId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((item) => ({
        id: item.id,
        actor: item.actor,
        actorRole: item.actorRole,
        eventKey: item.eventKey,
        eventLabel: item.eventLabel,
        icon: item.icon,
        createdAt: item.createdAt,
      }));

    const notifications = mockNotifications
      .filter((item) => item.caseId === caseId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((item) => ({
        id: item.id,
        title: item.title,
        body: item.body,
        status: item.status,
        createdAt: item.createdAt,
      }));

    const currentStage = currentStageForCase(caseId);
    return {
      caseId,
      caseTitle: caseRecord.title,
      streamKey: caseRecord.streamKey,
      clientName: client?.legalName ?? "Client",
      stages: stageViews,
      currentStage,
      completionPercent: applyProgress(stageViews),
      estimatedCompletionDate: computeEstimatedCompletion(stageViews),
      tasks,
      timeline,
      notifications,
    };
  }

  const client = getSupabaseServerClient();
  if (!client) return null;

  const { data: caseRecord } = await client
    .from("cases")
    .select("id, title, stream_key, client_id")
    .eq("id", caseId)
    .maybeSingle();
  if (!caseRecord) return null;

  const [{ data: clientRow }, { data: milestones }, { data: tasks }, { data: timeline }, { data: notifications }] = await Promise.all([
    client.from("clients").select("id, legal_name").eq("id", (caseRecord as any).client_id).maybeSingle(),
    client
      .from("case_workflow_milestones")
      .select("id, stage_key, stage_order, status, started_at, completed_at, assigned_user_id, notes, duration_minutes, overdue")
      .eq("case_id", caseId)
      .order("stage_order", { ascending: true }),
    client
      .from("case_tasks")
      .select("id, milestone_id, title, priority, due_at, status, assigned_to")
      .eq("case_id", caseId)
      .order("created_at", { ascending: false }),
    client
      .from("case_timeline_events")
      .select("id, actor_role, event_key, event_label, icon, created_at, actor_id")
      .eq("case_id", caseId)
      .order("created_at", { ascending: false })
      .limit(100),
    client
      .from("notifications")
      .select("id, title, body, status, created_at")
      .eq("case_id", caseId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const stageViews = DEFAULT_WORKFLOW_STAGES.map((stage) => {
    const milestone = (milestones ?? []).find((item: any) => item.stage_key === stage.key);
    return {
      key: stage.key,
      name: stage.name,
      order: stage.displayOrder,
      icon: stage.icon,
      color: stage.color,
      description: stage.description,
      slaDays: stage.slaDays,
      status: (milestone?.status ?? "not_started") as CaseWorkflowStageView["status"],
      startedAt: milestone?.started_at ?? null,
      completedAt: milestone?.completed_at ?? null,
      overdue: Boolean(milestone?.overdue),
      durationMinutes: milestone?.duration_minutes ?? null,
      assignedUserName: getUserNameById(milestone?.assigned_user_id ?? null),
      notes: milestone?.notes ?? null,
    };
  });

  const current = stageViews.find((item) => item.status === "in_progress" || item.status === "overdue")?.key
    ?? [...stageViews].reverse().find((item) => item.status === "completed")?.key
    ?? "lead";

  return {
    caseId,
    caseTitle: (caseRecord as any).title,
    streamKey: (caseRecord as any).stream_key,
    clientName: (clientRow as any)?.legal_name ?? "Client",
    stages: stageViews,
    currentStage: current,
    completionPercent: applyProgress(stageViews),
    estimatedCompletionDate: computeEstimatedCompletion(stageViews),
    tasks: (tasks ?? []).map((item: any) => ({
      id: item.id,
      title: item.title,
      priority: item.priority,
      dueAt: item.due_at,
      status: item.status,
      assignedTo: getUserNameById(item.assigned_to ?? null),
      milestoneId: item.milestone_id,
    })),
    timeline: (timeline ?? []).map((item: any) => ({
      id: item.id,
      actor: item.actor_id ?? "System",
      actorRole: item.actor_role,
      eventKey: item.event_key,
      eventLabel: item.event_label,
      icon: item.icon ?? "dot",
      createdAt: item.created_at,
    })),
    notifications: (notifications ?? []).map((item: any) => ({
      id: item.id,
      title: item.title,
      body: item.body,
      status: item.status,
      createdAt: item.created_at,
    })),
  };
}

export async function transitionCaseWorkflowStage(input: { caseId: string; stageKey: LifecycleStageKey; reason?: string | null }) {
  const session = await getAuthSession();
  assertLifecycleAccess(session.role);
  if (!session.userId) return { ok: false, error: "Session unavailable." };

  if (!isSupabaseEnabled()) {
    const caseRecord = getCaseById(input.caseId);
    if (!caseRecord) return { ok: false, error: "Case not found." };

    const stage = getStageConfig(input.stageKey);
    if (!stage) return { ok: false, error: "Stage not found." };

    const now = new Date().toISOString();
    const existing = mockWorkflowMilestones.find((item) => item.caseId === input.caseId && item.stageKey === input.stageKey);
    if (existing) {
      const prev = existing.status;
      existing.status = "in_progress";
      existing.startedAt = existing.startedAt ?? now;
      existing.history.push({ at: now, actorId: session.userId, from: prev, to: "in_progress", reason: input.reason ?? null });
    } else {
      mockWorkflowMilestones.push({
        id: `ms-${randomUUID()}`,
        caseId: input.caseId,
        stageKey: input.stageKey,
        stageOrder: stage.displayOrder,
        status: "in_progress",
        startedAt: now,
        completedAt: null,
        assignedUserId: session.userId,
        notes: input.reason ?? null,
        attachments: [],
        durationMinutes: null,
        overdue: false,
        history: [{ at: now, actorId: session.userId, from: "not_started", to: "in_progress", reason: input.reason ?? null }],
      });
    }

    mockTimelineEvents.unshift({
      id: `te-${randomUUID()}`,
      caseId: input.caseId,
      actor: getUserNameById(session.userId),
      actorRole: session.role ?? "practitioner",
      eventKey: "workflow_stage_transition",
      eventLabel: `Stage moved to ${stage.name}`,
      icon: stage.icon,
      createdAt: now,
      metadata: { stageKey: input.stageKey, reason: input.reason ?? null },
    });

    await triggerWorkflowAutomation({ caseId: input.caseId, eventKey: "stage_transitioned", context: { stageKey: input.stageKey, reason: input.reason ?? null } });
    return { ok: true };
  }

  const client = getSupabaseServerClient();
  if (!client) return { ok: false, error: "Service unavailable." };

  const stage = getStageConfig(input.stageKey);
  if (!stage) return { ok: false, error: "Stage not found." };

  const { data: caseRow } = await client
    .from("cases")
    .select("id, firm_id")
    .eq("id", input.caseId)
    .maybeSingle();
  if (!caseRow) return { ok: false, error: "Case not found." };

  const now = new Date().toISOString();
  await client.from("case_workflow_milestones").upsert({
    firm_id: (caseRow as any).firm_id,
    case_id: input.caseId,
    stage_key: input.stageKey,
    stage_order: stage.displayOrder,
    status: "in_progress",
    started_at: now,
    assigned_user_id: session.userId,
    notes: input.reason ?? null,
    history: [{ at: now, actorId: session.userId, to: "in_progress", reason: input.reason ?? null }],
    created_by: session.userId,
  }, { onConflict: "case_id,stage_key" });

  await client.from("case_timeline_events").insert({
    firm_id: (caseRow as any).firm_id,
    case_id: input.caseId,
    actor_id: session.userId,
    actor_role: session.role,
    event_key: "workflow_stage_transition",
    event_label: `Stage moved to ${stage.name}`,
    icon: stage.icon,
    metadata: { stageKey: input.stageKey, reason: input.reason ?? null },
  });

  await client.from("audit_events").insert({
    firm_id: (caseRow as any).firm_id,
    case_id: input.caseId,
    actor_id: session.userId,
    actor_role: session.role,
    action: "workflow_stage_transition",
    entity_type: "case_workflow_milestone",
    entity_id: input.stageKey,
    metadata: {
      oldValue: null,
      newValue: "in_progress",
      reason: input.reason ?? null,
      stageKey: input.stageKey,
    },
  });

  await triggerWorkflowAutomation({ caseId: input.caseId, eventKey: "stage_transitioned", context: { stageKey: input.stageKey, reason: input.reason ?? null } });
  return { ok: true };
}

export async function createCaseTask(input: {
  caseId: string;
  milestoneId?: string | null;
  title: string;
  priority: "low" | "medium" | "high" | "urgent";
  dueAt?: string | null;
  note?: string | null;
}) {
  const session = await getAuthSession();
  assertLifecycleAccess(session.role);
  if (!session.userId) return { ok: false, error: "Session unavailable." };

  if (!input.title.trim()) return { ok: false, error: "Task title is required." };

  if (!isSupabaseEnabled()) {
    const taskId = `task-${randomUUID()}`;
    const now = new Date().toISOString();
    mockCaseTasks.push({
      id: taskId,
      caseId: input.caseId,
      milestoneId: input.milestoneId ?? null,
      title: input.title.trim(),
      priority: input.priority,
      dueAt: input.dueAt ?? null,
      status: "open",
      assignedTo: session.userId,
      notes: input.note ?? null,
      createdAt: now,
      completedAt: null,
    });

    if (input.dueAt) {
      const reminderRows = materializeReminderQueueRows({
        caseId: input.caseId,
        firmId: "mock-firm",
        taskId,
        dueAt: input.dueAt,
        metadata: { title: input.title },
      });
      safeLog("mock_task_reminders_planned", { caseId: input.caseId, count: reminderRows.length });
    }

    mockTimelineEvents.unshift({
      id: `te-${randomUUID()}`,
      caseId: input.caseId,
      actor: getUserNameById(session.userId),
      actorRole: session.role ?? "assistant",
      eventKey: "task_created",
      eventLabel: `Task created: ${input.title}`,
      icon: "check-square",
      createdAt: now,
      metadata: { priority: input.priority },
    });

    return { ok: true, taskId };
  }

  const client = getSupabaseServerClient();
  if (!client) return { ok: false, error: "Service unavailable." };
  const { data: caseRow } = await client.from("cases").select("id, firm_id").eq("id", input.caseId).maybeSingle();
  if (!caseRow) return { ok: false, error: "Case unavailable." };

  const { data: taskRow } = await client
    .from("case_tasks")
    .insert({
      firm_id: (caseRow as any).firm_id,
      case_id: input.caseId,
      milestone_id: input.milestoneId ?? null,
      title: input.title.trim(),
      priority: input.priority,
      due_at: input.dueAt ?? null,
      status: "open",
      assigned_to: session.userId,
      notes: input.note ?? null,
      created_by: session.userId,
    })
    .select("id")
    .single();

  const taskId = (taskRow as any)?.id;

  if (taskId && input.dueAt) {
    const reminderRows = materializeReminderQueueRows({
      caseId: input.caseId,
      firmId: (caseRow as any).firm_id,
      taskId,
      dueAt: input.dueAt,
      metadata: { title: input.title.trim() },
    });
    for (const row of reminderRows) {
      await client.from("reminder_queue").insert({
        firm_id: row.firmId,
        case_id: row.caseId,
        task_id: row.taskId,
        reminder_type: row.reminderType,
        escalation_level: row.escalationLevel,
        status: "queued",
        due_at: row.dueAt,
        scheduled_for: row.scheduledFor,
        metadata: row.metadata,
      });
    }
  }

  await client.from("case_timeline_events").insert({
    firm_id: (caseRow as any).firm_id,
    case_id: input.caseId,
    actor_id: session.userId,
    actor_role: session.role,
    event_key: "task_created",
    event_label: `Task created: ${input.title.trim()}`,
    icon: "check-square",
    metadata: { priority: input.priority },
  });

  await client.from("audit_events").insert({
    firm_id: (caseRow as any).firm_id,
    case_id: input.caseId,
    actor_id: session.userId,
    actor_role: session.role,
    action: "case_task_created",
    entity_type: "case_task",
    entity_id: taskId ?? "unknown",
    metadata: {
      oldValue: null,
      newValue: { title: input.title.trim(), priority: input.priority, dueAt: input.dueAt ?? null },
      reason: input.note ?? null,
    },
  });

  return { ok: true, taskId };
}

export async function completeCaseTask(input: { caseId: string; taskId: string; reason?: string | null }) {
  const session = await getAuthSession();
  assertLifecycleAccess(session.role);
  if (!session.userId) return { ok: false, error: "Session unavailable." };

  if (!isSupabaseEnabled()) {
    const task = mockCaseTasks.find((item) => item.id === input.taskId && item.caseId === input.caseId);
    if (!task) return { ok: false, error: "Task not found." };
    const now = new Date().toISOString();
    task.status = "completed";
    task.completedAt = now;

    mockTimelineEvents.unshift({
      id: `te-${randomUUID()}`,
      caseId: input.caseId,
      actor: getUserNameById(session.userId),
      actorRole: session.role ?? "assistant",
      eventKey: "task_completed",
      eventLabel: `Task completed: ${task.title}`,
      icon: "check-circle",
      createdAt: now,
      metadata: { reason: input.reason ?? null },
    });

    return { ok: true };
  }

  const client = getSupabaseServerClient();
  if (!client) return { ok: false, error: "Service unavailable." };

  const { data: caseRow } = await client.from("cases").select("id, firm_id").eq("id", input.caseId).maybeSingle();
  if (!caseRow) return { ok: false, error: "Case unavailable." };

  const now = new Date().toISOString();
  await client
    .from("case_tasks")
    .update({ status: "completed", completed_by: session.userId, completed_at: now, updated_at: now })
    .eq("id", input.taskId)
    .eq("case_id", input.caseId);

  await client.from("case_timeline_events").insert({
    firm_id: (caseRow as any).firm_id,
    case_id: input.caseId,
    actor_id: session.userId,
    actor_role: session.role,
    event_key: "task_completed",
    event_label: "Task completed",
    icon: "check-circle",
    metadata: { taskId: input.taskId, reason: input.reason ?? null },
  });

  await client.from("audit_events").insert({
    firm_id: (caseRow as any).firm_id,
    case_id: input.caseId,
    actor_id: session.userId,
    actor_role: session.role,
    action: "case_task_completed",
    entity_type: "case_task",
    entity_id: input.taskId,
    metadata: {
      oldValue: "open|in_progress",
      newValue: "completed",
      reason: input.reason ?? null,
    },
  });

  return { ok: true };
}

export async function triggerWorkflowAutomation(input: { caseId: string; eventKey: string; context: Record<string, unknown> }) {
  const session = await getAuthSession();
  assertLifecycleAccess(session.role);

  const rules = getAutomationRulesForEvent(input.eventKey);
  if (rules.length === 0) return { ok: true, applied: 0 };

  let applied = 0;
  for (const rule of rules) {
    applied += 1;
    if (rule.actionKey === "create_milestone") {
      const stageKey = String(rule.actionPayload.stageKey ?? "");
      if (stageKey) {
        await transitionCaseWorkflowStage({ caseId: input.caseId, stageKey: stageKey as LifecycleStageKey, reason: `automation:${rule.id}` });
      }
    }

    if (rule.actionKey === "create_urgent_task") {
      await createCaseTask({
        caseId: input.caseId,
        title: String(rule.actionPayload.title ?? "Urgent follow-up"),
        priority: "urgent",
        dueAt: new Date(Date.now() + Number(rule.actionPayload.dueDays ?? 2) * 24 * 60 * 60 * 1000).toISOString(),
        note: `Automation rule: ${rule.id}`,
      });
    }

    if (rule.actionKey === "notify_client") {
      const templateKey = String(rule.actionPayload.templateKey ?? "reminder");
      await sendLifecycleNotification({ caseId: input.caseId, templateKey, recipientRole: "client", variables: {} });
    }

    if (rule.actionKey === "start_ocr") {
      safeLog("automation_start_ocr_requested", { caseId: input.caseId, eventKey: input.eventKey });
    }

    if (rule.actionKey === "enable_pdf_generation") {
      safeLog("automation_enable_pdf_generation", { caseId: input.caseId, eventKey: input.eventKey });
    }

    if (rule.actionKey === "enable_submission") {
      safeLog("automation_enable_submission", { caseId: input.caseId, eventKey: input.eventKey });
    }
  }

  return { ok: true, applied };
}

async function sendLifecycleNotification(input: {
  caseId: string;
  templateKey: string;
  recipientRole: "client" | "assistant" | "practitioner";
  variables: Record<string, string>;
}) {
  const session = await getAuthSession();
  assertLifecycleAccess(session.role);

  const caseRecord = getCaseById(input.caseId);
  const caseTitle = caseRecord?.title ?? "Case";
  const template = getNotificationTemplate((input.templateKey as any) ?? "reminder") ?? getNotificationTemplate("reminder");
  if (!template) return { ok: false, error: "Template not found." };

  const rendered = renderTemplate(template, { caseTitle, ...input.variables });
  const provider = getNotificationProvider(template.channel);

  if (!isSupabaseEnabled()) {
    let recipientId = "u_priya";
    if (input.recipientRole === "assistant") recipientId = caseRecord?.assignedAssistantId ?? "u_olivia";
    if (input.recipientRole === "client") recipientId = caseRecord?.clientId ?? "client_001";

    const now = new Date().toISOString();
    const dedupeKey = `${input.caseId}:${template.key}:${new Date(now).toISOString().slice(0, 16)}`;
    if (mockNotifications.some((item) => `${item.caseId}:${item.templateKey}:${item.createdAt.slice(0, 16)}` === dedupeKey)) {
      return { ok: true, deduped: true };
    }

    const dispatch = await provider.send({
      channel: template.channel,
      recipientId,
      title: rendered.subject,
      body: rendered.body,
      metadata: { templateKey: template.key },
    });

    mockNotifications.unshift({
      id: `not-${randomUUID()}`,
      caseId: input.caseId,
      recipientId,
      channel: template.channel,
      status: dispatch.success ? "sent" : "failed",
      title: rendered.subject,
      body: rendered.body,
      templateKey: template.key,
      createdAt: now,
      readAt: null,
    });

    return { ok: true, deduped: false };
  }

  const client = getSupabaseServerClient();
  if (!client || !session.userId) return { ok: false, error: "Service unavailable." };

  const { data: caseRow } = await client
    .from("cases")
    .select("id, firm_id, client_id, assigned_practitioner_id")
    .eq("id", input.caseId)
    .maybeSingle();
  if (!caseRow) return { ok: false, error: "Case unavailable." };

  let recipientId: string | null = null;
  if (input.recipientRole === "client") {
    const { data: profile } = await client.from("profiles").select("id").eq("client_id", (caseRow as any).client_id).maybeSingle();
    recipientId = (profile as any)?.id ?? null;
  }
  if (input.recipientRole === "practitioner") {
    recipientId = (caseRow as any).assigned_practitioner_id ?? null;
  }
  if (input.recipientRole === "assistant") {
    const { data: assignment } = await client
      .from("case_assignments")
      .select("user_id")
      .eq("case_id", input.caseId)
      .eq("role", "assistant")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    recipientId = (assignment as any)?.user_id ?? null;
  }
  if (!recipientId) return { ok: false, error: "Recipient unavailable." };

  const now = new Date().toISOString();
  const dedupeKey = `${input.caseId}:${template.key}:${now.slice(0, 16)}`;
  const { data: existing } = await client.from("notifications").select("id").eq("dedupe_key", dedupeKey).maybeSingle();
  if (existing) return { ok: true, deduped: true };

  const notificationInsert = await client
    .from("notifications")
    .insert({
      firm_id: (caseRow as any).firm_id,
      case_id: input.caseId,
      recipient_id: recipientId,
      channel: template.channel,
      status: "queued",
      title: rendered.subject,
      body: rendered.body,
      template_key: template.key,
      dedupe_key: dedupeKey,
      metadata: { templateKey: template.key },
      scheduled_for: now,
      created_by: session.userId,
    })
    .select("id")
    .single();

  const notificationId = (notificationInsert.data as any)?.id;
  const dispatch = await provider.send({
    channel: template.channel,
    recipientId,
    title: rendered.subject,
    body: rendered.body,
    metadata: { caseId: input.caseId, templateKey: template.key },
  });

  await client
    .from("notifications")
    .update({
      status: dispatch.success ? "sent" : "failed",
      sent_at: dispatch.success ? now : null,
      updated_at: now,
    })
    .eq("id", notificationId);

  await client.from("notification_deliveries").insert({
    notification_id: notificationId,
    provider_name: dispatch.providerName,
    provider_message_id: dispatch.externalId ?? null,
    status: dispatch.success ? "sent" : "failed",
    error_message: dispatch.errorMessage ?? null,
    metadata: {},
  });

  return { ok: true, deduped: false };
}

export async function markNotificationRead(notificationId: string) {
  const session = await getAuthSession();
  if (!session.userId) return { ok: false, error: "Session unavailable." };

  if (!isSupabaseEnabled()) {
    const row = mockNotifications.find((item) => item.id === notificationId);
    if (!row) return { ok: false, error: "Notification not found." };
    row.status = "read";
    row.readAt = new Date().toISOString();
    return { ok: true };
  }

  const client = getSupabaseServerClient();
  if (!client) return { ok: false, error: "Service unavailable." };

  await client
    .from("notifications")
    .update({ status: "read", read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("recipient_id", session.userId);

  return { ok: true };
}

export async function listDashboardLifecycleWidgets() {
  const session = await getAuthSession();
  assertLifecycleAccess(session.role);

  if (!isSupabaseEnabled()) {
    const now = Date.now();
    const overdueTasks = mockCaseTasks.filter((task) => task.status !== "completed" && task.dueAt && new Date(task.dueAt).getTime() < now);
    const upcomingDeadlines = mockCaseTasks
      .filter((task) => task.status !== "completed" && task.dueAt)
      .sort((a, b) => new Date(a.dueAt ?? "9999").getTime() - new Date(b.dueAt ?? "9999").getTime())
      .slice(0, 5);

    const waitingForClient = mockCaseTasks.filter((task) => task.title.toLowerCase().includes("upload") || task.title.toLowerCase().includes("client")).length;
    const waitingForConsultant = mockCaseTasks.filter((task) => task.assignedTo === "u_priya" || task.assignedTo === "u_james").length;
    const recentCases = [...mockCaseRecords]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
      .map((item) => ({ caseId: item.id, title: item.title, updatedAt: item.updatedAt }));

    const todayKey = new Date().toISOString().slice(0, 10);
    const todaysReminders = mockCaseTasks.filter((task) => task.dueAt?.slice(0, 10) === todayKey).length;

    return {
      upcomingDeadlines: upcomingDeadlines.map((task) => ({ id: task.id, title: task.title, dueAt: task.dueAt, priority: task.priority })),
      todaysReminders,
      overdueTasks: overdueTasks.map((task) => ({ id: task.id, title: task.title, dueAt: task.dueAt, priority: task.priority })),
      waitingForClient,
      waitingForConsultant,
      recentlyUpdatedCases: recentCases,
      recentNotifications: mockNotifications
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 6)
        .map((item) => ({ id: item.id, title: item.title, status: item.status, createdAt: item.createdAt })),
    };
  }

  const client = getSupabaseServerClient();
  if (!client) {
    return {
      upcomingDeadlines: [],
      todaysReminders: 0,
      overdueTasks: [],
      waitingForClient: 0,
      waitingForConsultant: 0,
      recentlyUpdatedCases: [],
      recentNotifications: [],
    };
  }

  const nowIso = new Date().toISOString();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [{ data: upcoming }, { data: overdue }, { data: reminderToday }, { data: recentCases }, { data: notifications }, { data: tasks }] = await Promise.all([
    client
      .from("case_tasks")
      .select("id, title, due_at, priority")
      .neq("status", "completed")
      .gte("due_at", nowIso)
      .order("due_at", { ascending: true })
      .limit(5),
    client
      .from("case_tasks")
      .select("id, title, due_at, priority")
      .neq("status", "completed")
      .lt("due_at", nowIso)
      .order("due_at", { ascending: true })
      .limit(20),
    client
      .from("reminder_queue")
      .select("id")
      .eq("status", "queued")
      .gte("scheduled_for", todayStart.toISOString())
      .lte("scheduled_for", todayEnd.toISOString()),
    client
      .from("cases")
      .select("id, title, updated_at")
      .order("updated_at", { ascending: false })
      .limit(6),
    client
      .from("notifications")
      .select("id, title, status, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
    client
      .from("case_tasks")
      .select("id, title, assigned_to")
      .neq("status", "completed"),
  ]);

  const waitingForClient = (tasks ?? []).filter((item: any) => String(item.title).toLowerCase().includes("client") || String(item.title).toLowerCase().includes("upload")).length;
  const waitingForConsultant = (tasks ?? []).filter((item: any) => Boolean(item.assigned_to)).length;

  return {
    upcomingDeadlines: (upcoming ?? []).map((item: any) => ({ id: item.id, title: item.title, dueAt: item.due_at, priority: item.priority })),
    todaysReminders: (reminderToday ?? []).length,
    overdueTasks: (overdue ?? []).map((item: any) => ({ id: item.id, title: item.title, dueAt: item.due_at, priority: item.priority })),
    waitingForClient,
    waitingForConsultant,
    recentlyUpdatedCases: (recentCases ?? []).map((item: any) => ({ caseId: item.id, title: item.title, updatedAt: item.updated_at })),
    recentNotifications: (notifications ?? []).map((item: any) => ({ id: item.id, title: item.title, status: item.status, createdAt: item.created_at })),
  };
}
