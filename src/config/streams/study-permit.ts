import type { StreamWorkflowConfig } from "@/config/streams/types";

export const studyPermitConfig: StreamWorkflowConfig = {
  key: "study-permit",
  streamName: "Study Permit",
  forms: [
    { key: "imm1294", label: "IMM 1294 Application for Study Permit", required: true },
    { key: "imm5645", label: "IMM 5645 Family Information", required: true },
  ],
  requiredDocuments: [
    "Passport",
    "Letter of acceptance",
    "Proof of funds",
    "Statement of purpose",
  ],
  optionalDocuments: ["Prior academic transcripts", "Additional sponsor letter"],
  requiredDeclarations: ["Study intent declaration"],
  requiredSignatures: ["Applicant signature"],
  checklistGroups: [
    {
      key: "admission",
      title: "Admission Documents",
      items: [
        { key: "loa", label: "Letter of acceptance", kind: "required", appliesTo: "applicant" },
        { key: "sop", label: "Statement of purpose", kind: "required", appliesTo: "applicant" },
      ],
    },
    {
      key: "funding",
      title: "Financial Support",
      items: [
        { key: "funds", label: "Proof of funds", kind: "required", appliesTo: "applicant" },
        { key: "sponsor", label: "Sponsor support letter", kind: "optional", appliesTo: "applicant" },
      ],
    },
  ],
  milestones: ["intake", "documents_complete", "forms_ready", "submitted", "awaiting_decision", "decision_received"],
  reviewStages: ["assistant_prepare", "practitioner_review"],
  deadlines: [
    { key: "intake_deadline", label: "School start date readiness", targetMilestone: "documents_complete", targetDaysFromCaseOpen: 7 },
    { key: "submission", label: "Study permit filing target", targetMilestone: "forms_ready", targetDaysFromCaseOpen: 21 },
  ],
  participantRequirements: [
    { participant: "applicant", summary: "Applicant must evidence study plan and funds." },
    { participant: "spouse", summary: "Spouse details only if accompanying." },
    { participant: "children", summary: "Children details required when accompanying dependants." },
  ],
};
