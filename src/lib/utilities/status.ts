/**
 * Status-to-presentation mappings for the badges/chips used across cases,
 * documents, and AI outputs. Centralized here so every table/card/detail
 * view renders the same label + color for a given status (Phase 1 UI only —
 * no domain logic).
 */
import type { CaseStatus, DocumentStatus, RiskTier, ReviewStatus } from "@/types/domain";
import type { CaseFlagSeverity } from "@/types/domain";

export type StatusTone = "neutral" | "brand" | "success" | "warning" | "danger" | "info";

export interface StatusPresentation {
  label: string;
  tone: StatusTone;
}

export const caseStatusPresentation: Record<CaseStatus, StatusPresentation> = {
  draft: { label: "Draft", tone: "neutral" },
  intake_in_progress: { label: "Intake in Progress", tone: "info" },
  documents_in_progress: { label: "Documents in Progress", tone: "info" },
  in_review: { label: "In Review", tone: "warning" },
  ready_for_submission: { label: "Ready for Submission", tone: "brand" },
  submitted: { label: "Submitted", tone: "brand" },
  awaiting_decision: { label: "Awaiting Decision", tone: "warning" },
  decision_received: { label: "Decision Received", tone: "success" },
  closed: { label: "Closed", tone: "neutral" },
};

export const documentStatusPresentation: Record<DocumentStatus, StatusPresentation> = {
  missing: { label: "Missing", tone: "danger" },
  uploaded: { label: "Uploaded", tone: "info" },
  processing: { label: "Processing", tone: "warning" },
  needs_review: { label: "Needs Review", tone: "warning" },
  needs_reupload: { label: "Needs Re-upload", tone: "warning" },
  approved: { label: "Approved", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
  expired: { label: "Expired", tone: "neutral" },
  duplicate: { label: "Duplicate", tone: "neutral" },
};

export const reviewStatusPresentation: Record<ReviewStatus, StatusPresentation> = {
  pending_review: { label: "Pending Review", tone: "warning" },
  approved: { label: "Approved", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
  overridden: { label: "Overridden", tone: "neutral" },
};

export const riskTierPresentation: Record<RiskTier, StatusPresentation> = {
  standard: { label: "Standard Risk", tone: "neutral" },
  elevated: { label: "Elevated Risk", tone: "warning" },
  high: { label: "High Risk", tone: "danger" },
};

export const caseFlagSeverityPresentation: Record<CaseFlagSeverity, StatusPresentation> = {
  low: { label: "Low", tone: "neutral" },
  medium: { label: "Medium", tone: "warning" },
  high: { label: "High", tone: "danger" },
};

/**
 * Buckets a 0..1 AI confidence score into a display band. Presentation only —
 * does not imply legal sufficiency (see docs/architecture.md §10).
 */
export function aiConfidenceBand(confidence: number): StatusPresentation & { percent: number } {
  const percent = Math.round(confidence * 100);
  if (confidence >= 0.85) return { label: "High Confidence", tone: "success", percent };
  if (confidence >= 0.6) return { label: "Medium Confidence", tone: "warning", percent };
  return { label: "Low Confidence", tone: "danger", percent };
}

export const toneClasses: Record<StatusTone, { bg: string; text: string; dot: string; border: string }> = {
  neutral: {
    bg: "bg-neutral-100 dark:bg-neutral-800",
    text: "text-neutral-700 dark:text-neutral-300",
    dot: "bg-neutral-400",
    border: "border-neutral-200 dark:border-neutral-700",
  },
  brand: {
    bg: "bg-brand-50 dark:bg-brand-900/30",
    text: "text-brand-700 dark:text-brand-300",
    dot: "bg-brand-500",
    border: "border-brand-200 dark:border-brand-800",
  },
  success: {
    bg: "bg-success-50 dark:bg-success-500/10",
    text: "text-success-700 dark:text-success-500",
    dot: "bg-success-500",
    border: "border-success-100 dark:border-success-500/20",
  },
  warning: {
    bg: "bg-warning-50 dark:bg-warning-500/10",
    text: "text-warning-700 dark:text-warning-500",
    dot: "bg-warning-500",
    border: "border-warning-100 dark:border-warning-500/20",
  },
  danger: {
    bg: "bg-danger-50 dark:bg-danger-500/10",
    text: "text-danger-700 dark:text-danger-500",
    dot: "bg-danger-500",
    border: "border-danger-100 dark:border-danger-500/20",
  },
  info: {
    bg: "bg-info-50 dark:bg-info-500/10",
    text: "text-info-700 dark:text-info-500",
    dot: "bg-info-500",
    border: "border-info-100 dark:border-info-500/20",
  },
};
