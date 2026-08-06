import type { StreamWorkflowConfig } from "@/config/streams/types";

export const cecConfig: StreamWorkflowConfig = {
  key: "express-entry-cec",
  streamName: "CEC",
  forms: [
    { key: "imm0008", label: "IMM 0008 Generic Application", required: true },
    { key: "imm5669", label: "IMM 5669 Schedule A", required: true },
  ],
  requiredDocuments: [
    "Passport bio page",
    "Canadian work experience letters",
    "Recent pay statements",
    "Language test results",
  ],
  optionalDocuments: ["Employer support letter", "T4 summary package"],
  requiredDeclarations: ["Work history declaration", "Background declaration"],
  requiredSignatures: ["Principal applicant signature"],
  checklistGroups: [
    {
      key: "work_exp",
      title: "Canadian Work Experience",
      items: [
        { key: "job_letters", label: "Reference letters", kind: "required", appliesTo: "applicant" },
        { key: "payroll", label: "Payroll records", kind: "required", appliesTo: "applicant" },
      ],
    },
    {
      key: "supporting",
      title: "Supporting Evidence",
      items: [
        { key: "language", label: "Language results", kind: "required", appliesTo: "applicant" },
        { key: "employer_letter", label: "Employer support letter", kind: "optional", appliesTo: "applicant" },
      ],
    },
  ],
  milestones: ["intake", "documents_complete", "forms_ready", "submitted", "awaiting_decision", "decision_received"],
  reviewStages: ["assistant_prepare", "practitioner_review"],
  deadlines: [
    { key: "reference_complete", label: "Reference letter verification", targetMilestone: "documents_complete", targetDaysFromCaseOpen: 10 },
    { key: "forms_ready", label: "CEC forms finalization", targetMilestone: "forms_ready", targetDaysFromCaseOpen: 30 },
  ],
  participantRequirements: [
    { participant: "applicant", summary: "Applicant must evidence eligible Canadian work period." },
    { participant: "spouse", summary: "Spouse data required when accompanying." },
    { participant: "children", summary: "Children records required when included in application." },
  ],
};
