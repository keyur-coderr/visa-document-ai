# Security Model

## Data Residency and Transport

- Canadian data residency is required for production infrastructure and must
  be verified (Supabase project region, hosting region) before any
  production deployment.
- TLS in transit everywhere.
- Encryption at rest for all storage and database volumes.

## Field-Level Encryption

- Passport numbers, UCI numbers, and other highly sensitive identifiers are
  encrypted at the field level (application-layer encryption via
  `lib/encryption/`), not relied upon solely for database/disk encryption.
- Encrypted fields are typed distinctly in `types/domain.ts` (see
  `EncryptedString`) so it is obvious at the type level which fields require
  encryption-aware handling before use.

## Tenant and Role Isolation

- Strict firm tenant isolation: every firm-scoped table carries `firm_id`,
  and RLS policies deny cross-firm reads/writes unconditionally.
- Strict role isolation within a firm: assistants see only assigned cases;
  clients see only their own case(s). See
  [role-permissions.md](./role-permissions.md).
- Enforcement is layered: UI, server service, and RLS all independently
  check tenant/role scope. UI hiding alone is never treated as
  authorization.

## Storage and Documents

- Private storage buckets only — no public document URLs ever.
- Signed, time-expiring URLs for all document access (upload and download).
- Checksum (e.g., SHA-256) validation on upload and on each subsequent
  access to detect corruption/tampering.
- `DocumentVersion` is append-only; new uploads create a new version rather
  than overwriting the existing file.

## Authentication and Sessions

- MFA required for practitioners.
- Assistants onboard via invitation-based accounts.
- Clients authenticate via magic link by default, with an explicit,
  short expiry.
- Secure session timeout and rotation.
- Rate limiting and abuse protection on login/session endpoints and
  magic-link issuance.

## Audit

- `AuditEvent` is immutable and append-only — no update or delete code path
  exists at the application or database layer (enforced by RLS/permissions
  denying `UPDATE`/`DELETE` on the table).
- Every AI action and every human action (upload, review, approval,
  override, export, agreement signature) produces an audit event with actor,
  role, action, entity reference, before/after hashes, and timestamp.
- Access to sensitive files is itself audited (who viewed/downloaded which
  document, when).

## Secrets and Server Boundaries

- Secrets are managed via environment variables only; never committed.
- Supabase service-role keys and any AI/OCR provider keys are used only in
  server-side code (`lib/supabase/admin.ts`, `server/ai`, `server/ocr`) and
  are never bundled into client code.
- AI/OCR calls happen only from server actions, route handlers, or job
  workers — never directly from the browser.
- Least-privilege database access: application roles use the minimum grants
  required; the service-role key is reserved for trusted server contexts
  (e.g., admin/job operations), not general request handling.

## AI Provider Data Handling

- Where provider terms allow contractual control, client data is not used
  to train third-party models.
- No advertising, no data sale.
- A documented data retention policy governs how long case data, documents,
  and AI outputs are retained, with an explicit deletion/retention workflow
  (see `CaseFact`/`ComplianceExport`/retention fields on `Firm`).

## Logging

Never log:
- Passport numbers or UCI numbers
- Raw document content
- Authentication tokens
- Encryption keys

Only metadata-only structured logs are permitted (e.g., document id,
checksum, status, provider name, duration, error code) — never the sensitive
payload itself.
