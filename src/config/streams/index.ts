import { cecConfig } from "@/config/streams/cec";
import { expressEntryFswpConfig } from "@/config/streams/express-entry";
import { fstConfig } from "@/config/streams/fst";
import { lmiaExemptWorkPermitConfig } from "@/config/streams/lmia-exempt-work-permit";
import { lmiaWorkPermitConfig } from "@/config/streams/lmia-work-permit";
import { pnpConfig } from "@/config/streams/pnp";
import { spousalInlandConfig } from "@/config/streams/spousal-inland";
import { spousalOutlandConfig } from "@/config/streams/spousal-outland";
import { studyPermitConfig } from "@/config/streams/study-permit";
import type { StreamWorkflowConfig } from "@/config/streams/types";
import { visitorVisaConfig } from "@/config/streams/visitor-visa";
import type { StreamKey } from "@/config/immigration-streams/schema";

function buildPlaceholderStreamConfig(key: StreamKey, streamName: string): StreamWorkflowConfig {
  return {
    key,
    streamName,
    forms: [{ key: "intake_form", label: "Core intake form", required: true }],
    requiredDocuments: ["Passport", "Core identity document"],
    optionalDocuments: ["Additional supporting evidence"],
    requiredDeclarations: ["Application declaration"],
    requiredSignatures: ["Applicant signature"],
    checklistGroups: [
      {
        key: "core",
        title: "Core Requirements",
        items: [
          { key: "passport", label: "Passport", kind: "required", appliesTo: "applicant" },
          { key: "supporting_evidence", label: "Supporting evidence", kind: "optional", appliesTo: "applicant" },
        ],
      },
    ],
    milestones: ["intake", "documents_complete", "forms_ready", "submitted", "awaiting_decision", "decision_received"],
    reviewStages: ["assistant_prepare", "practitioner_review"],
    deadlines: [
      {
        key: "intake_complete",
        label: "Complete intake package",
        targetMilestone: "documents_complete",
        targetDaysFromCaseOpen: 14,
      },
    ],
    participantRequirements: [
      { participant: "applicant", summary: "Applicant must provide core identity and eligibility evidence." },
      { participant: "spouse", summary: "Spouse documentation required if accompanying." },
      { participant: "children", summary: "Children documentation required if included in application." },
    ],
  };
}

const STREAM_CONFIGS: Record<StreamKey, StreamWorkflowConfig> = {
  "express-entry-fswp": expressEntryFswpConfig,
  "express-entry-cec": cecConfig,
  "express-entry-fstp": fstConfig,
  pnp: pnpConfig,
  "study-permit": studyPermitConfig,
  "visitor-visa-trv": visitorVisaConfig,
  "work-permit-lmia-based": lmiaWorkPermitConfig,
  "work-permit-lmia-exempt": lmiaExemptWorkPermitConfig,
  "spousal-sponsorship-inland": spousalInlandConfig,
  "spousal-sponsorship-outland": spousalOutlandConfig,
  "parent-grandparent-sponsorship": buildPlaceholderStreamConfig("parent-grandparent-sponsorship", "Parent and Grandparent Sponsorship"),
  "start-up-visa": buildPlaceholderStreamConfig("start-up-visa", "Start-up Visa"),
  "self-employed": buildPlaceholderStreamConfig("self-employed", "Self-Employed"),
  "quebec-skilled-worker": buildPlaceholderStreamConfig("quebec-skilled-worker", "Quebec Skilled Worker"),
  peq: buildPlaceholderStreamConfig("peq", "PEQ"),
  "quebec-investor-entrepreneur": buildPlaceholderStreamConfig("quebec-investor-entrepreneur", "Quebec Investor/Entrepreneur"),
  "humanitarian-compassionate": buildPlaceholderStreamConfig("humanitarian-compassionate", "Humanitarian and Compassionate"),
  "refugee-claims": buildPlaceholderStreamConfig("refugee-claims", "Refugee Claims"),
  prra: buildPlaceholderStreamConfig("prra", "PRRA"),
  trp: buildPlaceholderStreamConfig("trp", "Temporary Resident Permit"),
};

export const streamConfigs = STREAM_CONFIGS;

export function getStreamConfig(streamKey: StreamKey): StreamWorkflowConfig {
  return STREAM_CONFIGS[streamKey];
}
