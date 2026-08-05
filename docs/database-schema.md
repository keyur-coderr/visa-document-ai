# Database Schema (Phase 0 Design)

This document is the source-of-truth entity list for the Postgres schema
that will be created as SQL migrations in Phase 4
(`supabase/migrations/`). TypeScript mirrors of every entity are in
[src/types/domain.ts](../src/types/domain.ts). No migrations are created in
Phase 0.

Conventions:
- All tables carry `id` (UUID, PK), `created_at`, and `updated_at` unless
  noted otherwise.
- Firm-scoped tables carry `firm_id` for RLS tenant isolation.
- `AuditEvent` is the only table that is insert-only at the RLS/service
  layer (no `UPDATE`/`DELETE` grants).

## 1. Firm
`id, name, logo, brand_color, license_details, jurisdiction,
retention_policy, created_at, updated_at`

## 2. User
`id, firm_id, role (practitioner|assistant|client), full_name, email,
status, mfa_enabled, created_at`

## 3. FirmMembership
`firm_id, user_id, role, status, invited_by, joined_at`

## 4. Client
`id, firm_id, user_id?, legal_name, preferred_name, email, phone, language,
date_of_birth (encrypted), created_at, updated_at`

## 5. Case
`id, firm_id, client_id, stream_key, title, status,
assigned_practitioner_id, assigned_assistant_id, current_milestone,
risk_tier, created_at, updated_at`

## 6. CaseParticipant
Spouse, dependants, sponsors, family members.
`id, case_id, relationship, legal_name, date_of_birth, metadata (jsonb)`

## 7. ImmigrationStreamConfig
`key, name, phase, liability_tier, intake_schema (jsonb), checklist_schema
(jsonb), evidence_rules (jsonb), timeline_rules (jsonb), drafting_rules
(jsonb), active, version`

## 8. IntakeResponse
`id, case_id, stream_config_version, answers (jsonb), completion_status,
submitted_at, reviewed_at`

## 9. DocumentRequirement
Materialized from stream configuration at case creation.
`id, case_id, participant_id?, requirement_key, label, category, required,
status, reason, sort_order`

## 10. Document
`id, firm_id, case_id, participant_id?, requirement_id?, original_filename,
normalized_filename, storage_path, mime_type, size, checksum, upload_source,
document_status, exhibit_label, uploaded_by, uploaded_at`

## 11. DocumentVersion
Append-only; never overwrite the sole copy of a file.
`document_id, version, storage_path, checksum, created_by, created_at`

## 12. ExtractionRun
`id, document_id, provider, model, status, extracted_json (jsonb),
confidence, schema_version, started_at, completed_at`

## 13. ExtractedField
`id, extraction_run_id, case_id, document_id, field_key, extracted_value
(encrypted where required), confidence, source_page, source_coordinates,
review_status, approved_value, approved_by, approved_at`

## 14. ClassificationResult
`id, document_id, predicted_category, confidence, alternatives (jsonb),
final_category, reviewed_by, reviewed_at`

## 15. CaseFact
Normalized, approved facts only.
`id, case_id, participant_id?, fact_type, value, source_document_id,
validity_period, approved_by, approved_at`

## 16. EvidenceAssessment
Descriptive evidence completeness — **not** legal sufficiency.
`id, case_id, requirement_id, strength (weak|moderate|strong), reason,
supporting_document_ids (uuid[]), generated_at, approved_by`

## 17. CaseFlag
AI-created flags must never be silently resolved.
`id, case_id, type, severity, title, description, related_document_ids
(uuid[]), related_field_ids (uuid[]), status, raised_by_type (ai|human|
system), assigned_to, resolved_by, resolution_note, created_at, resolved_at`

## 18. TimelineEvent
`id, case_id, participant_id?, event_type, title, start_date, end_date,
source_document_ids (uuid[]), confidence, review_status, approved_by`

## 19. CaseMilestone
`id, case_id, milestone (intake|documents_complete|forms_ready|submitted|
awaiting_decision|decision_received), status, completed_by, completed_at`

## 20. Deadline
Default staged alerts: 30 / 15 / 3 days.
`id, case_id, document_id?, type, due_date, reminder_schedule (jsonb),
status, created_by`

## 21. MessageThread / Message
Lightweight case-related communication only.
`MessageThread: id, case_id, created_at`
`Message: id, thread_id, sender_id, sender_role, body, created_at`

## 22. AgreementTemplate
`id, firm_id, type (ica|retainer), content_template, version, created_at`

## 23. Agreement
`case_id, template_id, rendered_document, merge_data (jsonb),
signature_status, signer_ip, signed_at`

## 24. Approval
Central approval entity — all AI-output sign-off flows through this table.
`case_id, entity_type, entity_id, action, approved_by, approved_at, version,
notes`

## 25. AuditEvent
Immutable, append-only. No update/delete at the RLS or service layer.
`firm_id, case_id, actor_id, actor_role, action, entity_type, entity_id,
before_hash, after_hash, metadata (jsonb), timestamp`

## 26. Notification
`recipient, channel, event_type, case_id, scheduled_at, sent_at, status`

## 27. ComplianceExport
`case_id, requested_by, generated_file_path, generated_at, checksum`

---

## Relationship Notes

- `Firm 1—N User` via `FirmMembership` (many-to-many with role/status per
  membership).
- `Firm 1—N Client 1—N Case`; `Case N—1 ImmigrationStreamConfig` (by
  `stream_key`, pinned to `stream_config_version` on the case/intake).
- `Case 1—N CaseParticipant`; most document/extraction/timeline records
  optionally reference a `participant_id` for family-member-specific data.
- `Document 1—N DocumentVersion`, `Document 1—N ExtractionRun`,
  `Document 1—1 ClassificationResult` (latest), `Document 1—1
  DocumentRequirement` (optional link when the upload satisfies a
  checklist item).
- `ExtractionRun 1—N ExtractedField`; approved fields may be promoted into
  `CaseFact`.
- `CaseFlag`, `TimelineEvent`, `EvidenceAssessment`, `ExtractedField`,
  `ClassificationResult` all route through `Approval` when a human signs off.
- `AuditEvent` references `firm_id`/`case_id`/`actor_id` but is otherwise
  independent — it must remain queryable even if referenced entities are
  later archived.

## RLS Direction (implemented in Phase 4)

- Every firm-scoped table: `firm_id = auth.jwt() firm claim` (or equivalent
  membership lookup) for practitioner/assistant roles.
- `Case`/`Document`/related tables for `client` role: restricted to rows
  where `case.client_id` matches the caller's client record.
- `Case`/related tables for `assistant` role: restricted to rows where the
  case is assigned to that assistant.
- `AuditEvent`: `INSERT` only for service-role/trusted server contexts;
  `SELECT` restricted to practitioners of the owning firm; no `UPDATE`/
  `DELETE` grants for any role.
