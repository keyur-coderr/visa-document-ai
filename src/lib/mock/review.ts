import { mockCaseFlags, mockCaseRecords, mockClients, mockTeamUsers } from "@/lib/mock/case-management";
import { mockChecklistDocumentLinks, mockManagedDocuments } from "@/lib/mock/documents";

export type MockCategory =
  | "passport"
  | "language_test"
  | "wes_eca_report"
  | "educational_degree"
  | "educational_transcript"
  | "employment_reference_letter"
  | "employment_offer_letter"
  | "pay_slip"
  | "tax_document"
  | "bank_statement"
  | "police_clearance_certificate"
  | "marriage_certificate"
  | "birth_certificate"
  | "resume_cv"
  | "medical_document"
  | "work_permit"
  | "study_permit"
  | "visitor_visa"
  | "permanent_resident_card"
  | "national_id"
  | "unknown";

export interface MockReviewClassification {
  id: string;
  documentId: string;
  caseId: string;
  predictedCategory: MockCategory;
  finalCategory: MockCategory | null;
  confidence: number;
  alternatives: Array<{ category: MockCategory; confidence: number }>;
  reviewStatus: "pending_review" | "approved" | "rejected" | "overridden";
  provider: string;
  model: string;
  schemaVersion: number;
  promptVersion: number;
  generatedAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  overrideReason: string | null;
  reviewNote: string | null;
}

export interface MockReviewField {
  id: string;
  documentId: string;
  caseId: string;
  extractionRunId: string;
  fieldKey: string;
  rawValue: string | null;
  normalizedValue: string | null;
  confidence: number;
  sourcePage: number | null;
  sourceText: string | null;
  sourceCoordinates: Record<string, unknown> | null;
  approvalStatus: "pending_review" | "approved" | "rejected" | "overridden";
  approvedValue: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  overrideReason: string | null;
  clarificationRequired: boolean;
}

export interface MockReviewDraft {
  fieldId: string;
  reviewerId: string;
  draftValue: string | null;
  reviewerNote: string | null;
  unsavedChanges: boolean;
  updatedAt: string;
}

export interface MockReviewExtractionRun {
  id: string;
  documentId: string;
  caseId: string;
  confidence: number;
  provider: string;
  model: string;
  schemaVersion: number;
  promptVersion: number;
  extractionVersion: number;
  generatedAt: string;
}

export interface MockReviewQualityWarning {
  id: string;
  documentId: string;
  caseId: string;
  issueKey: string;
  severity: "low" | "medium" | "high";
  confidence: number;
  status: "pending_review" | "approved" | "rejected" | "overridden";
}

export interface MockCaseFact {
  id: string;
  caseId: string;
  documentId: string;
  fieldKey: string;
  originalAiValue: string | null;
  approvedValue: string;
  extractionVersion: number;
  approvedBy: string;
  approvedAt: string;
}

const categoryByFilename: Array<{ token: string; category: MockCategory }> = [
  { token: "passport", category: "passport" },
  { token: "ielts", category: "language_test" },
  { token: "wes", category: "wes_eca_report" },
  { token: "employment", category: "employment_reference_letter" },
  { token: "offer", category: "employment_offer_letter" },
  { token: "bank", category: "bank_statement" },
  { token: "tax", category: "tax_document" },
  { token: "marriage", category: "marriage_certificate" },
  { token: "birth", category: "birth_certificate" },
  { token: "work_permit", category: "work_permit" },
  { token: "study_permit", category: "study_permit" },
  { token: "visa", category: "visitor_visa" },
];

function inferCategory(filename: string): MockCategory {
  const normalized = filename.toLowerCase();
  for (const item of categoryByFilename) {
    if (normalized.includes(item.token)) return item.category;
  }
  return "unknown";
}

function seededFields(documentId: string, caseId: string, extractionRunId: string, filename: string): MockReviewField[] {
  const category = inferCategory(filename);
  if (category === "passport") {
    return [
      {
        id: `field-${documentId}-name`,
        documentId,
        caseId,
        extractionRunId,
        fieldKey: "legal_name",
        rawValue: "ANANYA SHARMA",
        normalizedValue: "Ananya Sharma",
        confidence: 0.86,
        sourcePage: 1,
        sourceText: "Surname SHARMA Given names ANANYA",
        sourceCoordinates: { x: 120, y: 180, width: 260, height: 22 },
        approvalStatus: "pending_review",
        approvedValue: null,
        approvedBy: null,
        approvedAt: null,
        overrideReason: null,
        clarificationRequired: false,
      },
      {
        id: `field-${documentId}-passport-number`,
        documentId,
        caseId,
        extractionRunId,
        fieldKey: "passport_number",
        rawValue: "M1234567",
        normalizedValue: "M1234567",
        confidence: 0.8,
        sourcePage: 1,
        sourceText: "Passport No. M1234567",
        sourceCoordinates: { x: 150, y: 232, width: 200, height: 20 },
        approvalStatus: "pending_review",
        approvedValue: null,
        approvedBy: null,
        approvedAt: null,
        overrideReason: null,
        clarificationRequired: false,
      },
    ];
  }

  if (category === "language_test") {
    return [
      {
        id: `field-${documentId}-candidate-name`,
        documentId,
        caseId,
        extractionRunId,
        fieldKey: "candidate_name",
        rawValue: "ANANYA SHARMA",
        normalizedValue: "Ananya Sharma",
        confidence: 0.73,
        sourcePage: 1,
        sourceText: "Candidate Name: ANANYA SHARMA",
        sourceCoordinates: null,
        approvalStatus: "pending_review",
        approvedValue: null,
        approvedBy: null,
        approvedAt: null,
        overrideReason: null,
        clarificationRequired: false,
      },
      {
        id: `field-${documentId}-overall-score`,
        documentId,
        caseId,
        extractionRunId,
        fieldKey: "overall_score",
        rawValue: "7.0",
        normalizedValue: "7.0",
        confidence: 0.64,
        sourcePage: 1,
        sourceText: "Overall Band Score 7.0",
        sourceCoordinates: null,
        approvalStatus: "pending_review",
        approvedValue: null,
        approvedBy: null,
        approvedAt: null,
        overrideReason: null,
        clarificationRequired: false,
      },
    ];
  }

  return [
    {
      id: `field-${documentId}-document-title`,
      documentId,
      caseId,
      extractionRunId,
      fieldKey: "document_title",
      rawValue: filename,
      normalizedValue: filename,
      confidence: 0.44,
      sourcePage: 1,
      sourceText: filename,
      sourceCoordinates: null,
      approvalStatus: "pending_review",
      approvedValue: null,
      approvedBy: null,
      approvedAt: null,
      overrideReason: null,
      clarificationRequired: false,
    },
  ];
}

export const mockReviewClassifications: MockReviewClassification[] = mockManagedDocuments.map((document, index) => {
  const predictedCategory = inferCategory(document.filename);
  return {
    id: `classification-${document.id}`,
    documentId: document.id,
    caseId: document.caseId,
    predictedCategory,
    finalCategory: document.reviewStatus === "approved" ? predictedCategory : null,
    confidence: document.confidence ?? Math.max(0.45, 0.9 - (index % 5) * 0.08),
    alternatives: [
      { category: predictedCategory, confidence: document.confidence ?? 0.72 },
      { category: "unknown", confidence: 0.28 },
    ],
    reviewStatus: document.reviewStatus,
    provider: "mock",
    model: "mock-v1",
    schemaVersion: 1,
    promptVersion: 1,
    generatedAt: document.uploadedAt,
    reviewedBy: document.reviewStatus === "approved" ? "u_priya" : null,
    reviewedAt: document.reviewStatus === "approved" ? document.uploadedAt : null,
    overrideReason: null,
    reviewNote: null,
  };
});

export const mockReviewExtractionRuns: MockReviewExtractionRun[] = mockManagedDocuments.map((document, index) => ({
  id: `run-${document.id}`,
  documentId: document.id,
  caseId: document.caseId,
  confidence: document.confidence ?? Math.max(0.42, 0.88 - (index % 4) * 0.09),
  provider: "mock",
  model: "mock-v1",
  schemaVersion: 1,
  promptVersion: 1,
  extractionVersion: index + 1,
  generatedAt: document.uploadedAt,
}));

export const mockReviewFields: MockReviewField[] = mockManagedDocuments.flatMap((document) => {
  const run = mockReviewExtractionRuns.find((item) => item.documentId === document.id)!;
  return seededFields(document.id, document.caseId, run.id, document.filename);
});

export const mockReviewQualityWarnings: MockReviewQualityWarning[] = mockManagedDocuments
  .filter((document) => document.qualityWarning || document.blurryWarning || document.status === "expired")
  .flatMap((document) => {
    const rows: MockReviewQualityWarning[] = [];
    if (document.qualityWarning) {
      rows.push({
        id: `quality-${document.id}-quality`,
        documentId: document.id,
        caseId: document.caseId,
        issueKey: "low_resolution",
        severity: "medium",
        confidence: 0.71,
        status: "pending_review",
      });
    }
    if (document.blurryWarning) {
      rows.push({
        id: `quality-${document.id}-blur`,
        documentId: document.id,
        caseId: document.caseId,
        issueKey: "blurry_image",
        severity: "medium",
        confidence: 0.68,
        status: "pending_review",
      });
    }
    if (document.status === "expired") {
      rows.push({
        id: `quality-${document.id}-expired`,
        documentId: document.id,
        caseId: document.caseId,
        issueKey: "document_expired",
        severity: "high",
        confidence: 0.86,
        status: "pending_review",
      });
    }
    return rows;
  });

export const mockReviewDrafts: MockReviewDraft[] = [];
export const mockCaseFacts: MockCaseFact[] = [];

export function getMockCaseMeta(caseId: string) {
  const caseRecord = mockCaseRecords.find((item) => item.id === caseId);
  if (!caseRecord) return null;
  const client = mockClients.find((item) => item.id === caseRecord.clientId);
  return {
    caseId,
    caseTitle: caseRecord.title,
    streamLabel: caseRecord.streamLabel,
    clientName: client?.legalName ?? "Unknown Client",
    assignedReviewerName:
      mockTeamUsers.find((item) => item.id === caseRecord.assignedPractitionerId)?.fullName ?? "Unassigned",
  };
}

export function getMockChecklistForCase(caseId: string) {
  return mockChecklistDocumentLinks.filter((item) => item.caseId === caseId);
}

export function getMockUnresolvedFlagCount(caseId: string) {
  return mockCaseFlags.filter((item) => item.caseId === caseId && item.status !== "resolved").length;
}

export function getMockReviewerNameById(userId: string | null | undefined): string {
  if (!userId) return "Unassigned";
  return mockTeamUsers.find((item) => item.id === userId)?.fullName ?? "Assigned Reviewer";
}
