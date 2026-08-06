export type ProcessingProvider = "mock" | "openai";

export type DocumentCategoryKey =
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

export type DocumentQualityIssueKey =
  | "unreadable_file"
  | "blurry_image"
  | "low_resolution"
  | "wrong_orientation"
  | "missing_page"
  | "duplicate_document"
  | "unsupported_file"
  | "password_protected_pdf"
  | "corrupted_file"
  | "low_ocr_confidence"
  | "document_expired"
  | "document_expiring_soon"
  | "name_mismatch"
  | "date_inconsistency";

export interface OcrPage {
  page: number;
  text: string;
}

export interface OcrResult {
  provider: ProcessingProvider;
  model: string;
  confidence: number;
  pages: OcrPage[];
  sourceMetadata: Record<string, unknown>;
}

export interface ClassificationAlternative {
  category: DocumentCategoryKey;
  confidence: number;
}

export interface ClassificationResult {
  provider: ProcessingProvider;
  model: string;
  schemaVersion: number;
  promptVersion: number;
  predictedCategory: DocumentCategoryKey;
  confidence: number;
  alternatives: ClassificationAlternative[];
  sourceMetadata: Record<string, unknown>;
}

export interface ExtractedFieldResult {
  fieldKey: string;
  rawValue: string | null;
  normalizedValue: string | null;
  confidence: number;
  sourcePage: number | null;
  sourceText: string | null;
  sourceCoordinates: Record<string, unknown> | null;
  reviewRequired: boolean;
}

export interface StructuredExtractionResult {
  provider: ProcessingProvider;
  model: string;
  schemaVersion: number;
  promptVersion: number;
  confidence: number;
  extractedJson: Record<string, unknown>;
  fields: ExtractedFieldResult[];
  sourceMetadata: Record<string, unknown>;
}

export interface QualityIssueResult {
  issueKey: DocumentQualityIssueKey;
  severity: "low" | "medium" | "high";
  confidence: number;
  details: Record<string, unknown>;
}

export interface ProviderDocumentInput {
  documentId: string;
  filename: string;
  mimeType: string;
  contentBytes: Buffer;
}
