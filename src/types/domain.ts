/**
 * Domain types for Visa Document AI.
 *
 * Phase 0: these are hand-authored TypeScript mirrors of the database schema
 * described in docs/database-schema.md. They exist so application code has a
 * single strict-mode-compatible source of truth for entity shapes before
 * Supabase migrations (Phase 4) generate `types/database.ts`. No runtime
 * validation library is used here yet (Zod is introduced when forms/APIs are
 * implemented) — these are compile-time-only types.
 *
 * Naming convention: docs/database-schema.md and Postgres columns use
 * snake_case; every type below uses the equivalent camelCase field name
 * (e.g. `firm_id` -> `firmId`). This is a deliberate 1:1 mapping, not a
 * naming inconsistency.
 */

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/** UUID string, branded per-entity to prevent cross-entity id mixups. */
export type Id<Brand extends string> = string & { readonly __brand: Brand };

export type FirmId = Id<"Firm">;
export type UserId = Id<"User">;
export type ClientId = Id<"Client">;
export type CaseId = Id<"Case">;
export type CaseParticipantId = Id<"CaseParticipant">;
export type IntakeResponseId = Id<"IntakeResponse">;
export type DocumentRequirementId = Id<"DocumentRequirement">;
export type DocumentId = Id<"Document">;
export type ExtractionRunId = Id<"ExtractionRun">;
export type ExtractedFieldId = Id<"ExtractedField">;
export type ClassificationResultId = Id<"ClassificationResult">;
export type CaseFactId = Id<"CaseFact">;
export type EvidenceAssessmentId = Id<"EvidenceAssessment">;
export type CaseFlagId = Id<"CaseFlag">;
export type TimelineEventId = Id<"TimelineEvent">;
export type CaseMilestoneId = Id<"CaseMilestone">;
export type DeadlineId = Id<"Deadline">;
export type MessageThreadId = Id<"MessageThread">;
export type MessageId = Id<"Message">;
export type AgreementTemplateId = Id<"AgreementTemplate">;
export type AgreementId = Id<"Agreement">;
export type ApprovalId = Id<"Approval">;
export type AuditEventId = Id<"AuditEvent">;
export type NotificationId = Id<"Notification">;
export type ComplianceExportId = Id<"ComplianceExport">;

/** ISO-8601 timestamp string. */
export type ISODateString = string;

/**
 * Marks a field as requiring field-level encryption at rest (see
 * docs/security-model.md). The wire/storage representation is an opaque
 * ciphertext string; decryption happens only in trusted server contexts.
 */
export type EncryptedString = string & { readonly __encrypted: true };

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

export type UserRole = "practitioner" | "assistant" | "client";

// ---------------------------------------------------------------------------
// 1. Firm
// ---------------------------------------------------------------------------

export interface Firm {
  id: FirmId;
  name: string;
  logo: string | null;
  brandColor: string | null;
  licenseDetails: string | null;
  jurisdiction: string;
  retentionPolicy: RetentionPolicy;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface RetentionPolicy {
  /** How long closed-case documents are retained before archival, in days. */
  retainClosedCaseDays: number;
  /** How long archived data is retained before eligible deletion, in days. */
  archiveRetentionDays: number;
}

// ---------------------------------------------------------------------------
// 2. User / 3. FirmMembership
// ---------------------------------------------------------------------------

export type UserStatus = "invited" | "active" | "suspended" | "deactivated";

export interface User {
  id: UserId;
  firmId: FirmId | null; // null for client users not yet tied to a firm membership row
  role: UserRole;
  fullName: string;
  email: string;
  status: UserStatus;
  mfaEnabled: boolean;
  createdAt: ISODateString;
}

export type FirmMembershipStatus = "invited" | "active" | "removed";

export interface FirmMembership {
  firmId: FirmId;
  userId: UserId;
  role: Exclude<UserRole, "client">;
  status: FirmMembershipStatus;
  invitedBy: UserId | null;
  joinedAt: ISODateString | null;
}

// ---------------------------------------------------------------------------
// 4. Client
// ---------------------------------------------------------------------------

export interface Client {
  id: ClientId;
  firmId: FirmId;
  userId: UserId | null;
  legalName: string;
  preferredName: string | null;
  email: string;
  phone: string | null;
  language: string;
  dateOfBirth: EncryptedString;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// ---------------------------------------------------------------------------
// 5. Case
// ---------------------------------------------------------------------------

/**
 * Coarse-grained case lifecycle used for lists/dashboards/filtering. This is
 * a denormalized projection kept in sync when a CaseMilestone (see
 * MilestoneKey) completes; CaseMilestone rows remain the source of truth for
 * milestone history — this field exists only for fast reads.
 */
export type CaseStatus =
  | "draft"
  | "intake_in_progress"
  | "documents_in_progress"
  | "in_review"
  | "ready_for_submission"
  | "submitted"
  | "awaiting_decision"
  | "decision_received"
  | "closed";

/**
 * Case-level risk assessment set/overridden by the practitioner. Distinct
 * from the stream's `LiabilityTier` (src/config/immigration-streams/schema.ts),
 * which classifies the stream itself — a case's risk tier is informed by,
 * but tracked independently of, its stream's liability tier (e.g. a
 * phase-3-restricted stream's cases will typically but not necessarily be
 * "high").
 */
export type RiskTier = "standard" | "elevated" | "high";

export interface Case {
  id: CaseId;
  firmId: FirmId;
  clientId: ClientId;
  streamKey: string; // ImmigrationStreamConfig.key
  streamConfigVersion: number; // pinned config version at time of case creation
  title: string;
  status: CaseStatus;
  assignedPractitionerId: UserId | null;
  assignedAssistantId: UserId | null;
  currentMilestone: MilestoneKey;
  riskTier: RiskTier;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// ---------------------------------------------------------------------------
// 6. CaseParticipant
// ---------------------------------------------------------------------------

export type ParticipantRelationship =
  | "principal_applicant"
  | "spouse"
  | "common_law_partner"
  | "dependant_child"
  | "sponsor"
  | "other_family_member";

export interface CaseParticipant {
  id: CaseParticipantId;
  caseId: CaseId;
  relationship: ParticipantRelationship;
  legalName: string;
  dateOfBirth: EncryptedString;
  metadata: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// 7. ImmigrationStreamConfig — see src/config/immigration-streams/schema.ts
// for the full configuration shape. The domain type here is the minimal
// reference used by Case/IntakeResponse/DocumentRequirement.
// ---------------------------------------------------------------------------

export interface ImmigrationStreamConfigRef {
  key: string;
  version: number;
}

// ---------------------------------------------------------------------------
// 8. IntakeResponse
// ---------------------------------------------------------------------------

export type IntakeCompletionStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "reviewed";

export interface IntakeResponse {
  id: IntakeResponseId;
  caseId: CaseId;
  streamConfigVersion: number;
  answers: Record<string, unknown>;
  completionStatus: IntakeCompletionStatus;
  submittedAt: ISODateString | null;
  reviewedAt: ISODateString | null;
}

// ---------------------------------------------------------------------------
// 9. DocumentRequirement
// ---------------------------------------------------------------------------

export type DocumentRequirementStatus =
  | "missing"
  | "uploaded"
  | "needs_review"
  | "approved"
  | "rejected"
  | "not_applicable";

export interface DocumentRequirement {
  id: DocumentRequirementId;
  caseId: CaseId;
  /** Stream config version this requirement was materialized from (see Case.streamConfigVersion). */
  streamConfigVersion: number;
  participantId: CaseParticipantId | null;
  requirementKey: string;
  label: string;
  category: string;
  required: boolean;
  status: DocumentRequirementStatus;
  reason: string | null;
  sortOrder: number;
}

// ---------------------------------------------------------------------------
// 10. Document / 11. DocumentVersion
// ---------------------------------------------------------------------------

export type UploadSource = "client_portal" | "practitioner_upload" | "assistant_upload";

export type DocumentStatus =
  | "uploaded"
  | "processing"
  | "needs_review"
  | "approved"
  | "rejected"
  | "duplicate";

export interface Document {
  id: DocumentId;
  firmId: FirmId;
  caseId: CaseId;
  participantId: CaseParticipantId | null;
  requirementId: DocumentRequirementId | null;
  originalFilename: string;
  normalizedFilename: string;
  storagePath: string;
  mimeType: string;
  size: number;
  checksum: string;
  uploadSource: UploadSource;
  documentStatus: DocumentStatus;
  exhibitLabel: string | null;
  uploadedBy: UserId;
  uploadedAt: ISODateString;
}

/** Append-only. A new upload creates a new version; never overwrite storage_path. */
export interface DocumentVersion {
  documentId: DocumentId;
  version: number;
  storagePath: string;
  checksum: string;
  createdBy: UserId;
  createdAt: ISODateString;
}

// ---------------------------------------------------------------------------
// AI output review lifecycle (shared across extraction/classification/
// timeline/evidence outputs)
// ---------------------------------------------------------------------------

export type ReviewStatus = "pending_review" | "approved" | "rejected" | "overridden";

/**
 * Metadata every AI-generated record must carry (docs/ai-processing-pipeline.md).
 * `confidence` is scoped to whatever the extending entity represents (e.g. an
 * overall extraction run, a single field, a document classification, a
 * timeline event, or an evidence assessment) — see the comment on each
 * entity's own `confidence`-bearing field for the exact scope.
 */
export interface AiOutputMetadata {
  provider: string;
  model: string;
  schemaVersion: number;
  generatedAt: ISODateString;
  confidence: number; // 0..1
}

// ---------------------------------------------------------------------------
// 12. ExtractionRun / 13. ExtractedField
// ---------------------------------------------------------------------------

export type ExtractionRunStatus = "queued" | "running" | "completed" | "failed";

/** Confidence (inherited from AiOutputMetadata) is the aggregate across the whole run; see ExtractedField.confidence for per-field confidence. */
export interface ExtractionRun extends AiOutputMetadata {
  id: ExtractionRunId;
  documentId: DocumentId;
  status: ExtractionRunStatus;
  extractedJson: Record<string, unknown>;
  startedAt: ISODateString | null;
  completedAt: ISODateString | null;
}

export interface SourceCoordinates {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ExtractedField {
  id: ExtractedFieldId;
  extractionRunId: ExtractionRunId;
  caseId: CaseId;
  documentId: DocumentId;
  fieldKey: string;
  /**
   * Encrypted at the persistence layer when this field's ExtractionFieldSchema
   * (src/config/immigration-streams/schema.ts) has `sensitive: true`. Not
   * typed as `EncryptedString` because sensitivity is schema-driven per
   * `fieldKey`, not statically known from this generic shape.
   */
  extractedValue: string;
  /** Confidence for this specific field, independent of the parent ExtractionRun's overall confidence. */
  confidence: number;
  sourcePage: number | null;
  sourceCoordinates: SourceCoordinates | null;
  reviewStatus: ReviewStatus;
  approvedValue: string | null;
  approvedBy: UserId | null;
  approvedAt: ISODateString | null;
}

// ---------------------------------------------------------------------------
// 14. ClassificationResult
// ---------------------------------------------------------------------------

export interface ClassificationAlternative {
  category: string;
  confidence: number;
}

export interface ClassificationResult extends AiOutputMetadata {
  id: ClassificationResultId;
  documentId: DocumentId;
  /** Ordinal per document; the row with the highest runVersion for a given documentId is authoritative. */
  runVersion: number;
  /** True only for the authoritative (highest runVersion) row per document; re-classification sets the prior row's isLatest to false instead of deleting it. */
  isLatest: boolean;
  predictedCategory: string;
  alternatives: ClassificationAlternative[];
  finalCategory: string | null;
  reviewStatus: ReviewStatus;
  reviewedBy: UserId | null;
  reviewedAt: ISODateString | null;
}

// ---------------------------------------------------------------------------
// 15. CaseFact
// ---------------------------------------------------------------------------

export interface ValidityPeriod {
  startDate: ISODateString | null;
  endDate: ISODateString | null;
}

export interface CaseFact {
  id: CaseFactId;
  caseId: CaseId;
  participantId: CaseParticipantId | null;
  factType: string;
  value: string;
  sourceDocumentId: DocumentId;
  validityPeriod: ValidityPeriod | null;
  approvedBy: UserId;
  approvedAt: ISODateString;
}

// ---------------------------------------------------------------------------
// 16. EvidenceAssessment
// ---------------------------------------------------------------------------

/**
 * Descriptive evidence completeness only — never legal sufficiency or a
 * success/approval likelihood. See docs/architecture.md §10.
 */
export type EvidenceStrength = "weak" | "moderate" | "strong";

export interface EvidenceAssessment extends AiOutputMetadata {
  id: EvidenceAssessmentId;
  caseId: CaseId;
  requirementId: DocumentRequirementId;
  strength: EvidenceStrength;
  reason: string;
  supportingDocumentIds: DocumentId[];
  reviewStatus: ReviewStatus;
  approvedBy: UserId | null;
  approvedAt: ISODateString | null;
}

// ---------------------------------------------------------------------------
// 17. CaseFlag
// ---------------------------------------------------------------------------

export type CaseFlagType =
  | "missing_document"
  | "inconsistency"
  | "duplicate_document"
  | "unexplained_gap"
  | "low_confidence_extraction"
  | "expiring_document";

export type CaseFlagSeverity = "low" | "medium" | "high";

export type CaseFlagStatus = "open" | "in_progress" | "resolved" | "dismissed";

export type RaisedByType = "ai" | "human" | "system";

export interface CaseFlag {
  id: CaseFlagId;
  caseId: CaseId;
  type: CaseFlagType;
  severity: CaseFlagSeverity;
  title: string;
  /** Human-readable explanation of which documents/facts caused this flag. */
  description: string;
  relatedDocumentIds: DocumentId[];
  relatedFieldIds: ExtractedFieldId[];
  /**
   * Resolution lifecycle for the flag itself — intentionally a separate
   * vocabulary from `ReviewStatus`, since resolving a flag (open -> resolved)
   * is a distinct action from approving/rejecting the AI output that may have
   * raised it.
   */
  status: CaseFlagStatus;
  raisedByType: RaisedByType;
  /** Present only when raisedByType === "ai"; null for human/system-raised flags. */
  aiMetadata: AiOutputMetadata | null;
  assignedTo: UserId | null;
  resolvedBy: UserId | null;
  resolutionNote: string | null;
  createdAt: ISODateString;
  resolvedAt: ISODateString | null;
}

// ---------------------------------------------------------------------------
// 18. TimelineEvent
// ---------------------------------------------------------------------------

export interface TimelineEvent extends AiOutputMetadata {
  id: TimelineEventId;
  caseId: CaseId;
  participantId: CaseParticipantId | null;
  eventType: string;
  title: string;
  startDate: ISODateString;
  endDate: ISODateString | null;
  sourceDocumentIds: DocumentId[];
  reviewStatus: ReviewStatus;
  approvedBy: UserId | null;
  approvedAt: ISODateString | null;
}

// ---------------------------------------------------------------------------
// 19. CaseMilestone
// ---------------------------------------------------------------------------

/**
 * Granular milestone keys with full audit history via CaseMilestone rows.
 * See CaseStatus for the coarse-grained lifecycle field kept in sync with these.
 */
export type MilestoneKey =
  | "intake"
  | "documents_complete"
  | "forms_ready"
  | "submitted"
  | "awaiting_decision"
  | "decision_received";

export type MilestoneStatus = "pending" | "in_progress" | "completed";

export interface CaseMilestone {
  id: CaseMilestoneId;
  caseId: CaseId;
  milestone: MilestoneKey;
  status: MilestoneStatus;
  completedBy: UserId | null;
  completedAt: ISODateString | null;
}

// ---------------------------------------------------------------------------
// 20. Deadline
// ---------------------------------------------------------------------------

export type DeadlineStatus = "upcoming" | "due_soon" | "overdue" | "completed" | "cancelled";

export interface ReminderSchedule {
  /** Days-before-due-date offsets at which a reminder fires. Default: [30, 15, 3]. */
  offsetsDays: number[];
}

export interface Deadline {
  id: DeadlineId;
  caseId: CaseId;
  documentId: DocumentId | null;
  type: string;
  dueDate: ISODateString;
  reminderSchedule: ReminderSchedule;
  status: DeadlineStatus;
  createdBy: UserId;
}

// ---------------------------------------------------------------------------
// 21. MessageThread / Message
// ---------------------------------------------------------------------------

export interface MessageThread {
  id: MessageThreadId;
  caseId: CaseId;
  createdAt: ISODateString;
}

export interface Message {
  id: MessageId;
  threadId: MessageThreadId;
  senderId: UserId;
  senderRole: UserRole;
  body: string;
  createdAt: ISODateString;
}

// ---------------------------------------------------------------------------
// 22. AgreementTemplate / 23. Agreement
// ---------------------------------------------------------------------------

export type AgreementTemplateType = "ica" | "retainer";

export interface AgreementTemplate {
  id: AgreementTemplateId;
  firmId: FirmId;
  type: AgreementTemplateType;
  contentTemplate: string;
  version: number;
  createdAt: ISODateString;
}

export type SignatureStatus = "unsigned" | "sent" | "signed" | "voided";

export interface Agreement {
  id: AgreementId;
  caseId: CaseId;
  templateId: AgreementTemplateId;
  renderedDocument: string;
  mergeData: Record<string, unknown>;
  signatureStatus: SignatureStatus;
  signerIp: string | null;
  signedAt: ISODateString | null;
}

// ---------------------------------------------------------------------------
// 24. Approval — central approval entity for all AI-output sign-off
// ---------------------------------------------------------------------------

export type ApprovableEntityType =
  | "extracted_field"
  | "classification_result"
  | "evidence_assessment"
  | "timeline_event"
  | "case_flag_resolution";

export type ApprovalAction = "approve" | "reject" | "override";

export interface Approval {
  id: ApprovalId;
  caseId: CaseId;
  entityType: ApprovableEntityType;
  entityId: string;
  action: ApprovalAction;
  approvedBy: UserId;
  approvedAt: ISODateString;
  version: number;
  notes: string | null;
}

// ---------------------------------------------------------------------------
// 25. AuditEvent — immutable, append-only
// ---------------------------------------------------------------------------

export interface AuditEvent {
  id: AuditEventId;
  firmId: FirmId;
  caseId: CaseId | null;
  actorId: UserId | null; // null for system-generated events
  actorRole: UserRole | "system";
  action: string;
  entityType: string;
  entityId: string;
  beforeHash: string | null;
  afterHash: string | null;
  metadata: Record<string, unknown>;
  timestamp: ISODateString;
}

// ---------------------------------------------------------------------------
// 26. Notification
// ---------------------------------------------------------------------------

export type NotificationChannel = "email" | "in_app";

export type NotificationStatus = "scheduled" | "sent" | "failed" | "cancelled";

export interface Notification {
  id: NotificationId;
  recipient: UserId;
  channel: NotificationChannel;
  eventType: string;
  caseId: CaseId;
  scheduledAt: ISODateString;
  sentAt: ISODateString | null;
  status: NotificationStatus;
}

// ---------------------------------------------------------------------------
// 27. ComplianceExport
// ---------------------------------------------------------------------------

export interface ComplianceExport {
  id: ComplianceExportId;
  caseId: CaseId;
  requestedBy: UserId;
  generatedFilePath: string;
  generatedAt: ISODateString;
  checksum: string;
}
