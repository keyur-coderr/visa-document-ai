import type { StreamKey } from "@/config/immigration-streams/schema";
import type { MilestoneKey } from "@/types/domain";

export type ChecklistRequirementKind = "required" | "optional";

export type ChecklistItemStatus =
  | "required"
  | "optional"
  | "pending"
  | "uploaded"
  | "missing"
  | "approved"
  | "rejected"
  | "needs_review";

export type ParticipantScope = "applicant" | "spouse" | "children";

export interface StreamChecklistItem {
  key: string;
  label: string;
  kind: ChecklistRequirementKind;
  appliesTo: ParticipantScope;
}

export interface StreamChecklistGroup {
  key: string;
  title: string;
  items: StreamChecklistItem[];
}

export interface StreamFormConfig {
  key: string;
  label: string;
  required: boolean;
}

export interface StreamDeadlineConfig {
  key: string;
  label: string;
  targetMilestone: MilestoneKey;
  targetDaysFromCaseOpen: number;
}

export interface StreamParticipantRequirement {
  participant: ParticipantScope;
  summary: string;
}

export interface StreamWorkflowConfig {
  key: StreamKey;
  streamName: string;
  forms: StreamFormConfig[];
  requiredDocuments: string[];
  optionalDocuments: string[];
  requiredDeclarations: string[];
  requiredSignatures: string[];
  checklistGroups: StreamChecklistGroup[];
  milestones: MilestoneKey[];
  reviewStages: string[];
  deadlines: StreamDeadlineConfig[];
  participantRequirements: StreamParticipantRequirement[];
}
