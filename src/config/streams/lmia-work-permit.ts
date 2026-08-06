import type { StreamWorkflowConfig } from "@/config/streams/types";

export const lmiaWorkPermitConfig: StreamWorkflowConfig = {
  key: "work-permit-lmia-based",
  streamName: "LMIA Work Permit",
  forms: [
    { key: "imm1295", label: "IMM 1295 Work Permit Application", required: true },
    { key: "imm5645", label: "IMM 5645 Family Information", required: true },
  ],
  requiredDocuments: ["Passport", "Positive LMIA", "Job offer letter", "Employment contract"],
  optionalDocuments: ["Professional certificates", "Prior work references"],
  requiredDeclarations: ["Employment compliance declaration"],
  requiredSignatures: ["Applicant signature", "Employer attestation"],
  checklistGroups: [
    {
      key: "employment_core",
      title: "Employment Core Documents",
      items: [
        { key: "lmia", label: "Positive LMIA", kind: "required", appliesTo: "applicant" },
        { key: "offer", label: "Job offer and contract", kind: "required", appliesTo: "applicant" },
      ],
    },
    {
      key: "credentials",
      title: "Credentials",
      items: [
        { key: "certs", label: "Professional certifications", kind: "optional", appliesTo: "applicant" },
        { key: "history", label: "Prior work references", kind: "optional", appliesTo: "applicant" },
      ],
    },
  ],
  milestones: ["intake", "documents_complete", "forms_ready", "submitted", "awaiting_decision", "decision_received"],
  reviewStages: ["assistant_prepare", "practitioner_review", "submission_signoff"],
  deadlines: [
    { key: "lmia_validity", label: "LMIA validity check", targetMilestone: "documents_complete", targetDaysFromCaseOpen: 6 },
    { key: "submission", label: "Work permit filing target", targetMilestone: "forms_ready", targetDaysFromCaseOpen: 18 },
  ],
  participantRequirements: [
    { participant: "applicant", summary: "Applicant must align work role with LMIA details." },
    { participant: "spouse", summary: "Spouse details if open work permit requested." },
    { participant: "children", summary: "Children records if accompanying dependants." },
  ],
};
