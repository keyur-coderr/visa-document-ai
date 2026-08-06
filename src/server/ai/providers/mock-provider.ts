import type { ClassificationProvider } from "@/server/ai/providers/classification-provider";
import type { OcrProvider } from "@/server/ai/providers/ocr-provider";
import type { StructuredExtractionProvider } from "@/server/ai/providers/extraction-provider";
import type {
  ClassificationResult,
  DocumentCategoryKey,
  OcrResult,
  ProviderDocumentInput,
  StructuredExtractionResult,
} from "@/server/ai/types";

const MODEL = "mock-v1";

function guessCategory(filename: string): DocumentCategoryKey {
  const normalized = filename.toLowerCase();
  if (normalized.includes("passport")) return "passport";
  if (normalized.includes("ielts") || normalized.includes("celpip")) return "language_test";
  if (normalized.includes("wes") || normalized.includes("eca")) return "wes_eca_report";
  if (normalized.includes("marriage")) return "marriage_certificate";
  if (normalized.includes("birth")) return "birth_certificate";
  if (normalized.includes("permit")) return normalized.includes("study") ? "study_permit" : "work_permit";
  if (normalized.includes("bank")) return "bank_statement";
  if (normalized.includes("tax") || normalized.includes("t4") || normalized.includes("notice")) return "tax_document";
  return "unknown";
}

export class MockOcrProvider implements OcrProvider {
  async extractText(input: ProviderDocumentInput): Promise<OcrResult> {
    return {
      provider: "mock",
      model: MODEL,
      confidence: 0.82,
      pages: [{ page: 1, text: `Mock OCR output for ${input.filename}` }],
      sourceMetadata: { strategy: "filename_only", byteLength: input.contentBytes.length },
    };
  }
}

export class MockClassificationProvider implements ClassificationProvider {
  async classifyDocument(input: { filename: string; mimeType: string; ocrText: string }): Promise<ClassificationResult> {
    const category = guessCategory(input.filename);
    return {
      provider: "mock",
      model: MODEL,
      schemaVersion: 1,
      promptVersion: 1,
      predictedCategory: category,
      confidence: 0.78,
      alternatives: [
        { category, confidence: 0.78 },
        { category: "unknown", confidence: 0.22 },
      ],
      sourceMetadata: { mimeType: input.mimeType, textSampleLength: input.ocrText.length },
    };
  }
}

function mockFieldsForCategory(category: DocumentCategoryKey, ocrText: string): StructuredExtractionResult["fields"] {
  if (category === "passport") {
    return [
      { fieldKey: "legal_name", rawValue: "Mock Applicant", normalizedValue: "MOCK APPLICANT", confidence: 0.74, sourcePage: 1, sourceText: ocrText.slice(0, 80), sourceCoordinates: null, reviewRequired: true },
      { fieldKey: "passport_number", rawValue: "M1234567", normalizedValue: "M1234567", confidence: 0.71, sourcePage: 1, sourceText: "Passport No: M1234567", sourceCoordinates: null, reviewRequired: true },
      { fieldKey: "expiry_date", rawValue: "2030-06-01", normalizedValue: "2030-06-01", confidence: 0.66, sourcePage: 1, sourceText: "Expiry: 2030-06-01", sourceCoordinates: null, reviewRequired: true },
    ];
  }
  if (category === "language_test") {
    return [
      { fieldKey: "candidate_name", rawValue: "Mock Applicant", normalizedValue: "Mock Applicant", confidence: 0.7, sourcePage: 1, sourceText: ocrText.slice(0, 80), sourceCoordinates: null, reviewRequired: true },
      { fieldKey: "test_type", rawValue: "IELTS", normalizedValue: "IELTS", confidence: 0.76, sourcePage: 1, sourceText: "IELTS", sourceCoordinates: null, reviewRequired: true },
      { fieldKey: "overall_score", rawValue: "7.0", normalizedValue: "7.0", confidence: 0.62, sourcePage: 1, sourceText: "Overall: 7.0", sourceCoordinates: null, reviewRequired: true },
    ];
  }
  return [
    { fieldKey: "document_title", rawValue: "Unknown document", normalizedValue: "Unknown document", confidence: 0.41, sourcePage: 1, sourceText: ocrText.slice(0, 80), sourceCoordinates: null, reviewRequired: true },
  ];
}

export class MockStructuredExtractionProvider implements StructuredExtractionProvider {
  async extractStructuredData(input: { category: DocumentCategoryKey; ocrText: string; filename: string }): Promise<StructuredExtractionResult> {
    const fields = mockFieldsForCategory(input.category, input.ocrText);
    return {
      provider: "mock",
      model: MODEL,
      schemaVersion: 1,
      promptVersion: 1,
      confidence: Math.max(0.4, Math.min(0.9, fields.reduce((sum, field) => sum + field.confidence, 0) / fields.length)),
      extractedJson: Object.fromEntries(fields.map((field) => [field.fieldKey, field.normalizedValue])),
      fields,
      sourceMetadata: { filename: input.filename, strategy: "mock-template" },
    };
  }
}
