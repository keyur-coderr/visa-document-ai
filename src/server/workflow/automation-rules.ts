import "server-only";

import type { LifecycleStageKey } from "@/server/workflow/stage-registry";

export interface AutomationRule {
  id: string;
  eventKey: string;
  stageKey?: LifecycleStageKey;
  condition: Record<string, unknown>;
  actionKey: "start_ocr" | "enable_pdf_generation" | "enable_submission" | "create_milestone" | "notify_client" | "create_urgent_task";
  actionPayload: Record<string, unknown>;
  active: boolean;
}

export const DEFAULT_AUTOMATION_RULES: AutomationRule[] = [
  {
    id: "rule-docs-uploaded-start-ocr",
    eventKey: "documents_uploaded",
    stageKey: "documents_received",
    condition: { requiredDocumentsUploaded: true },
    actionKey: "start_ocr",
    actionPayload: { processingType: "ocr_classification_extraction" },
    active: true,
  },
  {
    id: "rule-ocr-approved-enable-pdf",
    eventKey: "ocr_approved",
    stageKey: "consultant_review",
    condition: { allCriticalFieldsApproved: true },
    actionKey: "enable_pdf_generation",
    actionPayload: { formWorkspaceUnlocked: true },
    active: true,
  },
  {
    id: "rule-pdf-approved-enable-submission",
    eventKey: "pdf_approved",
    stageKey: "forms_approved",
    condition: { requiredFormsApproved: true },
    actionKey: "enable_submission",
    actionPayload: { submissionChecklistUnlocked: true },
    active: true,
  },
  {
    id: "rule-submitted-create-aor",
    eventKey: "submission_completed",
    stageKey: "application_submitted",
    condition: {},
    actionKey: "create_milestone",
    actionPayload: { stageKey: "aor" },
    active: true,
  },
  {
    id: "rule-medical-notify-client",
    eventKey: "medical_requested",
    stageKey: "medical",
    condition: {},
    actionKey: "notify_client",
    actionPayload: { templateKey: "medical" },
    active: true,
  },
  {
    id: "rule-adr-urgent-task",
    eventKey: "adr_received",
    stageKey: "adr",
    condition: {},
    actionKey: "create_urgent_task",
    actionPayload: { title: "ADR follow-up", priority: "urgent", dueDays: 2 },
    active: true,
  },
];

export function getAutomationRulesForEvent(eventKey: string): AutomationRule[] {
  return DEFAULT_AUTOMATION_RULES.filter((rule) => rule.active && rule.eventKey === eventKey);
}
