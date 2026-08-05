/**
 * Immigration stream configuration schema.
 *
 * Streams are data, not code (docs/architecture.md §8). This file defines the
 * shared TypeScript shape that every stream configuration must conform to,
 * strict enough to be compile-time checked, without requiring Zod (not
 * installed yet — runtime validation is added when configs start being
 * loaded/edited through an API in a later phase).
 *
 * The shape must support all 18 identified streams across three phases; only
 * Phase 1 streams are populated with complete content initially (see
 * docs/mvp-roadmap.md). Phase 2/3 entries exist as inactive placeholders so
 * the registry shape never has to change when a stream is fleshed out.
 *
 * This file defines the schema only — the populated registry
 * (`registry.ts`) and per-stream content (`phase-1/`, `phase-2/`,
 * `phase-3/`) are created in a later phase.
 */

// ---------------------------------------------------------------------------
// Stream identity
// ---------------------------------------------------------------------------

export type StreamPhase = 1 | 2 | 3;

/**
 * Liability tier drives review-workflow strictness. Phase 3 streams use
 * `phase-3-restricted`, which requires the separate, slower, explicitly
 * acknowledged review workflow described in docs/mvp-roadmap.md.
 */
export type LiabilityTier = "standard" | "elevated" | "phase-3-restricted";

/**
 * All 18 stream keys the architecture must support. Phase 1 keys are
 * implemented first; Phase 2/3 keys exist so `StreamKey` never needs to grow
 * as a breaking change later.
 */
export type StreamKey =
  // Phase 1 — implemented
  | "express-entry-fswp"
  | "express-entry-cec"
  | "express-entry-fstp"
  | "spousal-sponsorship-inland"
  | "spousal-sponsorship-outland"
  | "visitor-visa-trv"
  | "study-permit"
  | "work-permit-lmia-based"
  | "work-permit-lmia-exempt"
  // Phase 2 — placeholders only
  | "pnp"
  | "parent-grandparent-sponsorship"
  | "start-up-visa"
  | "self-employed"
  | "quebec-skilled-worker"
  | "peq"
  | "quebec-investor-entrepreneur"
  // Phase 3 — placeholders only, phase-3-restricted liability tier
  | "humanitarian-compassionate"
  | "refugee-claims"
  | "prra"
  | "trp";

// ---------------------------------------------------------------------------
// Participant roles
// ---------------------------------------------------------------------------

export type StreamParticipantRole =
  | "principal_applicant"
  | "spouse_or_partner"
  | "dependant_child"
  | "sponsor"
  | "employer"
  | "other";

// ---------------------------------------------------------------------------
// Intake configuration
// ---------------------------------------------------------------------------

export type IntakeFieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "select"
  | "multi_select"
  | "boolean"
  | "file_pointer";

export interface IntakeFieldOption {
  value: string;
  label: string;
}

/**
 * A single condition on another field's answer. Multiple conditions in a
 * `ConditionalVisibilityRule.when` array are combined with AND semantics.
 */
export interface FieldCondition {
  fieldKey: string;
  equals?: string | number | boolean;
  in?: (string | number | boolean)[];
  isSet?: boolean;
}

export interface ConditionalVisibilityRule {
  when: FieldCondition[];
}

export interface IntakeField {
  key: string;
  label: string;
  type: IntakeFieldType;
  required: boolean;
  helpText?: string;
  options?: IntakeFieldOption[]; // for select/multi_select
  appliesToRoles?: StreamParticipantRole[]; // omit = applies to all roles in this stream
  visibility?: ConditionalVisibilityRule;
}

export interface IntakeSection {
  key: string;
  title: string;
  description?: string;
  fields: IntakeField[];
  visibility?: ConditionalVisibilityRule;
}

// ---------------------------------------------------------------------------
// Checklist configuration
// ---------------------------------------------------------------------------

export type ChecklistItemCategory =
  | "identity"
  | "immigration_history"
  | "relationship_evidence"
  | "financial"
  | "employment"
  | "education"
  | "language"
  | "medical"
  | "police_clearance"
  | "sponsorship"
  | "legal_representation"
  | "other";

export interface ChecklistItem {
  key: string;
  label: string;
  category: ChecklistItemCategory;
  required: boolean;
  appliesToRoles?: StreamParticipantRole[];
  visibility?: ConditionalVisibilityRule;
  /** Short explanation shown to clients/practitioners for why this item is requested. */
  guidance?: string;
}

export interface OptionalEvidenceItem {
  key: string;
  label: string;
  category: ChecklistItemCategory;
  guidance?: string;
}

// ---------------------------------------------------------------------------
// Classification and extraction
// ---------------------------------------------------------------------------

export interface ClassificationCategoryDef {
  key: string;
  label: string;
  /** Maps to a ChecklistItem.key this category typically satisfies, if any. */
  satisfiesChecklistKey?: string;
}

export interface ExtractionFieldSchema {
  key: string;
  label: string;
  valueType: "string" | "number" | "date" | "boolean";
  /** Whether extracted values for this field require field-level encryption. */
  sensitive: boolean;
}

export interface ExtractionSchemaDef {
  /** Which document category this extraction schema applies to. */
  documentCategoryKey: string;
  schemaVersion: number;
  fields: ExtractionFieldSchema[];
}

// ---------------------------------------------------------------------------
// Evidence completeness rules
// ---------------------------------------------------------------------------

/**
 * Describes evidence quantity/source-diversity only — never legal
 * sufficiency or approval likelihood (docs/architecture.md §10).
 */
export interface EvidenceRule {
  requirementKey: string; // matches a ChecklistItem.key
  strongThresholdDocumentCount: number;
  moderateThresholdDocumentCount: number;
  requiresSourceDiversity: boolean; // e.g., financial + communication + photos
}

// ---------------------------------------------------------------------------
// Timeline rules
// ---------------------------------------------------------------------------

export interface TimelineEventMappingRule {
  eventType: string;
  label: string;
  /** Document classification category keys that can produce this event type. */
  sourceCategoryKeys: string[];
  /** Extraction field keys used to derive start/end dates for this event. */
  startDateFieldKey: string;
  endDateFieldKey?: string;
}

// ---------------------------------------------------------------------------
// Deadline rules
// ---------------------------------------------------------------------------

export interface DeadlineRule {
  type: string;
  label: string;
  /** How the due date is derived, e.g. relative to a milestone or document expiry. */
  relativeTo: "case_created" | "document_expiry" | "milestone_completed";
  offsetDays?: number;
  reminderOffsetsDays: number[]; // default [30, 15, 3]
}

// ---------------------------------------------------------------------------
// Drafting capability
// ---------------------------------------------------------------------------

export type DraftingCapabilityLevel = "none" | "form_prefill" | "assisted_drafting";

export interface DraftingRules {
  level: DraftingCapabilityLevel;
  /** Human-readable notes on limits, especially for elevated/phase-3-restricted streams. */
  notes?: string;
}

// ---------------------------------------------------------------------------
// Review workflow
// ---------------------------------------------------------------------------

export interface ReviewWorkflowRules {
  /** Standard streams use single-stage practitioner review. */
  stages: ("assistant_prepare" | "practitioner_review" | "phase3_secondary_review")[];
  /** Phase 3 streams require this to be true and surfaced explicitly in the UI. */
  requiresExplicitAcknowledgement: boolean;
}

// ---------------------------------------------------------------------------
// The full stream configuration
// ---------------------------------------------------------------------------

export interface ImmigrationStreamConfig {
  key: StreamKey;
  displayName: string;
  phase: StreamPhase;
  liabilityTier: LiabilityTier;
  /** Whether this stream is available for case creation. Phase 2/3 placeholders are false. */
  active: boolean;
  /** Incremented whenever any part of this configuration changes; cases pin this version. */
  version: number;

  participantRoles: StreamParticipantRole[];

  intakeSections: IntakeSection[];
  requiredChecklist: ChecklistItem[];
  optionalEvidence: OptionalEvidenceItem[];

  classificationCategories: ClassificationCategoryDef[];
  extractionSchemas: ExtractionSchemaDef[];
  evidenceRules: EvidenceRule[];
  timelineEventMappings: TimelineEventMappingRule[];
  deadlineRules: DeadlineRule[];

  draftingRules: DraftingRules;
  reviewWorkflow: ReviewWorkflowRules;

  /** Must always state this is documentation software, not legal advice. */
  disclaimerText: string;
}

// ---------------------------------------------------------------------------
// Placeholder factory — used by phase-2/phase-3 config files (added later)
// to produce a minimally valid, inactive configuration without duplicating
// boilerplate across 11 placeholder streams.
// ---------------------------------------------------------------------------

export function createPlaceholderStreamConfig(params: {
  key: StreamKey;
  displayName: string;
  phase: StreamPhase;
  liabilityTier: LiabilityTier;
}): ImmigrationStreamConfig {
  return {
    key: params.key,
    displayName: params.displayName,
    phase: params.phase,
    liabilityTier: params.liabilityTier,
    active: false,
    version: 0,
    participantRoles: ["principal_applicant"],
    intakeSections: [],
    requiredChecklist: [],
    optionalEvidence: [],
    classificationCategories: [],
    extractionSchemas: [],
    evidenceRules: [],
    timelineEventMappings: [],
    deadlineRules: [],
    draftingRules: { level: "none", notes: "Not yet configured." },
    reviewWorkflow: {
      stages:
        params.liabilityTier === "phase-3-restricted"
          ? ["assistant_prepare", "practitioner_review", "phase3_secondary_review"]
          : ["assistant_prepare", "practitioner_review"],
      requiresExplicitAcknowledgement: params.liabilityTier === "phase-3-restricted",
    },
    disclaimerText:
      "This is documentation software, not legal advice. This stream is not yet available.",
  };
}

/** Registry shape — populated in a later phase by config/immigration-streams/registry.ts. */
export type ImmigrationStreamRegistry = Record<StreamKey, ImmigrationStreamConfig>;

// ---------------------------------------------------------------------------
// Compliance guard — nothing in the type system alone stops a future config
// author from setting draftingRules.level beyond "none" on a phase-3-restricted
// stream, which would contradict the explicit MVP exclusion of substantive
// drafting for H&C/refugee/PRRA/TRP (docs/architecture.md §9). Registry
// loading and any config-editing UI must call this before accepting a config.
// ---------------------------------------------------------------------------

export function isDraftingRulesAllowed(
  config: Pick<ImmigrationStreamConfig, "liabilityTier" | "draftingRules">,
): boolean {
  if (config.liabilityTier === "phase-3-restricted") {
    return config.draftingRules.level === "none";
  }
  return true;
}
