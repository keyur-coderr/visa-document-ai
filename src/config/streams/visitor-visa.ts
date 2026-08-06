import type { StreamWorkflowConfig } from "@/config/streams/types";

export const visitorVisaConfig: StreamWorkflowConfig = {
  key: "visitor-visa-trv",
  streamName: "Visitor Visa",
  forms: [
    { key: "imm5257", label: "IMM 5257 Visitor Visa Application", required: true },
    { key: "imm5645", label: "IMM 5645 Family Information", required: true },
  ],
  requiredDocuments: ["Passport", "Travel purpose letter", "Proof of funds", "Ties to home country evidence"],
  optionalDocuments: ["Invitation letter", "Travel itinerary"],
  requiredDeclarations: ["Temporary stay declaration"],
  requiredSignatures: ["Applicant signature"],
  checklistGroups: [
    {
      key: "travel_intent",
      title: "Travel Intent",
      items: [
        { key: "purpose", label: "Purpose of visit letter", kind: "required", appliesTo: "applicant" },
        { key: "itinerary", label: "Travel itinerary", kind: "optional", appliesTo: "applicant" },
      ],
    },
    {
      key: "financial",
      title: "Financial Capacity",
      items: [
        { key: "funds", label: "Proof of funds", kind: "required", appliesTo: "applicant" },
        { key: "host_support", label: "Host support evidence", kind: "optional", appliesTo: "applicant" },
      ],
    },
  ],
  milestones: ["intake", "documents_complete", "forms_ready", "submitted", "awaiting_decision", "decision_received"],
  reviewStages: ["assistant_prepare", "practitioner_review"],
  deadlines: [
    { key: "document_pack", label: "Visitor document pack complete", targetMilestone: "documents_complete", targetDaysFromCaseOpen: 5 },
    { key: "submission", label: "Visitor filing target", targetMilestone: "forms_ready", targetDaysFromCaseOpen: 14 },
  ],
  participantRequirements: [
    { participant: "applicant", summary: "Applicant must demonstrate temporary intent and sufficient funds." },
    { participant: "spouse", summary: "Spouse details if jointly applying for travel." },
    { participant: "children", summary: "Children travel documents when included." },
  ],
};
