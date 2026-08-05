# MVP Roadmap

Phase 0 is complete once this document and the rest of the architecture
foundation exist. Phases 1–12 are executed in order; each phase should be
demoable before the next begins.

## Phase 0 — Architecture (this phase)
- Architecture document, folder structure, domain types, database schema,
  role matrix, stream config schema, AI provider interfaces (contracts only),
  security boundaries.

## Phase 1 — UI Foundation
- Design system, layouts, authentication screens, dashboard shells,
  empty/loading/error states, navigation.

## Phase 2 — Core Case Management (mock data)
- Clients, cases, participants, stream selection, case dashboard, case
  status, assignments — no Supabase yet.

## Phase 3 — Stream-Config Intake and Checklist
- Schema-driven forms, Phase 1 stream configurations populated, conditional
  fields, generated checklist, version tracking.

## Phase 4 — Supabase Foundation
- Database migrations, authentication, RLS policies, storage buckets, signed
  URLs, roles, tenant isolation.

## Phase 5 — Client Portal
- Magic-link authentication, intake, checklist, per-item uploads, status,
  messages, download own documents.

## Phase 6 — Document Workflow
- Secure uploads, checksums, versions, preview, image orientation
  correction, normalized naming, exhibit labels.

## Phase 7 — AI Document Intelligence
- OCR provider interface implementation, AI provider interface
  implementation, extraction schemas, classification, confidence/source
  metadata, duplicate detection.

## Phase 8 — Review Screen
- Document viewer, extracted fields panel, inline edits, approvals,
  overrides, action list, audit events.

## Phase 9 — Gap, Evidence and Timeline
- Missing checklist items, inconsistency flags, evidence completeness,
  timeline reconstruction, unexplained-gap flags.

## Phase 10 — Deadlines and Notifications
- Deadlines, 30/15/3-day alerts, missing-document reminders, email and
  in-app notifications.

## Phase 11 — Compliance
- Immutable audit history, activity feed, compliance export, ICA, retainer,
  basic e-signature.

## Phase 12 — Production Readiness
- Authorization testing, security testing, accessibility, mobile client
  upload testing, performance, error monitoring, privacy/retention
  documentation, deployment.

---

## Immigration Stream Rollout

The stream config schema (`src/config/immigration-streams/schema.ts`) must
support all 18 streams below. Only Phase 1 streams are populated with real
intake/checklist/extraction content initially; Phase 2/3 entries exist as
inactive placeholders (`active: false`) so the registry shape is stable.

**Phase 1 — implemented with full configuration:**
- Express Entry — Federal Skilled Worker
- Express Entry — Canadian Experience Class
- Express Entry — Federal Skilled Trades
- Spousal Sponsorship — Inland
- Spousal Sponsorship — Outland
- Visitor Visa / TRV
- Study Permit
- Work Permit — LMIA-Based
- Work Permit — LMIA-Exempt

**Phase 2 — placeholders only:**
- PNP
- Parent & Grandparent Sponsorship
- Start-Up Visa
- Self-Employed
- Quebec Skilled Worker
- PEQ
- Quebec Investor & Entrepreneur

**Phase 3 — placeholders only, higher liability tier:**
- Humanitarian & Compassionate
- Refugee Claims
- PRRA
- TRP (where substantive drafting risk requires additional review)

Phase 3 streams must use a separate, slower, explicitly acknowledged review
workflow (`liabilityTier: "phase-3-restricted"`) rather than the standard
review flow used by Phase 1/2 streams.

## Architectural Recommendations Carried From Day One

These are represented in the domain model and schemas now, even though most
are not functional until later phases:

1. Configuration versioning on every case/intake response.
2. Document versioning (append-only `DocumentVersion`).
3. Source provenance on every extracted value/timeline event.
4. Central `Approval` entity for all AI-output sign-off.
5. Append-only `AuditEvent` (no update/delete).
6. Async job design — OCR/AI never block HTTP requests.
7. Idempotent extraction — retries must not duplicate outputs.
8. Provider abstraction for OCR and AI vendors.
9. Feature flags for gradual stream/AI rollout.
10. Data retention/archival/deletion architecture.
11. Observability on job failures/duration/provider usage without logging
    sensitive content.
12. Human-readable AI explanations on every `CaseFlag`.
13. Accessibility (keyboard + screen reader) on review and client flows.
14. English/French readiness — no user-facing copy hardcoded in business
    logic.
15. Descriptive Case Health Summary — never an eligibility/approval score.
