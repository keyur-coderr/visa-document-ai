import type { StreamWorkflowConfig } from "@/config/streams/types";

export const spousalOutlandConfig: StreamWorkflowConfig = {
  key: "spousal-sponsorship-outland",
  streamName: "Spousal Outland",
  forms: [
    { key: "imm1344", label: "IMM 1344 Sponsorship Agreement", required: true },
    { key: "imm0008", label: "IMM 0008 Generic Application", required: true },
    { key: "imm5532", label: "IMM 5532 Relationship Information", required: true },
  ],
  requiredDocuments: [
    "Marriage or partnership proof",
    "Relationship history evidence",
    "Country-specific police certificates",
    "Sponsor and applicant identity records",
  ],
  optionalDocuments: ["Additional travel history evidence", "Third-party declarations"],
  requiredDeclarations: ["Relationship declaration", "Outland process acknowledgement"],
  requiredSignatures: ["Applicant signature", "Sponsor signature"],
  checklistGroups: [
    {
      key: "relationship_core",
      title: "Relationship Evidence",
      items: [
        { key: "marriage_doc", label: "Marriage/partnership documents", kind: "required", appliesTo: "spouse" },
        { key: "timeline", label: "Relationship timeline package", kind: "required", appliesTo: "spouse" },
      ],
    },
    {
      key: "country_specific",
      title: "Country-Specific Evidence",
      items: [
        { key: "police", label: "Police certificates", kind: "required", appliesTo: "applicant" },
        { key: "travel", label: "Travel history evidence", kind: "optional", appliesTo: "applicant" },
      ],
    },
  ],
  milestones: ["intake", "documents_complete", "forms_ready", "submitted", "awaiting_decision", "decision_received"],
  reviewStages: ["assistant_prepare", "practitioner_review", "submission_signoff"],
  deadlines: [
    { key: "police_window", label: "Police certificate validity check", targetMilestone: "documents_complete", targetDaysFromCaseOpen: 13 },
    { key: "signatures", label: "Signature package completion", targetMilestone: "forms_ready", targetDaysFromCaseOpen: 30 },
  ],
  participantRequirements: [
    { participant: "applicant", summary: "Applicant must provide country-specific supporting records." },
    { participant: "spouse", summary: "Sponsor and spouse must submit relationship and support evidence." },
    { participant: "children", summary: "Dependent child records required where applicable." },
  ],
};
