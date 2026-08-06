import type { StreamWorkflowConfig } from "@/config/streams/types";

export const pnpConfig: StreamWorkflowConfig = {
  key: "pnp",
  streamName: "PNP",
  forms: [
    { key: "nomination_form", label: "Provincial Nomination Forms", required: true },
    { key: "imm0008", label: "IMM 0008 Generic Application", required: true },
  ],
  requiredDocuments: [
    "Provincial nomination certificate",
    "Passport",
    "Work or study support evidence",
    "Settlement plan",
  ],
  optionalDocuments: ["Province-specific supporting letters"],
  requiredDeclarations: ["Provincial intent declaration"],
  requiredSignatures: ["Applicant signature"],
  checklistGroups: [
    {
      key: "nomination",
      title: "Nomination Evidence",
      items: [
        { key: "nom_cert", label: "Nomination certificate", kind: "required", appliesTo: "applicant" },
        { key: "intent", label: "Intent to reside evidence", kind: "required", appliesTo: "applicant" },
      ],
    },
    {
      key: "supporting",
      title: "Supporting Documents",
      items: [
        { key: "settlement", label: "Settlement plan", kind: "required", appliesTo: "applicant" },
        { key: "province_letter", label: "Province support letter", kind: "optional", appliesTo: "applicant" },
      ],
    },
  ],
  milestones: ["intake", "documents_complete", "forms_ready", "submitted", "awaiting_decision", "decision_received"],
  reviewStages: ["assistant_prepare", "practitioner_review"],
  deadlines: [
    { key: "nomination_validity", label: "Nomination validity review", targetMilestone: "documents_complete", targetDaysFromCaseOpen: 9 },
    { key: "submission", label: "PNP package submission target", targetMilestone: "forms_ready", targetDaysFromCaseOpen: 26 },
  ],
  participantRequirements: [
    { participant: "applicant", summary: "Applicant must meet province nomination conditions." },
    { participant: "spouse", summary: "Spouse docs required when accompanying." },
    { participant: "children", summary: "Children docs required when accompanying." },
  ],
};
