/**
 * Realistic mock case data for the Phase 1 UI foundation. Not persisted,
 * not fetched from any API — imported directly by pages/components.
 */
import type { CaseStatus, RiskTier } from "@/types/domain";
import type { StreamKey } from "@/config/immigration-streams/schema";

export interface MockCase {
  id: string;
  title: string;
  clientName: string;
  streamKey: StreamKey;
  streamLabel: string;
  status: CaseStatus;
  riskTier: RiskTier;
  assignedTo: string;
  openFlags: number;
  documentsComplete: number;
  documentsTotal: number;
  updatedAt: string;
}

export const mockCases: MockCase[] = [
  {
    id: "case_1001",
    title: "Sharma — Express Entry (FSWP)",
    clientName: "Ananya Sharma",
    streamKey: "express-entry-fswp",
    streamLabel: "Express Entry — Federal Skilled Worker",
    status: "in_review",
    riskTier: "standard",
    assignedTo: "Priya Nair, RCIC",
    openFlags: 1,
    documentsComplete: 11,
    documentsTotal: 14,
    updatedAt: "2026-08-04T15:12:00Z",
  },
  {
    id: "case_1002",
    title: "Nguyen–Tremblay — Spousal Sponsorship (Inland)",
    clientName: "Minh Nguyen",
    streamKey: "spousal-sponsorship-inland",
    streamLabel: "Spousal Sponsorship — Inland",
    status: "documents_in_progress",
    riskTier: "elevated",
    assignedTo: "Priya Nair, RCIC",
    openFlags: 3,
    documentsComplete: 6,
    documentsTotal: 16,
    updatedAt: "2026-08-05T09:40:00Z",
  },
  {
    id: "case_1003",
    title: "Okafor — Study Permit Renewal",
    clientName: "Chidi Okafor",
    streamKey: "study-permit",
    streamLabel: "Study Permit",
    status: "ready_for_submission",
    riskTier: "standard",
    assignedTo: "James Whitfield, RCIC",
    openFlags: 0,
    documentsComplete: 9,
    documentsTotal: 9,
    updatedAt: "2026-08-03T18:05:00Z",
  },
  {
    id: "case_1004",
    title: "Kowalski — Work Permit (LMIA-Based)",
    clientName: "Anna Kowalski",
    streamKey: "work-permit-lmia-based",
    streamLabel: "Work Permit — LMIA-Based",
    status: "submitted",
    riskTier: "standard",
    assignedTo: "James Whitfield, RCIC",
    openFlags: 0,
    documentsComplete: 12,
    documentsTotal: 12,
    updatedAt: "2026-07-30T13:22:00Z",
  },
  {
    id: "case_1005",
    title: "Al-Rashid — Express Entry (CEC)",
    clientName: "Yusuf Al-Rashid",
    streamKey: "express-entry-cec",
    streamLabel: "Express Entry — Canadian Experience Class",
    status: "intake_in_progress",
    riskTier: "standard",
    assignedTo: "Priya Nair, RCIC",
    openFlags: 0,
    documentsComplete: 2,
    documentsTotal: 13,
    updatedAt: "2026-08-05T11:02:00Z",
  },
  {
    id: "case_1006",
    title: "Dubois — Visitor Visa (TRV)",
    clientName: "Camille Dubois",
    streamKey: "visitor-visa-trv",
    streamLabel: "Visitor Visa (TRV)",
    status: "awaiting_decision",
    riskTier: "standard",
    assignedTo: "James Whitfield, RCIC",
    openFlags: 0,
    documentsComplete: 7,
    documentsTotal: 7,
    updatedAt: "2026-07-28T10:15:00Z",
  },
  {
    id: "case_1007",
    title: "Singh — Spousal Sponsorship (Outland)",
    clientName: "Harpreet Singh",
    streamKey: "spousal-sponsorship-outland",
    streamLabel: "Spousal Sponsorship — Outland",
    status: "in_review",
    riskTier: "elevated",
    assignedTo: "Priya Nair, RCIC",
    openFlags: 2,
    documentsComplete: 10,
    documentsTotal: 15,
    updatedAt: "2026-08-04T20:47:00Z",
  },
  {
    id: "case_1008",
    title: "Fontaine — Work Permit (LMIA-Exempt)",
    clientName: "Marc Fontaine",
    streamKey: "work-permit-lmia-exempt",
    streamLabel: "Work Permit — LMIA-Exempt",
    status: "decision_received",
    riskTier: "standard",
    assignedTo: "James Whitfield, RCIC",
    openFlags: 0,
    documentsComplete: 8,
    documentsTotal: 8,
    updatedAt: "2026-07-20T08:30:00Z",
  },
  {
    id: "case_1009",
    title: "Ibrahim — Express Entry (FSTP)",
    clientName: "Layla Ibrahim",
    streamKey: "express-entry-fstp",
    streamLabel: "Express Entry — Federal Skilled Trades",
    status: "draft",
    riskTier: "standard",
    assignedTo: "Unassigned",
    openFlags: 0,
    documentsComplete: 0,
    documentsTotal: 0,
    updatedAt: "2026-08-05T14:55:00Z",
  },
  {
    id: "case_1010",
    title: "Costa — Study Permit (New Application)",
    clientName: "Beatriz Costa",
    streamKey: "study-permit",
    streamLabel: "Study Permit",
    status: "closed",
    riskTier: "standard",
    assignedTo: "James Whitfield, RCIC",
    openFlags: 0,
    documentsComplete: 9,
    documentsTotal: 9,
    updatedAt: "2026-06-30T16:00:00Z",
  },
];
