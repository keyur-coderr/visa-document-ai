import type { StreamWorkflowConfig } from "@/config/streams/types";

export const expressEntryFswpConfig: StreamWorkflowConfig = {
  key: "express-entry-fswp",
  streamName: "Express Entry",
  forms: [
    { key: "imm0008", label: "IMM 0008 Generic Application", required: true },
    { key: "imm5669", label: "IMM 5669 Schedule A", required: true },
    { key: "imm5406", label: "IMM 5406 Additional Family Info", required: true },
  ],
  requiredDocuments: [
    "Passport bio page",
    "Language test results",
    "Education credentials",
    "Employment reference letters",
    "Police certificates",
  ],
  optionalDocuments: ["Additional proof of funds", "Travel history summary"],
  requiredDeclarations: ["Truthfulness declaration", "Background declaration"],
  requiredSignatures: ["Principal applicant signature", "Representative signature"],
  checklistGroups: [
    {
      key: "identity",
      title: "Identity & Civil Status",
      items: [
        { key: "passport", label: "Valid passport", kind: "required", appliesTo: "applicant" },
        { key: "birth_cert", label: "Birth certificate", kind: "required", appliesTo: "applicant" },
      ],
    },
    {
      key: "eligibility",
      title: "Eligibility Evidence",
      items: [
        { key: "language_test", label: "Approved language test", kind: "required", appliesTo: "applicant" },
        { key: "eca", label: "Educational credential assessment", kind: "required", appliesTo: "applicant" },
        { key: "proof_funds", label: "Proof of funds update", kind: "optional", appliesTo: "applicant" },
      ],
    },
  ],
  milestones: ["intake", "documents_complete", "forms_ready", "submitted", "awaiting_decision", "decision_received"],
  reviewStages: ["assistant_prepare", "practitioner_review", "submission_signoff"],
  deadlines: [
    { key: "language_validity", label: "Language test validity check", targetMilestone: "documents_complete", targetDaysFromCaseOpen: 14 },
    { key: "submission_window", label: "Submission package ready", targetMilestone: "forms_ready", targetDaysFromCaseOpen: 35 },
  ],
  participantRequirements: [
    { participant: "applicant", summary: "Applicant must provide full work and education history." },
    { participant: "spouse", summary: "If accompanying, include identity and background forms." },
    { participant: "children", summary: "Dependent children require identity and custody docs where applicable." },
  ],
};
