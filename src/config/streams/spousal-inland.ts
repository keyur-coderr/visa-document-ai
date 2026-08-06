import type { StreamWorkflowConfig } from "@/config/streams/types";

export const spousalInlandConfig: StreamWorkflowConfig = {
  key: "spousal-sponsorship-inland",
  streamName: "Spousal Inland",
  forms: [
    { key: "imm1344", label: "IMM 1344 Sponsorship Agreement", required: true },
    { key: "imm0008", label: "IMM 0008 Generic Application", required: true },
    { key: "imm5532", label: "IMM 5532 Relationship Information", required: true },
  ],
  requiredDocuments: [
    "Marriage or partnership proof",
    "Relationship evidence package",
    "Sponsor status documents",
    "Identity documents for both parties",
  ],
  optionalDocuments: ["Additional cohabitation evidence", "Family support letters"],
  requiredDeclarations: ["Relationship declaration", "Sponsor undertaking declaration"],
  requiredSignatures: ["Applicant signature", "Sponsor signature"],
  checklistGroups: [
    {
      key: "relationship_core",
      title: "Relationship Core",
      items: [
        { key: "marriage_doc", label: "Marriage/partnership evidence", kind: "required", appliesTo: "spouse" },
        { key: "photos", label: "Relationship photos and communications", kind: "required", appliesTo: "spouse" },
      ],
    },
    {
      key: "sponsor",
      title: "Sponsor Documents",
      items: [
        { key: "sponsor_status", label: "Sponsor status proof", kind: "required", appliesTo: "spouse" },
        { key: "support_letters", label: "Additional support letters", kind: "optional", appliesTo: "spouse" },
      ],
    },
  ],
  milestones: ["intake", "documents_complete", "forms_ready", "submitted", "awaiting_decision", "decision_received"],
  reviewStages: ["assistant_prepare", "practitioner_review", "submission_signoff"],
  deadlines: [
    { key: "relationship_pack", label: "Relationship evidence complete", targetMilestone: "documents_complete", targetDaysFromCaseOpen: 15 },
    { key: "forms_signoff", label: "Sponsor/applicant signature completion", targetMilestone: "forms_ready", targetDaysFromCaseOpen: 28 },
  ],
  participantRequirements: [
    { participant: "applicant", summary: "Applicant identity/background docs are required." },
    { participant: "spouse", summary: "Sponsor and spouse relationship evidence required." },
    { participant: "children", summary: "Children identity/custody documents when applicable." },
  ],
};
