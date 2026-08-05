/**
 * Realistic mock document data for the Phase 1 UI foundation. Not persisted,
 * not fetched from any API — imported directly by pages/components.
 */
import type { DocumentStatus } from "@/types/domain";

export interface MockDocument {
  id: string;
  filename: string;
  caseTitle: string;
  category: string;
  status: DocumentStatus;
  uploadedBy: string;
  uploadedAt: string;
  sizeKb: number;
  confidence: number | null;
}

export const mockDocuments: MockDocument[] = [
  {
    id: "doc_2001",
    filename: "sharma_passport_bio_page.pdf",
    caseTitle: "Sharma — Express Entry (FSWP)",
    category: "Identity",
    status: "approved",
    uploadedBy: "Ananya Sharma (client)",
    uploadedAt: "2026-08-01T10:00:00Z",
    sizeKb: 842,
    confidence: 0.96,
  },
  {
    id: "doc_2002",
    filename: "nguyen_marriage_certificate.pdf",
    caseTitle: "Nguyen–Tremblay — Spousal Sponsorship (Inland)",
    category: "Relationship Evidence",
    status: "needs_review",
    uploadedBy: "Minh Nguyen (client)",
    uploadedAt: "2026-08-05T08:20:00Z",
    sizeKb: 1204,
    confidence: 0.71,
  },
  {
    id: "doc_2003",
    filename: "okafor_study_permit_loa.pdf",
    caseTitle: "Okafor — Study Permit Renewal",
    category: "Letter of Acceptance",
    status: "approved",
    uploadedBy: "James Whitfield, RCIC",
    uploadedAt: "2026-07-29T09:10:00Z",
    sizeKb: 512,
    confidence: 0.93,
  },
  {
    id: "doc_2004",
    filename: "kowalski_lmia_confirmation.pdf",
    caseTitle: "Kowalski — Work Permit (LMIA-Based)",
    category: "LMIA",
    status: "processing",
    uploadedBy: "James Whitfield, RCIC",
    uploadedAt: "2026-08-05T12:41:00Z",
    sizeKb: 980,
    confidence: null,
  },
  {
    id: "doc_2005",
    filename: "alrashid_t4_2025.pdf",
    caseTitle: "Al-Rashid — Express Entry (CEC)",
    category: "Employment Evidence",
    status: "uploaded",
    uploadedBy: "Yusuf Al-Rashid (client)",
    uploadedAt: "2026-08-05T13:02:00Z",
    sizeKb: 341,
    confidence: null,
  },
  {
    id: "doc_2006",
    filename: "dubois_bank_statement_july.pdf",
    caseTitle: "Dubois — Visitor Visa (TRV)",
    category: "Financial Evidence",
    status: "approved",
    uploadedBy: "Camille Dubois (client)",
    uploadedAt: "2026-07-25T16:33:00Z",
    sizeKb: 668,
    confidence: 0.88,
  },
  {
    id: "doc_2007",
    filename: "singh_relationship_photos.zip",
    caseTitle: "Singh — Spousal Sponsorship (Outland)",
    category: "Relationship Evidence",
    status: "needs_review",
    uploadedBy: "Harpreet Singh (client)",
    uploadedAt: "2026-08-04T19:12:00Z",
    sizeKb: 4210,
    confidence: 0.58,
  },
  {
    id: "doc_2008",
    filename: "fontaine_offer_letter.pdf",
    caseTitle: "Fontaine — Work Permit (LMIA-Exempt)",
    category: "Employment Offer",
    status: "approved",
    uploadedBy: "Marc Fontaine (client)",
    uploadedAt: "2026-07-18T11:20:00Z",
    sizeKb: 289,
    confidence: 0.91,
  },
  {
    id: "doc_2009",
    filename: "costa_scan_duplicate.pdf",
    caseTitle: "Costa — Study Permit (New Application)",
    category: "Identity",
    status: "duplicate",
    uploadedBy: "Beatriz Costa (client)",
    uploadedAt: "2026-06-28T09:00:00Z",
    sizeKb: 754,
    confidence: 0.4,
  },
  {
    id: "doc_2010",
    filename: "sharma_language_test_ielts.pdf",
    caseTitle: "Sharma — Express Entry (FSWP)",
    category: "Language Test",
    status: "rejected",
    uploadedBy: "Ananya Sharma (client)",
    uploadedAt: "2026-07-30T14:15:00Z",
    sizeKb: 620,
    confidence: 0.62,
  },
];
