/**
 * Permission model for Visa Document AI.
 *
 * These types describe the capability matrix documented in
 * docs/role-permissions.md. They are the shared vocabulary used by:
 *  - UI components (to hide/disable actions),
 *  - server services/server actions (to enforce authorization — the real
 *    boundary), and
 *  - eventually generated/cross-checked against Postgres RLS policies.
 *
 * UI-level use of this module is never sufficient authorization on its own;
 * every mutating server action must independently re-check the caller's role
 * and tenant/case scope.
 */

import type { CaseId, FirmId, UserRole } from "./domain";

// ---------------------------------------------------------------------------
// Resources and actions
// ---------------------------------------------------------------------------

export type PermissionResource =
  | "firm_settings"
  | "firm_branding"
  | "team_members"
  | "billing"
  | "client"
  | "case"
  | "intake"
  | "checklist"
  | "document"
  | "extracted_field"
  | "classification_result"
  | "evidence_assessment"
  | "timeline_event"
  | "case_flag"
  | "case_milestone"
  | "deadline"
  | "message"
  | "agreement"
  | "approval"
  | "compliance_export"
  | "audit_event";

export type PermissionAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "approve"
  | "reject"
  | "override"
  | "assign"
  | "export";

/** A single grantable capability: an action on a resource. */
export interface Permission {
  resource: PermissionResource;
  action: PermissionAction;
}

// ---------------------------------------------------------------------------
// Capability matrix
// ---------------------------------------------------------------------------

/**
 * Declarative capability list per role, matching docs/role-permissions.md.
 * This is intentionally coarse-grained (resource + action); fine-grained
 * scoping (own case only, assigned case only) is expressed by
 * `PermissionScope` below and must be applied in addition to this matrix.
 */
export const ROLE_CAPABILITIES: Record<UserRole, Permission[]> = {
  practitioner: [
    { resource: "firm_settings", action: "update" },
    { resource: "firm_branding", action: "update" },
    { resource: "team_members", action: "create" },
    { resource: "team_members", action: "update" },
    { resource: "team_members", action: "delete" },
    { resource: "client", action: "create" },
    { resource: "client", action: "read" },
    { resource: "client", action: "update" },
    { resource: "case", action: "create" },
    { resource: "case", action: "read" },
    { resource: "case", action: "update" },
    { resource: "case", action: "assign" },
    { resource: "intake", action: "read" },
    { resource: "checklist", action: "read" },
    { resource: "checklist", action: "update" },
    { resource: "document", action: "read" },
    { resource: "document", action: "update" },
    { resource: "extracted_field", action: "approve" },
    { resource: "extracted_field", action: "reject" },
    { resource: "extracted_field", action: "override" },
    { resource: "classification_result", action: "approve" },
    { resource: "classification_result", action: "override" },
    { resource: "evidence_assessment", action: "approve" },
    { resource: "timeline_event", action: "approve" },
    { resource: "timeline_event", action: "override" },
    { resource: "case_flag", action: "read" },
    { resource: "case_flag", action: "update" },
    { resource: "case_milestone", action: "update" },
    { resource: "deadline", action: "create" },
    { resource: "deadline", action: "update" },
    { resource: "message", action: "create" },
    { resource: "message", action: "read" },
    { resource: "agreement", action: "create" },
    { resource: "agreement", action: "update" },
    { resource: "approval", action: "create" },
    { resource: "compliance_export", action: "export" },
    { resource: "audit_event", action: "read" },
  ],
  assistant: [
    { resource: "client", action: "read" },
    { resource: "case", action: "read" },
    { resource: "intake", action: "read" },
    { resource: "intake", action: "create" },
    { resource: "checklist", action: "read" },
    { resource: "checklist", action: "update" },
    { resource: "document", action: "create" },
    { resource: "document", action: "read" },
    { resource: "document", action: "update" },
    { resource: "extracted_field", action: "read" },
    { resource: "classification_result", action: "read" },
    { resource: "case_flag", action: "read" },
    { resource: "case_milestone", action: "update" }, // limited to "ready for review" transitions
    { resource: "message", action: "create" },
    { resource: "message", action: "read" },
  ],
  client: [
    { resource: "case", action: "read" },
    { resource: "intake", action: "create" },
    { resource: "intake", action: "update" },
    { resource: "checklist", action: "read" },
    { resource: "document", action: "create" },
    { resource: "document", action: "read" },
    { resource: "message", action: "create" },
    { resource: "message", action: "read" },
    { resource: "client", action: "update" }, // own profile, limited fields
  ],
};

// ---------------------------------------------------------------------------
// Scoping — a capability grant is meaningless without tenant/case scope
// ---------------------------------------------------------------------------

/** How a resource is scoped for a given caller when checking authorization. */
export type PermissionScope =
  | { kind: "firm"; firmId: FirmId }
  | { kind: "assigned_case"; caseId: CaseId }
  | { kind: "own_case"; caseId: CaseId };

export interface AuthorizationContext {
  userId: string;
  role: UserRole;
  firmId: FirmId | null;
}

/**
 * Pure capability check (matrix lookup only). Callers MUST additionally
 * verify tenant/case scope (firm membership, case assignment, or case
 * ownership) before allowing the action — see docs/role-permissions.md
 * "Enforcement Notes".
 */
export function hasCapability(role: UserRole, permission: Permission): boolean {
  return ROLE_CAPABILITIES[role].some(
    (granted) => granted.resource === permission.resource && granted.action === permission.action,
  );
}

// ---------------------------------------------------------------------------
// Explicit restrictions (documented negatives, enforced at the service layer)
// ---------------------------------------------------------------------------

/**
 * Actions that must never be granted to a role regardless of matrix
 * evolution, restated explicitly from docs/role-permissions.md so a future
 * edit to ROLE_CAPABILITIES cannot silently violate them without also
 * failing a check against this list.
 */
export const FORBIDDEN_CAPABILITIES: Record<UserRole, Permission[]> = {
  practitioner: [],
  assistant: [
    { resource: "extracted_field", action: "approve" },
    { resource: "classification_result", action: "approve" },
    { resource: "evidence_assessment", action: "approve" },
    { resource: "timeline_event", action: "approve" },
    { resource: "compliance_export", action: "export" },
    { resource: "billing", action: "update" },
    { resource: "firm_settings", action: "update" },
  ],
  client: [
    { resource: "extracted_field", action: "approve" },
    { resource: "case_flag", action: "update" },
    { resource: "compliance_export", action: "export" },
    { resource: "audit_event", action: "read" },
  ],
};
