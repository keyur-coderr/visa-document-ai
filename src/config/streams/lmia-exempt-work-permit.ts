import type { StreamWorkflowConfig } from "@/config/streams/types";

export const lmiaExemptWorkPermitConfig: StreamWorkflowConfig = {
  key: "work-permit-lmia-exempt",
  streamName: "LMIA Exempt Work Permit",
  forms: [
    { key: "imm1295", label: "IMM 1295 Work Permit Application", required: true },
    { key: "imm5802", label: "Employer Compliance Offer", required: true },
  ],
  requiredDocuments: ["Passport", "Employer offer of employment", "LMIA exemption rationale"],
  optionalDocuments: ["Previous Canadian status documents"],
  requiredDeclarations: ["LMIA exemption declaration"],
  requiredSignatures: ["Applicant signature", "Employer sign-off"],
  checklistGroups: [
    {
      key: "exemption_basis",
      title: "Exemption Basis",
      items: [
        { key: "rationale", label: "LMIA exemption rationale", kind: "required", appliesTo: "applicant" },
        { key: "offer", label: "Offer of employment", kind: "required", appliesTo: "applicant" },
      ],
    },
    {
      key: "supporting",
      title: "Supporting Evidence",
      items: [
        { key: "prior_status", label: "Prior status documents", kind: "optional", appliesTo: "applicant" },
      ],
    },
  ],
  milestones: ["intake", "documents_complete", "forms_ready", "submitted", "awaiting_decision", "decision_received"],
  reviewStages: ["assistant_prepare", "practitioner_review"],
  deadlines: [
    { key: "offer_review", label: "Offer compliance review", targetMilestone: "documents_complete", targetDaysFromCaseOpen: 7 },
    { key: "submission", label: "Exempt permit filing target", targetMilestone: "forms_ready", targetDaysFromCaseOpen: 16 },
  ],
  participantRequirements: [
    { participant: "applicant", summary: "Applicant must evidence LMIA exemption category clearly." },
    { participant: "spouse", summary: "Spouse details if accompanying." },
    { participant: "children", summary: "Children details when included." },
  ],
};
