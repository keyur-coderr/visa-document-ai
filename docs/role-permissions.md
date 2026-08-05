# Role Permissions

Three roles exist: `practitioner`, `assistant`, `client`. Permissions are
enforced in three independent layers — **UI hiding is never authorization on
its own**:

1. **UI** — hide/disable actions the current role cannot perform.
2. **Server services** (`server/services`, server actions, route handlers) —
   re-check role, firm membership, and case assignment before every mutation
   or sensitive read.
3. **Database RLS** — Postgres Row-Level Security policies scoped by
   `firm_id`, `case_id` assignment, and role, as the final backstop even if
   application code has a bug.

Typed capability definitions live in
[src/types/permissions.ts](../src/types/permissions.ts).

## Practitioner

- Full access to firm cases as permitted by firm membership.
- Create and assign cases.
- Review AI output; approve, reject, or override.
- Generate compliance exports.
- Manage agreements (ICA, retainer).
- Manage team (invite/remove assistants, assign practitioners).
- Manage firm branding and settings.

## Assistant

- Access limited to **assigned** cases only.
- Generate client intake links.
- Organize documents, review upload quality.
- Communicate with clients (messages).
- Mark a case "ready for practitioner review".
- **Cannot** provide final approval on any AI output.
- **Cannot** generate compliance exports.
- **Cannot** edit protected legal/core fields (approved facts, agreements).
- **Cannot** manage billing or firm security settings.

## Client

- Access limited to **their own** cases only.
- View case status.
- Complete intake.
- Upload documents per checklist item.
- View upload status (received/outstanding/needs re-upload).
- Receive and respond to re-upload requests.
- Send/receive lightweight case messages.
- Download their own documents.
- Update limited profile fields (contact info, language preference).

## Enforcement Notes

- Every server action/route handler must resolve the caller's `firm_id`
  (practitioner/assistant) or `client_id` (client) from the authenticated
  session — never from client-supplied input — before evaluating a
  permission.
- Assistant case access is scoped by explicit assignment
  (`Case.assigned_assistant_id` or a future assignment table), not blanket
  firm access.
- Approval-type actions (`Approval` entity creation, `CaseFlag` resolution)
  are restricted to `practitioner` at the service layer regardless of what
  the UI renders.
- RLS policies mirror this matrix per table in `supabase/policies/` (added in
  Phase 4) — e.g., clients can `SELECT`/`UPDATE` only rows where
  `case.client_id` matches their own client record, and can never read
  `AuditEvent` or another client's data.
