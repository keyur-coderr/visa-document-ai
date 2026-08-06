import type { StreamChecklistItem } from "@/config/streams/types";
import type { DocumentStatus, ReviewStatus } from "@/types/domain";

export type DocumentCategory =
  | "identity"
  | "relationship"
  | "financial"
  | "education"
  | "employment"
  | "medical"
  | "police"
  | "forms"
  | "supporting";

export type ParticipantScope = StreamChecklistItem["appliesTo"];
export type UploadSessionState = "queued" | "uploading" | "success" | "failed";
export type DuplicateReviewState = "suspected" | "confirmed_duplicate" | "resolved";

export interface MockManagedDocument {
  id: string;
  caseId: string;
  clientId: string;
  caseTitle: string;
  clientName: string;
  filename: string;
  category: DocumentCategory;
  status: DocumentStatus;
  participantScope: ParticipantScope;
  requirementKey: string | null;
  uploadedBy: string;
  uploadedAt: string;
  sizeKb: number;
  checksumPlaceholder: string;
  confidence: number | null;
  exhibitOrder: number;
  archived: boolean;
  practitionerNotes: string[];
  reviewStatus: ReviewStatus;
  orientationCorrected: boolean;
  qualityWarning: boolean;
  blurryWarning: boolean;
}

export interface MockDocumentVersion {
  id: string;
  documentId: string;
  version: number;
  filename: string;
  checksumPlaceholder: string;
  uploadedBy: string;
  uploadedAt: string;
  note: string;
}

export interface MockUploadSession {
  id: string;
  caseId: string | null;
  fileName: string;
  sizeKb: number;
  progressPercent: number;
  state: UploadSessionState;
  acceptedType: boolean;
  createdAt: string;
}

export interface MockChecklistDocumentLink {
  id: string;
  caseId: string;
  requirementKey: string;
  requirementName: string;
  participantScope: ParticipantScope;
  required: boolean;
  status: DocumentStatus;
  linkedDocumentIds: string[];
  practitionerNote: string;
  reviewStatus: ReviewStatus;
}

export interface MockDuplicateGroup {
  id: string;
  caseId: string;
  status: DuplicateReviewState;
  documentIds: string[];
  matchingFilenames: string[];
  matchingChecksumPlaceholder: string;
  reviewerActionLabel: string;
}

export interface MockDocumentActivity {
  id: string;
  caseId: string;
  documentId: string;
  actor: string;
  action: string;
  at: string;
}

export const mockManagedDocuments: MockManagedDocument[] = [
  {
    id: "doc_2001",
    caseId: "case_1001",
    clientId: "client_001",
    caseTitle: "Sharma — Express Entry (FSWP)",
    clientName: "Ananya Sharma",
    filename: "sharma_passport_bio_page.pdf",
    category: "identity",
    status: "approved",
    participantScope: "applicant",
    requirementKey: "passport",
    uploadedBy: "Ananya Sharma (client)",
    uploadedAt: "2026-08-01T10:00:00Z",
    sizeKb: 842,
    checksumPlaceholder: "sha256:95fc...11be",
    confidence: 0.96,
    exhibitOrder: 0,
    archived: false,
    practitionerNotes: ["Passport details validated against intake profile."],
    reviewStatus: "approved",
    orientationCorrected: true,
    qualityWarning: false,
    blurryWarning: false,
  },
  {
    id: "doc_2002",
    caseId: "case_1002",
    clientId: "client_002",
    caseTitle: "Nguyen–Tremblay — Spousal Sponsorship (Inland)",
    clientName: "Minh Nguyen",
    filename: "nguyen_marriage_certificate.pdf",
    category: "relationship",
    status: "needs_review",
    participantScope: "spouse",
    requirementKey: "marriage_doc",
    uploadedBy: "Minh Nguyen (client)",
    uploadedAt: "2026-08-05T08:20:00Z",
    sizeKb: 1204,
    checksumPlaceholder: "sha256:17ce...31ad",
    confidence: 0.71,
    exhibitOrder: 0,
    archived: false,
    practitionerNotes: ["Certificate is legible but translation stamp needs confirmation."],
    reviewStatus: "pending_review",
    orientationCorrected: false,
    qualityWarning: false,
    blurryWarning: false,
  },
  {
    id: "doc_2003",
    caseId: "case_1003",
    clientId: "client_003",
    caseTitle: "Okafor — Study Permit Renewal",
    clientName: "Chidi Okafor",
    filename: "okafor_study_permit_loa.pdf",
    category: "education",
    status: "approved",
    participantScope: "applicant",
    requirementKey: "loa",
    uploadedBy: "James Whitfield, RCIC",
    uploadedAt: "2026-07-29T09:10:00Z",
    sizeKb: 512,
    checksumPlaceholder: "sha256:7f20...9cd8",
    confidence: 0.93,
    exhibitOrder: 0,
    archived: false,
    practitionerNotes: ["LOA validity period confirmed."],
    reviewStatus: "approved",
    orientationCorrected: false,
    qualityWarning: false,
    blurryWarning: false,
  },
  {
    id: "doc_2004",
    caseId: "case_1004",
    clientId: "client_004",
    caseTitle: "Kowalski — Work Permit (LMIA-Based)",
    clientName: "Anna Kowalski",
    filename: "kowalski_lmia_confirmation.pdf",
    category: "employment",
    status: "processing",
    participantScope: "applicant",
    requirementKey: "lmia",
    uploadedBy: "James Whitfield, RCIC",
    uploadedAt: "2026-08-05T12:41:00Z",
    sizeKb: 980,
    checksumPlaceholder: "sha256:af5e...75aa",
    confidence: null,
    exhibitOrder: 0,
    archived: false,
    practitionerNotes: ["Awaiting auto-classification placeholder completion."],
    reviewStatus: "pending_review",
    orientationCorrected: false,
    qualityWarning: false,
    blurryWarning: false,
  },
  {
    id: "doc_2005",
    caseId: "case_1005",
    clientId: "client_005",
    caseTitle: "Al-Rashid — Express Entry (CEC)",
    clientName: "Yusuf Al-Rashid",
    filename: "alrashid_t4_2025.pdf",
    category: "employment",
    status: "uploaded",
    participantScope: "applicant",
    requirementKey: "payroll",
    uploadedBy: "Yusuf Al-Rashid (client)",
    uploadedAt: "2026-08-05T13:02:00Z",
    sizeKb: 341,
    checksumPlaceholder: "sha256:11d8...00ae",
    confidence: null,
    exhibitOrder: 0,
    archived: false,
    practitionerNotes: ["Uploaded recently, pending practitioner review."],
    reviewStatus: "pending_review",
    orientationCorrected: false,
    qualityWarning: false,
    blurryWarning: false,
  },
  {
    id: "doc_2006",
    caseId: "case_1006",
    clientId: "client_006",
    caseTitle: "Dubois — Visitor Visa (TRV)",
    clientName: "Camille Dubois",
    filename: "dubois_bank_statement_july.pdf",
    category: "financial",
    status: "approved",
    participantScope: "applicant",
    requirementKey: "funds",
    uploadedBy: "Camille Dubois (client)",
    uploadedAt: "2026-07-25T16:33:00Z",
    sizeKb: 668,
    checksumPlaceholder: "sha256:e329...3aa1",
    confidence: 0.88,
    exhibitOrder: 0,
    archived: false,
    practitionerNotes: ["Balance evidence accepted."],
    reviewStatus: "approved",
    orientationCorrected: false,
    qualityWarning: false,
    blurryWarning: false,
  },
  {
    id: "doc_2007",
    caseId: "case_1007",
    clientId: "client_007",
    caseTitle: "Singh — Spousal Sponsorship (Outland)",
    clientName: "Harpreet Singh",
    filename: "singh_relationship_photos.jpg",
    category: "relationship",
    status: "needs_reupload",
    participantScope: "spouse",
    requirementKey: "timeline",
    uploadedBy: "Harpreet Singh (client)",
    uploadedAt: "2026-08-04T19:12:00Z",
    sizeKb: 4210,
    checksumPlaceholder: "sha256:75ce...9f09",
    confidence: 0.58,
    exhibitOrder: 0,
    archived: false,
    practitionerNotes: ["Low light and blur; ask client for higher quality photos."],
    reviewStatus: "rejected",
    orientationCorrected: false,
    qualityWarning: true,
    blurryWarning: true,
  },
  {
    id: "doc_2008",
    caseId: "case_1008",
    clientId: "client_008",
    caseTitle: "Fontaine — Work Permit (LMIA-Exempt)",
    clientName: "Marc Fontaine",
    filename: "fontaine_offer_letter.pdf",
    category: "employment",
    status: "approved",
    participantScope: "applicant",
    requirementKey: "offer",
    uploadedBy: "Marc Fontaine (client)",
    uploadedAt: "2026-07-18T11:20:00Z",
    sizeKb: 289,
    checksumPlaceholder: "sha256:5f11...117b",
    confidence: 0.91,
    exhibitOrder: 0,
    archived: false,
    practitionerNotes: ["Offer details align with exemption rationale."],
    reviewStatus: "approved",
    orientationCorrected: false,
    qualityWarning: false,
    blurryWarning: false,
  },
  {
    id: "doc_2009",
    caseId: "case_1010",
    clientId: "client_010",
    caseTitle: "Costa — Study Permit (New Application)",
    clientName: "Beatriz Costa",
    filename: "costa_scan_duplicate.pdf",
    category: "identity",
    status: "duplicate",
    participantScope: "applicant",
    requirementKey: "passport",
    uploadedBy: "Beatriz Costa (client)",
    uploadedAt: "2026-06-28T09:00:00Z",
    sizeKb: 754,
    checksumPlaceholder: "sha256:ab92...801f",
    confidence: 0.4,
    exhibitOrder: 0,
    archived: false,
    practitionerNotes: ["Potential duplicate of prior passport copy."],
    reviewStatus: "pending_review",
    orientationCorrected: false,
    qualityWarning: false,
    blurryWarning: false,
  },
  {
    id: "doc_2010",
    caseId: "case_1001",
    clientId: "client_001",
    caseTitle: "Sharma — Express Entry (FSWP)",
    clientName: "Ananya Sharma",
    filename: "sharma_language_test_ielts.pdf",
    category: "education",
    status: "rejected",
    participantScope: "applicant",
    requirementKey: "language_test",
    uploadedBy: "Ananya Sharma (client)",
    uploadedAt: "2026-07-30T14:15:00Z",
    sizeKb: 620,
    checksumPlaceholder: "sha256:182d...1e12",
    confidence: 0.62,
    exhibitOrder: 1,
    archived: false,
    practitionerNotes: ["TRF number is obscured. Re-upload required."],
    reviewStatus: "rejected",
    orientationCorrected: false,
    qualityWarning: false,
    blurryWarning: true,
  },
  {
    id: "doc_2011",
    caseId: "case_1002",
    clientId: "client_002",
    caseTitle: "Nguyen–Tremblay — Spousal Sponsorship (Inland)",
    clientName: "Minh Nguyen",
    filename: "nguyen_relationship_timeline.pdf",
    category: "relationship",
    status: "expired",
    participantScope: "spouse",
    requirementKey: "photos",
    uploadedBy: "Daniel Brooks (assistant)",
    uploadedAt: "2026-06-20T12:55:00Z",
    sizeKb: 430,
    checksumPlaceholder: "sha256:9900...ace3",
    confidence: null,
    exhibitOrder: 1,
    archived: false,
    practitionerNotes: ["Timeline package is stale and must be replaced."],
    reviewStatus: "pending_review",
    orientationCorrected: false,
    qualityWarning: false,
    blurryWarning: false,
  },
];

export const mockDocumentVersions: MockDocumentVersion[] = [
  {
    id: "dv_1",
    documentId: "doc_2001",
    version: 1,
    filename: "sharma_passport_bio_page_v1.pdf",
    checksumPlaceholder: "sha256:95fc...11be",
    uploadedBy: "Ananya Sharma (client)",
    uploadedAt: "2026-08-01T10:00:00Z",
    note: "Initial upload",
  },
  {
    id: "dv_2",
    documentId: "doc_2010",
    version: 1,
    filename: "sharma_language_test_ielts_v1.pdf",
    checksumPlaceholder: "sha256:182d...1e12",
    uploadedBy: "Ananya Sharma (client)",
    uploadedAt: "2026-07-30T14:15:00Z",
    note: "Client upload",
  },
  {
    id: "dv_3",
    documentId: "doc_2010",
    version: 2,
    filename: "sharma_language_test_ielts_v2.pdf",
    checksumPlaceholder: "sha256:ab44...2210",
    uploadedBy: "Ananya Sharma (client)",
    uploadedAt: "2026-08-02T09:44:00Z",
    note: "Re-upload after practitioner feedback",
  },
  {
    id: "dv_4",
    documentId: "doc_2007",
    version: 1,
    filename: "singh_relationship_photos_v1.jpg",
    checksumPlaceholder: "sha256:75ce...9f09",
    uploadedBy: "Harpreet Singh (client)",
    uploadedAt: "2026-08-04T19:12:00Z",
    note: "Photo upload from mobile",
  },
];

export const mockUploadSessions: MockUploadSession[] = [
  {
    id: "up_1",
    caseId: "case_1002",
    fileName: "new_relationship_photo.jpg",
    sizeKb: 732,
    progressPercent: 100,
    state: "success",
    acceptedType: true,
    createdAt: "2026-08-05T10:03:00Z",
  },
  {
    id: "up_2",
    caseId: "case_1007",
    fileName: "timeline_scan.png",
    sizeKb: 1102,
    progressPercent: 100,
    state: "failed",
    acceptedType: true,
    createdAt: "2026-08-05T10:04:00Z",
  },
];

export const mockChecklistDocumentLinks: MockChecklistDocumentLink[] = [
  {
    id: "cdl_1",
    caseId: "case_1001",
    requirementKey: "passport",
    requirementName: "Valid passport",
    participantScope: "applicant",
    required: true,
    status: "approved",
    linkedDocumentIds: ["doc_2001"],
    practitionerNote: "Passport complete.",
    reviewStatus: "approved",
  },
  {
    id: "cdl_2",
    caseId: "case_1001",
    requirementKey: "language_test",
    requirementName: "Approved language test",
    participantScope: "applicant",
    required: true,
    status: "needs_reupload",
    linkedDocumentIds: ["doc_2010"],
    practitionerNote: "TRF number not clear in current upload.",
    reviewStatus: "rejected",
  },
  {
    id: "cdl_3",
    caseId: "case_1002",
    requirementKey: "marriage_doc",
    requirementName: "Marriage/partnership evidence",
    participantScope: "spouse",
    required: true,
    status: "needs_review",
    linkedDocumentIds: ["doc_2002"],
    practitionerNote: "Review translation details.",
    reviewStatus: "pending_review",
  },
  {
    id: "cdl_4",
    caseId: "case_1002",
    requirementKey: "photos",
    requirementName: "Relationship photos and communications",
    participantScope: "spouse",
    required: true,
    status: "expired",
    linkedDocumentIds: ["doc_2011"],
    practitionerNote: "Need updated recent timeline evidence.",
    reviewStatus: "pending_review",
  },
  {
    id: "cdl_5",
    caseId: "case_1002",
    requirementKey: "sponsor_status",
    requirementName: "Sponsor status proof",
    participantScope: "spouse",
    required: true,
    status: "missing",
    linkedDocumentIds: [],
    practitionerNote: "Upload requested from sponsor.",
    reviewStatus: "pending_review",
  },
];

export const mockDuplicateGroups: MockDuplicateGroup[] = [
  {
    id: "dup_1",
    caseId: "case_1010",
    status: "suspected",
    documentIds: ["doc_2009"],
    matchingFilenames: ["costa_scan_duplicate.pdf", "costa_scan_duplicate_copy.pdf"],
    matchingChecksumPlaceholder: "sha256:ab92...801f",
    reviewerActionLabel: "Review and confirm duplicate",
  },
  {
    id: "dup_2",
    caseId: "case_1001",
    status: "resolved",
    documentIds: ["doc_2001", "doc_2010"],
    matchingFilenames: ["sharma_passport_bio_page.pdf", "sharma_passport_bio_page_old.pdf"],
    matchingChecksumPlaceholder: "sha256:95fc...11be",
    reviewerActionLabel: "Marked prior copy as archived",
  },
];

export const mockDocumentActivities: MockDocumentActivity[] = [
  {
    id: "da_1",
    caseId: "case_1001",
    documentId: "doc_2010",
    actor: "Priya Nair",
    action: "Marked language test as needs re-upload",
    at: "2026-08-03T15:20:00Z",
  },
  {
    id: "da_2",
    caseId: "case_1002",
    documentId: "doc_2002",
    actor: "Daniel Brooks",
    action: "Linked document to relationship requirement",
    at: "2026-08-05T08:40:00Z",
  },
  {
    id: "da_3",
    caseId: "case_1010",
    documentId: "doc_2009",
    actor: "James Whitfield",
    action: "Flagged as suspected duplicate",
    at: "2026-07-01T10:12:00Z",
  },
];

export interface MockDocumentListRow {
  id: string;
  filename: string;
  caseId: string;
  caseTitle: string;
  clientId: string;
  clientName: string;
  category: DocumentCategory;
  status: DocumentStatus;
  uploadedBy: string;
  uploadedAt: string;
  sizeKb: number;
  confidence: number | null;
  exhibitLabel: string;
  archived: boolean;
}

export function exhibitLabelFromOrder(order: number): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const letter = alphabet[order % 26] ?? "A";
  const repeatCount = Math.floor(order / 26) + 1;
  return letter.repeat(repeatCount);
}

export function withExhibitLabels(documents: MockManagedDocument[]): MockDocumentListRow[] {
  const groupedByCase = new Map<string, MockManagedDocument[]>();

  for (const document of documents) {
    const existing = groupedByCase.get(document.caseId) ?? [];
    existing.push(document);
    groupedByCase.set(document.caseId, existing);
  }

  const rows: MockDocumentListRow[] = [];

  groupedByCase.forEach((caseDocs) => {
    const ordered = [...caseDocs].sort((a, b) => a.exhibitOrder - b.exhibitOrder);
    ordered.forEach((document, index) => {
      rows.push({
        id: document.id,
        filename: document.filename,
        caseId: document.caseId,
        caseTitle: document.caseTitle,
        clientId: document.clientId,
        clientName: document.clientName,
        category: document.category,
        status: document.status,
        uploadedBy: document.uploadedBy,
        uploadedAt: document.uploadedAt,
        sizeKb: document.sizeKb,
        confidence: document.confidence,
        exhibitLabel: exhibitLabelFromOrder(index),
        archived: document.archived,
      });
    });
  });

  return rows;
}

export function getCaseDocuments(caseId: string): MockManagedDocument[] {
  return mockManagedDocuments.filter((document) => document.caseId === caseId);
}

export function getDocumentById(documentId: string): MockManagedDocument | undefined {
  return mockManagedDocuments.find((document) => document.id === documentId);
}

export function getDocumentVersions(documentId: string): MockDocumentVersion[] {
  return mockDocumentVersions
    .filter((version) => version.documentId === documentId)
    .sort((a, b) => b.version - a.version);
}

export function getChecklistLinksForCase(caseId: string): MockChecklistDocumentLink[] {
  return mockChecklistDocumentLinks.filter((link) => link.caseId === caseId);
}

export function getDuplicateGroupsForCase(caseId: string): MockDuplicateGroup[] {
  return mockDuplicateGroups.filter((group) => group.caseId === caseId);
}

export function getDocumentActivitiesForCase(caseId: string): MockDocumentActivity[] {
  return mockDocumentActivities
    .filter((activity) => activity.caseId === caseId)
    .sort((a, b) => (a.at < b.at ? 1 : -1));
}
