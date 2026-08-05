# AI Processing Pipeline

The pipeline is asynchronous end-to-end: OCR and AI work never block an HTTP
request/response cycle. Upload requests enqueue work and return immediately;
results become visible to practitioners/assistants once jobs complete.

## Upload Flow

1. Validate MIME type and extension.
2. Calculate checksum (e.g., SHA-256).
3. Malware/security scan placeholder (interface reserved, no vendor wired up
   in Phase 0).
4. Correct image orientation (mobile photo EXIF handling).
5. Store the file encrypted in a private bucket.
6. Create an immutable upload `AuditEvent`.
7. Queue OCR.
8. Queue document classification.
9. Queue structured extraction.
10. Queue duplicate detection.
11. Queue checklist matching.
12. Queue timeline-event extraction.
13. Queue inconsistency detection.
14. Persist all AI outputs with `review_status: pending_review` — never as
    final.
15. Notify the assigned practitioner/assistant.
16. Require human review before any output is treated as approved.

## Job Design Requirements

- **Async by construction** — implemented via `server/jobs`, decoupled from
  the request that triggered them.
- **Idempotent** — retrying a job (e.g., after a transient provider failure)
  must not create duplicate `ExtractionRun`/`ClassificationResult`/
  `TimelineEvent` rows. Jobs are keyed so re-execution updates/reuses the
  existing run rather than inserting a duplicate.
- **Provider-abstracted** — `server/ai/provider.ts` and `server/ocr/
  provider.ts` are the only integration points; swapping vendors does not
  touch domain/service logic.
- **Structured JSON only** — every provider call returns data validated
  against a versioned schema in `server/ai/schemas.ts`. Unrestricted
  free-text is never treated as canonical output.
- **Observable** — job failures, processing duration, and provider usage are
  tracked without logging sensitive content (see
  [security-model.md](./security-model.md#logging)).

## Required Metadata on Every AI Output

Every AI-generated record (`ExtractionRun`/`ExtractedField`,
`ClassificationResult`, `TimelineEvent`, `EvidenceAssessment`) must carry:

- `provider`
- `model` / version
- prompt/schema version
- `generated_at`
- `confidence` (scoped to that record — see
  [database-schema.md](./database-schema.md) for the run-level vs
  field-level vs document-level distinction)
- source document reference
- source page (where applicable)
- source coordinates (where possible)
- `status`: `pending_review | approved | rejected | overridden`
- reviewer identity (once reviewed)
- review timestamp (once reviewed)

`CaseFlag` is a partial exception: it can be raised by `ai`, `human`, or
`system` (`raised_by_type`), so the provider/model/schema-version/confidence/
generated-at fields are populated only when `raised_by_type = 'ai'` (null
otherwise). A `CaseFlag`'s own `status` (`open|in_progress|resolved|
dismissed`) tracks the flag's resolution lifecycle and is intentionally a
different vocabulary from the `pending_review|approved|rejected|overridden`
review status used on the other AI outputs above — resolving a flag is a
distinct action from approving/rejecting the AI output that may have raised
it.

This metadata contract is what allows the review screen to always show
provenance and confidence, and lets `CaseFlag`s explain — in human-readable
terms — which documents/fields caused them (see architectural recommendation
#12 in [mvp-roadmap.md](./mvp-roadmap.md)).

## Explicitly Out of Scope for This Pipeline

- No eligibility determination or approval-probability output.
- No autonomous resolution of `CaseFlag`s — AI-raised flags can only be
  resolved by a human reviewer; they are never silently auto-resolved.
- No IRCC portal submission or scraping triggered by pipeline completion.
- No free-text legal advice generation.
