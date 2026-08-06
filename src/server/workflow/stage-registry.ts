import "server-only";

export type LifecycleStageKey =
  | "lead"
  | "consultation"
  | "agreement_signed"
  | "documents_requested"
  | "documents_received"
  | "ai_processing"
  | "consultant_review"
  | "forms_generated"
  | "forms_approved"
  | "application_submitted"
  | "aor"
  | "biometrics"
  | "medical"
  | "adr"
  | "background_check"
  | "ppr"
  | "copr"
  | "closed";

export interface WorkflowStageConfig {
  id: string;
  key: LifecycleStageKey;
  name: string;
  displayOrder: number;
  icon: string;
  color: string;
  description: string;
  slaDays: number | null;
  completionRules: string[];
  automationHooks: string[];
  active: boolean;
}

export const DEFAULT_WORKFLOW_STAGES: WorkflowStageConfig[] = [
  { id: "ws-lead", key: "lead", name: "Lead", displayOrder: 1, icon: "user-plus", color: "neutral", description: "Initial lead capture and qualification.", slaDays: 3, completionRules: ["lead_contact"], automationHooks: ["on_enter"], active: true },
  { id: "ws-consultation", key: "consultation", name: "Consultation", displayOrder: 2, icon: "calendar", color: "info", description: "Consultation scheduled and completed.", slaDays: 7, completionRules: ["consultation_note"], automationHooks: ["on_complete"], active: true },
  { id: "ws-agreement", key: "agreement_signed", name: "Agreement Signed", displayOrder: 3, icon: "file-signature", color: "brand", description: "Retainer and agreement signed.", slaDays: 10, completionRules: ["agreement_signed"], automationHooks: ["on_complete"], active: true },
  { id: "ws-docs-requested", key: "documents_requested", name: "Documents Requested", displayOrder: 4, icon: "list-check", color: "warning", description: "Document checklist requested from client.", slaDays: 3, completionRules: ["request_sent"], automationHooks: ["on_enter"], active: true },
  { id: "ws-docs-received", key: "documents_received", name: "Documents Received", displayOrder: 5, icon: "folder-check", color: "success", description: "Required documents received.", slaDays: 14, completionRules: ["required_documents_uploaded"], automationHooks: ["on_complete"], active: true },
  { id: "ws-ai", key: "ai_processing", name: "AI Processing", displayOrder: 6, icon: "cpu", color: "info", description: "OCR and extraction processing.", slaDays: 2, completionRules: ["processing_jobs_completed"], automationHooks: ["on_enter", "on_complete"], active: true },
  { id: "ws-review", key: "consultant_review", name: "Consultant Review", displayOrder: 7, icon: "shield-check", color: "warning", description: "Practitioner review of AI outputs.", slaDays: 5, completionRules: ["review_approved"], automationHooks: ["on_complete"], active: true },
  { id: "ws-forms-generated", key: "forms_generated", name: "Forms Generated", displayOrder: 8, icon: "file-text", color: "info", description: "Form generation completed.", slaDays: 3, completionRules: ["forms_generated"], automationHooks: ["on_complete"], active: true },
  { id: "ws-forms-approved", key: "forms_approved", name: "Forms Approved", displayOrder: 9, icon: "check-circle", color: "success", description: "Forms approved by practitioner.", slaDays: 3, completionRules: ["forms_approved"], automationHooks: ["on_complete"], active: true },
  { id: "ws-submitted", key: "application_submitted", name: "Application Submitted", displayOrder: 10, icon: "send", color: "brand", description: "Application submitted manually to IRCC portal.", slaDays: 2, completionRules: ["submission_reference"], automationHooks: ["on_complete"], active: true },
  { id: "ws-aor", key: "aor", name: "AOR", displayOrder: 11, icon: "inbox", color: "info", description: "Acknowledgement of receipt stage.", slaDays: 30, completionRules: ["aor_received"], automationHooks: ["on_enter"], active: true },
  { id: "ws-biometrics", key: "biometrics", name: "Biometrics", displayOrder: 12, icon: "fingerprint", color: "warning", description: "Biometrics request and completion.", slaDays: 45, completionRules: ["biometrics_completed"], automationHooks: ["on_enter"], active: true },
  { id: "ws-medical", key: "medical", name: "Medical", displayOrder: 13, icon: "heart-pulse", color: "warning", description: "Medical request handling.", slaDays: 45, completionRules: ["medical_completed"], automationHooks: ["on_enter"], active: true },
  { id: "ws-adr", key: "adr", name: "ADR", displayOrder: 14, icon: "alert-circle", color: "danger", description: "Additional document requests.", slaDays: 21, completionRules: ["adr_answered"], automationHooks: ["on_enter"], active: true },
  { id: "ws-background", key: "background_check", name: "Background Check", displayOrder: 15, icon: "search", color: "info", description: "Background check progress tracking.", slaDays: 60, completionRules: ["background_completed"], automationHooks: ["on_enter"], active: true },
  { id: "ws-ppr", key: "ppr", name: "PPR", displayOrder: 16, icon: "mail-open", color: "brand", description: "Passport request stage.", slaDays: 30, completionRules: ["ppr_received"], automationHooks: ["on_enter"], active: true },
  { id: "ws-copr", key: "copr", name: "COPR", displayOrder: 17, icon: "award", color: "success", description: "COPR issuance stage.", slaDays: 15, completionRules: ["copr_received"], automationHooks: ["on_enter"], active: true },
  { id: "ws-closed", key: "closed", name: "Closed", displayOrder: 18, icon: "archive", color: "neutral", description: "Case closed and archived.", slaDays: null, completionRules: [], automationHooks: ["on_enter"], active: true },
];

export function getStageConfig(stageKey: LifecycleStageKey): WorkflowStageConfig | null {
  return DEFAULT_WORKFLOW_STAGES.find((item) => item.key === stageKey) ?? null;
}

export function isLifecycleStageKey(value: string): value is LifecycleStageKey {
  return DEFAULT_WORKFLOW_STAGES.some((item) => item.key === value);
}
