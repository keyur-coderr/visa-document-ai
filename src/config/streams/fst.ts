import type { StreamWorkflowConfig } from "@/config/streams/types";

export const fstConfig: StreamWorkflowConfig = {
  key: "express-entry-fstp",
  streamName: "FST",
  forms: [
    { key: "imm0008", label: "IMM 0008 Generic Application", required: true },
    { key: "imm5406", label: "IMM 5406 Additional Family Info", required: true },
  ],
  requiredDocuments: [
    "Passport bio page",
    "Trade certification evidence",
    "Employer letters or qualifying offers",
    "Language test results",
  ],
  optionalDocuments: ["Portfolio or project evidence"],
  requiredDeclarations: ["Trade experience declaration"],
  requiredSignatures: ["Principal applicant signature"],
  checklistGroups: [
    {
      key: "trade",
      title: "Trade Qualification",
      items: [
        { key: "certification", label: "Trade certification", kind: "required", appliesTo: "applicant" },
        { key: "offer", label: "Qualifying offer evidence", kind: "required", appliesTo: "applicant" },
      ],
    },
    {
      key: "identity",
      title: "Identity & Background",
      items: [
        { key: "passport", label: "Passport", kind: "required", appliesTo: "applicant" },
        { key: "portfolio", label: "Trade portfolio", kind: "optional", appliesTo: "applicant" },
      ],
    },
  ],
  milestones: ["intake", "documents_complete", "forms_ready", "submitted", "awaiting_decision", "decision_received"],
  reviewStages: ["assistant_prepare", "practitioner_review"],
  deadlines: [
    { key: "trade_check", label: "Trade document verification", targetMilestone: "documents_complete", targetDaysFromCaseOpen: 12 },
    { key: "submission_target", label: "FST submission readiness", targetMilestone: "forms_ready", targetDaysFromCaseOpen: 33 },
  ],
  participantRequirements: [
    { participant: "applicant", summary: "Applicant must show qualifying skilled trade evidence." },
    { participant: "spouse", summary: "Spouse details included when accompanying." },
    { participant: "children", summary: "Children documentation required when included." },
  ],
};
