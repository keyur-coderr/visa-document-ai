import type { StreamKey } from "@/config/immigration-streams/schema";
import type { ChecklistItemStatus } from "@/config/streams/types";
import type { CaseStatus, MilestoneKey, ParticipantRelationship, UserRole } from "@/types/domain";

export type ClientLifecycleStatus = "active" | "onboarding" | "attention";

export interface MockTeamUser {
  id: string;
  fullName: string;
  role: UserRole;
  title: string;
}

export interface MockClient {
  id: string;
  legalName: string;
  status: ClientLifecycleStatus;
  email: string;
  phone: string;
  language: string;
  activeCaseCount: number;
}

export interface MockCaseRecord {
  id: string;
  title: string;
  clientId: string;
  streamKey: StreamKey;
  streamLabel: string;
  status: CaseStatus;
  currentMilestone: MilestoneKey;
  progressPercent: number;
  checklistCompleted: number;
  checklistTotal: number;
  documentCount: number;
  exhibitCount: number;
  assignedPractitionerId: string;
  assignedAssistantId: string | null;
  unresolvedFlagCount: number;
  pendingApprovals: number;
  nearestDeadline: string | null;
  updatedAt: string;
}

export interface MockCaseParticipant {
  id: string;
  caseId: string;
  legalName: string;
  relationship: ParticipantRelationship;
}

export interface MockDeadline {
  id: string;
  caseId: string;
  label: string;
  dueDate: string;
  status: "upcoming" | "due_soon" | "overdue";
}

export interface MockCaseFlag {
  id: string;
  caseId: string;
  title: string;
  severity: "low" | "medium" | "high";
  status: "open" | "in_progress";
}

export interface MockActivity {
  id: string;
  entityType: "client" | "case";
  entityId: string;
  text: string;
  at: string;
}

export type MockChecklistStatus = Exclude<ChecklistItemStatus, "required" | "optional">;
export type MockFormStatus = "not_started" | "in_progress" | "completed" | "approved";
export type MockDocumentStatus = "pending" | "uploaded" | "approved" | "rejected" | "needs_review";

export const phase1Streams: Array<{ key: StreamKey; label: string }> = [
  { key: "express-entry-fswp", label: "Express Entry — Federal Skilled Worker" },
  { key: "express-entry-cec", label: "Express Entry — Canadian Experience Class" },
  { key: "express-entry-fstp", label: "Express Entry — Federal Skilled Trades" },
  { key: "spousal-sponsorship-inland", label: "Spousal Sponsorship — Inland" },
  { key: "spousal-sponsorship-outland", label: "Spousal Sponsorship — Outland" },
  { key: "visitor-visa-trv", label: "Visitor Visa / TRV" },
  { key: "study-permit", label: "Study Permit" },
  { key: "work-permit-lmia-based", label: "Work Permit — LMIA-Based" },
  { key: "work-permit-lmia-exempt", label: "Work Permit — LMIA-Exempt" },
];

export const mockTeamUsers: MockTeamUser[] = [
  { id: "u_priya", fullName: "Priya Nair", role: "practitioner", title: "RCIC" },
  { id: "u_james", fullName: "James Whitfield", role: "practitioner", title: "RCIC" },
  { id: "u_olivia", fullName: "Olivia Chen", role: "assistant", title: "Case Assistant" },
  { id: "u_daniel", fullName: "Daniel Brooks", role: "assistant", title: "Case Assistant" },
  { id: "u_noor", fullName: "Noor Rahman", role: "assistant", title: "Case Assistant" },
];

export const mockClients: MockClient[] = [
  {
    id: "client_001",
    legalName: "Ananya Sharma",
    status: "active",
    email: "ananya.sharma@email.com",
    phone: "+1 416 555 0121",
    language: "English",
    activeCaseCount: 1,
  },
  {
    id: "client_002",
    legalName: "Minh Nguyen",
    status: "attention",
    email: "minh.nguyen@email.com",
    phone: "+1 647 555 0188",
    language: "English",
    activeCaseCount: 1,
  },
  {
    id: "client_003",
    legalName: "Chidi Okafor",
    status: "active",
    email: "chidi.okafor@email.com",
    phone: "+1 437 555 0113",
    language: "English",
    activeCaseCount: 1,
  },
  {
    id: "client_004",
    legalName: "Anna Kowalski",
    status: "active",
    email: "anna.kowalski@email.com",
    phone: "+1 416 555 0142",
    language: "Polish",
    activeCaseCount: 1,
  },
  {
    id: "client_005",
    legalName: "Yusuf Al-Rashid",
    status: "onboarding",
    email: "yusuf.alrashid@email.com",
    phone: "+1 905 555 0176",
    language: "Arabic",
    activeCaseCount: 1,
  },
  {
    id: "client_006",
    legalName: "Camille Dubois",
    status: "active",
    email: "camille.dubois@email.com",
    phone: "+1 514 555 0104",
    language: "French",
    activeCaseCount: 1,
  },
  {
    id: "client_007",
    legalName: "Harpreet Singh",
    status: "attention",
    email: "harpreet.singh@email.com",
    phone: "+1 778 555 0133",
    language: "English",
    activeCaseCount: 1,
  },
  {
    id: "client_008",
    legalName: "Marc Fontaine",
    status: "active",
    email: "marc.fontaine@email.com",
    phone: "+1 604 555 0172",
    language: "French",
    activeCaseCount: 1,
  },
  {
    id: "client_009",
    legalName: "Layla Ibrahim",
    status: "onboarding",
    email: "layla.ibrahim@email.com",
    phone: "+1 289 555 0169",
    language: "English",
    activeCaseCount: 1,
  },
  {
    id: "client_010",
    legalName: "Beatriz Costa",
    status: "active",
    email: "beatriz.costa@email.com",
    phone: "+1 647 555 0199",
    language: "Portuguese",
    activeCaseCount: 0,
  },
];

export const mockCaseRecords: MockCaseRecord[] = [
  {
    id: "case_1001",
    title: "Sharma — Express Entry (FSWP)",
    clientId: "client_001",
    streamKey: "express-entry-fswp",
    streamLabel: "Express Entry — Federal Skilled Worker",
    status: "in_review",
    currentMilestone: "forms_ready",
    progressPercent: 74,
    checklistCompleted: 11,
    checklistTotal: 14,
    documentCount: 15,
    exhibitCount: 9,
    assignedPractitionerId: "u_priya",
    assignedAssistantId: "u_olivia",
    unresolvedFlagCount: 1,
    pendingApprovals: 2,
    nearestDeadline: "2026-08-18",
    updatedAt: "2026-08-04T15:12:00Z",
  },
  {
    id: "case_1002",
    title: "Nguyen–Tremblay — Spousal Sponsorship (Inland)",
    clientId: "client_002",
    streamKey: "spousal-sponsorship-inland",
    streamLabel: "Spousal Sponsorship — Inland",
    status: "documents_in_progress",
    currentMilestone: "documents_complete",
    progressPercent: 42,
    checklistCompleted: 7,
    checklistTotal: 16,
    documentCount: 10,
    exhibitCount: 5,
    assignedPractitionerId: "u_priya",
    assignedAssistantId: "u_daniel",
    unresolvedFlagCount: 3,
    pendingApprovals: 4,
    nearestDeadline: "2026-08-09",
    updatedAt: "2026-08-05T09:40:00Z",
  },
  {
    id: "case_1003",
    title: "Okafor — Study Permit Renewal",
    clientId: "client_003",
    streamKey: "study-permit",
    streamLabel: "Study Permit",
    status: "ready_for_submission",
    currentMilestone: "forms_ready",
    progressPercent: 90,
    checklistCompleted: 9,
    checklistTotal: 9,
    documentCount: 12,
    exhibitCount: 7,
    assignedPractitionerId: "u_james",
    assignedAssistantId: "u_noor",
    unresolvedFlagCount: 0,
    pendingApprovals: 1,
    nearestDeadline: "2026-08-20",
    updatedAt: "2026-08-03T18:05:00Z",
  },
  {
    id: "case_1004",
    title: "Kowalski — Work Permit (LMIA-Based)",
    clientId: "client_004",
    streamKey: "work-permit-lmia-based",
    streamLabel: "Work Permit — LMIA-Based",
    status: "submitted",
    currentMilestone: "submitted",
    progressPercent: 95,
    checklistCompleted: 12,
    checklistTotal: 12,
    documentCount: 14,
    exhibitCount: 8,
    assignedPractitionerId: "u_james",
    assignedAssistantId: "u_olivia",
    unresolvedFlagCount: 0,
    pendingApprovals: 0,
    nearestDeadline: null,
    updatedAt: "2026-07-30T13:22:00Z",
  },
  {
    id: "case_1005",
    title: "Al-Rashid — Express Entry (CEC)",
    clientId: "client_005",
    streamKey: "express-entry-cec",
    streamLabel: "Express Entry — Canadian Experience Class",
    status: "intake_in_progress",
    currentMilestone: "intake",
    progressPercent: 21,
    checklistCompleted: 3,
    checklistTotal: 13,
    documentCount: 4,
    exhibitCount: 2,
    assignedPractitionerId: "u_priya",
    assignedAssistantId: null,
    unresolvedFlagCount: 0,
    pendingApprovals: 0,
    nearestDeadline: "2026-08-22",
    updatedAt: "2026-08-05T11:02:00Z",
  },
  {
    id: "case_1006",
    title: "Dubois — Visitor Visa (TRV)",
    clientId: "client_006",
    streamKey: "visitor-visa-trv",
    streamLabel: "Visitor Visa / TRV",
    status: "awaiting_decision",
    currentMilestone: "awaiting_decision",
    progressPercent: 96,
    checklistCompleted: 7,
    checklistTotal: 7,
    documentCount: 9,
    exhibitCount: 6,
    assignedPractitionerId: "u_james",
    assignedAssistantId: "u_noor",
    unresolvedFlagCount: 0,
    pendingApprovals: 0,
    nearestDeadline: null,
    updatedAt: "2026-07-28T10:15:00Z",
  },
  {
    id: "case_1007",
    title: "Singh — Spousal Sponsorship (Outland)",
    clientId: "client_007",
    streamKey: "spousal-sponsorship-outland",
    streamLabel: "Spousal Sponsorship — Outland",
    status: "in_review",
    currentMilestone: "forms_ready",
    progressPercent: 70,
    checklistCompleted: 10,
    checklistTotal: 15,
    documentCount: 13,
    exhibitCount: 7,
    assignedPractitionerId: "u_priya",
    assignedAssistantId: "u_daniel",
    unresolvedFlagCount: 2,
    pendingApprovals: 3,
    nearestDeadline: "2026-08-11",
    updatedAt: "2026-08-04T20:47:00Z",
  },
  {
    id: "case_1008",
    title: "Fontaine — Work Permit (LMIA-Exempt)",
    clientId: "client_008",
    streamKey: "work-permit-lmia-exempt",
    streamLabel: "Work Permit — LMIA-Exempt",
    status: "decision_received",
    currentMilestone: "decision_received",
    progressPercent: 100,
    checklistCompleted: 8,
    checklistTotal: 8,
    documentCount: 10,
    exhibitCount: 6,
    assignedPractitionerId: "u_james",
    assignedAssistantId: "u_olivia",
    unresolvedFlagCount: 0,
    pendingApprovals: 0,
    nearestDeadline: null,
    updatedAt: "2026-07-20T08:30:00Z",
  },
  {
    id: "case_1009",
    title: "Ibrahim — Express Entry (FSTP)",
    clientId: "client_009",
    streamKey: "express-entry-fstp",
    streamLabel: "Express Entry — Federal Skilled Trades",
    status: "draft",
    currentMilestone: "intake",
    progressPercent: 8,
    checklistCompleted: 0,
    checklistTotal: 12,
    documentCount: 0,
    exhibitCount: 0,
    assignedPractitionerId: "u_priya",
    assignedAssistantId: null,
    unresolvedFlagCount: 0,
    pendingApprovals: 0,
    nearestDeadline: "2026-08-25",
    updatedAt: "2026-08-05T14:55:00Z",
  },
  {
    id: "case_1010",
    title: "Costa — Study Permit (New Application)",
    clientId: "client_010",
    streamKey: "study-permit",
    streamLabel: "Study Permit",
    status: "closed",
    currentMilestone: "decision_received",
    progressPercent: 100,
    checklistCompleted: 9,
    checklistTotal: 9,
    documentCount: 11,
    exhibitCount: 8,
    assignedPractitionerId: "u_james",
    assignedAssistantId: "u_noor",
    unresolvedFlagCount: 0,
    pendingApprovals: 0,
    nearestDeadline: null,
    updatedAt: "2026-06-30T16:00:00Z",
  },
];

export const mockCaseParticipants: MockCaseParticipant[] = [
  { id: "part_1", caseId: "case_1002", legalName: "Sophie Tremblay", relationship: "spouse" },
  { id: "part_2", caseId: "case_1007", legalName: "Kiran Singh", relationship: "spouse" },
  { id: "part_3", caseId: "case_1007", legalName: "Aman Singh", relationship: "dependant_child" },
  { id: "part_4", caseId: "case_1001", legalName: "Ananya Sharma", relationship: "principal_applicant" },
  { id: "part_5", caseId: "case_1003", legalName: "Chidi Okafor", relationship: "principal_applicant" },
  { id: "part_6", caseId: "case_1006", legalName: "Camille Dubois", relationship: "principal_applicant" },
];

export const mockDeadlines: MockDeadline[] = [
  { id: "ddl_1", caseId: "case_1002", label: "Upload relationship evidence", dueDate: "2026-08-09", status: "due_soon" },
  { id: "ddl_2", caseId: "case_1007", label: "Finalize sponsor forms", dueDate: "2026-08-11", status: "due_soon" },
  { id: "ddl_3", caseId: "case_1001", label: "Review employment letter", dueDate: "2026-08-18", status: "upcoming" },
  { id: "ddl_4", caseId: "case_1005", label: "Submit profile documents", dueDate: "2026-08-22", status: "upcoming" },
  { id: "ddl_5", caseId: "case_1009", label: "Complete intake details", dueDate: "2026-08-25", status: "upcoming" },
];

export const mockCaseFlags: MockCaseFlag[] = [
  { id: "flag_1", caseId: "case_1002", title: "Missing relationship timeline gap explanation", severity: "high", status: "open" },
  { id: "flag_2", caseId: "case_1002", title: "Low confidence extraction on marriage certificate", severity: "medium", status: "in_progress" },
  { id: "flag_3", caseId: "case_1007", title: "Potential duplicate financial statement", severity: "medium", status: "open" },
  { id: "flag_4", caseId: "case_1001", title: "Employment dates mismatch across documents", severity: "low", status: "open" },
];

export const mockActivities: MockActivity[] = [
  {
    id: "act_case_1",
    entityType: "case",
    entityId: "case_1002",
    text: "Assistant requested additional relationship photos.",
    at: "2026-08-05T10:21:00Z",
  },
  {
    id: "act_case_2",
    entityType: "case",
    entityId: "case_1002",
    text: "Practitioner reviewed sponsor forms and left notes.",
    at: "2026-08-04T16:40:00Z",
  },
  {
    id: "act_case_3",
    entityType: "case",
    entityId: "case_1001",
    text: "Two extracted fields were approved by practitioner.",
    at: "2026-08-04T15:10:00Z",
  },
  {
    id: "act_case_4",
    entityType: "case",
    entityId: "case_1007",
    text: "Client uploaded additional supporting documents.",
    at: "2026-08-04T20:20:00Z",
  },
  {
    id: "act_client_1",
    entityType: "client",
    entityId: "client_002",
    text: "Contact number was updated by assistant.",
    at: "2026-08-03T09:25:00Z",
  },
  {
    id: "act_client_2",
    entityType: "client",
    entityId: "client_001",
    text: "Preferred language confirmed as English.",
    at: "2026-08-01T11:14:00Z",
  },
];

export const mockChecklistStatusByCaseId: Record<string, Record<string, MockChecklistStatus>> = {
  case_1001: {
    passport: "approved",
    birth_cert: "uploaded",
    language_test: "approved",
    eca: "uploaded",
    proof_funds: "needs_review",
  },
  case_1002: {
    marriage_doc: "uploaded",
    photos: "pending",
    sponsor_status: "missing",
    support_letters: "pending",
  },
  case_1003: {
    loa: "approved",
    sop: "approved",
    funds: "approved",
    sponsor: "pending",
  },
};

export const mockFormStatusByCaseId: Record<string, Record<string, MockFormStatus>> = {
  case_1001: {
    imm0008: "completed",
    imm5669: "approved",
    imm5406: "in_progress",
  },
  case_1002: {
    imm1344: "in_progress",
    imm0008: "not_started",
    imm5532: "in_progress",
  },
  case_1003: {
    imm1294: "approved",
    imm5645: "completed",
  },
};

export const mockDocumentStatusByCaseId: Record<string, Record<string, MockDocumentStatus>> = {
  case_1001: {
    "Passport bio page": "approved",
    "Language test results": "approved",
    "Education credentials": "uploaded",
    "Employment reference letters": "needs_review",
    "Police certificates": "pending",
  },
  case_1002: {
    "Marriage or partnership proof": "uploaded",
    "Relationship evidence package": "pending",
    "Sponsor status documents": "missing",
    "Identity documents for both parties": "uploaded",
  },
  case_1003: {
    Passport: "approved",
    "Letter of acceptance": "approved",
    "Proof of funds": "approved",
    "Statement of purpose": "approved",
  },
};

export const mockCaseNotesByCaseId: Record<string, string[]> = {
  case_1001: [
    "Client confirmed updated proof of funds statement will arrive by Friday.",
    "Practitioner requested second review on employment letter date mismatch.",
  ],
  case_1002: [
    "Relationship timeline has two unexplained travel gaps.",
    "Awaiting sponsor status document upload.",
  ],
  case_1003: [
    "All core study permit evidence reviewed and approved.",
  ],
};

export const milestoneOrder: MilestoneKey[] = [
  "intake",
  "documents_complete",
  "forms_ready",
  "submitted",
  "awaiting_decision",
  "decision_received",
];

export function getUserNameById(userId: string | null): string {
  if (!userId) return "Unassigned";
  return mockTeamUsers.find((user) => user.id === userId)?.fullName ?? "Unassigned";
}

export function getClientById(clientId: string): MockClient | undefined {
  return mockClients.find((client) => client.id === clientId);
}

export function getCaseById(caseId: string): MockCaseRecord | undefined {
  return mockCaseRecords.find((record) => record.id === caseId);
}

export function formatIsoDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
