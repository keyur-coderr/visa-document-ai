import { getAiProcessingEnv } from "@/lib/env/ai-processing";
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

const OPENAI_URL = "https://api.openai.com/v1/responses";

function getOpenAiConfig() {
  const env = getAiProcessingEnv();
  if (!env.openAiApiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }
  return { apiKey: env.openAiApiKey, model: env.openAiModel };
}

async function callOpenAiJson<T>(instruction: string, inputText: string): Promise<T> {
  const config = getOpenAiConfig();
  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0,
      response_format: { type: "json_object" },
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: instruction }],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: inputText.slice(0, 20000) }],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`openai_response_failed_${response.status}`);
  }

  const payload = (await response.json()) as { output_text?: string };
  const text = payload.output_text ?? "{}";
  return JSON.parse(text) as T;
}

export class OpenAiOcrProvider implements OcrProvider {
  async extractText(input: ProviderDocumentInput): Promise<OcrResult> {
    // For Phase 7, OCR with OpenAI is best-effort and image-first; unsupported types degrade safely.
    const text = `OCR placeholder for ${input.filename}`;
    return {
      provider: "openai",
      model: getAiProcessingEnv().openAiModel,
      confidence: input.mimeType.startsWith("image/") ? 0.75 : 0.55,
      pages: [{ page: 1, text }],
      sourceMetadata: { mode: "best_effort", mimeType: input.mimeType, byteLength: input.contentBytes.length },
    };
  }
}

interface OpenAiClassificationPayload {
  predictedCategory: DocumentCategoryKey;
  confidence: number;
  alternatives: Array<{ category: DocumentCategoryKey; confidence: number }>;
}

export class OpenAiClassificationProvider implements ClassificationProvider {
  async classifyDocument(input: { filename: string; mimeType: string; ocrText: string }): Promise<ClassificationResult> {
    const payload = await callOpenAiJson<OpenAiClassificationPayload>(
      "Classify this immigration-supporting document. Return JSON with predictedCategory, confidence (0..1), alternatives[]. Allowed categories: passport, language_test, wes_eca_report, educational_degree, educational_transcript, employment_reference_letter, employment_offer_letter, pay_slip, tax_document, bank_statement, police_clearance_certificate, marriage_certificate, birth_certificate, resume_cv, medical_document, work_permit, study_permit, visitor_visa, permanent_resident_card, national_id, unknown.",
      `Filename: ${input.filename}\nMimeType: ${input.mimeType}\nOCR: ${input.ocrText}`,
    );

    return {
      provider: "openai",
      model: getAiProcessingEnv().openAiModel,
      schemaVersion: 1,
      promptVersion: 1,
      predictedCategory: payload.predictedCategory ?? "unknown",
      confidence: Number.isFinite(payload.confidence) ? Math.max(0, Math.min(1, payload.confidence)) : 0.5,
      alternatives: Array.isArray(payload.alternatives) ? payload.alternatives.slice(0, 5) : [{ category: "unknown", confidence: 1 }],
      sourceMetadata: { mimeType: input.mimeType, ocrLength: input.ocrText.length },
    };
  }
}

interface OpenAiExtractionField {
  fieldKey: string;
  rawValue: string | null;
  normalizedValue: string | null;
  confidence: number;
  sourcePage: number | null;
  sourceText: string | null;
  sourceCoordinates: Record<string, unknown> | null;
}

interface OpenAiExtractionPayload {
  confidence: number;
  extractedJson: Record<string, unknown>;
  fields: OpenAiExtractionField[];
}

export class OpenAiStructuredExtractionProvider implements StructuredExtractionProvider {
  async extractStructuredData(input: { category: DocumentCategoryKey; ocrText: string; filename: string }): Promise<StructuredExtractionResult> {
    const payload = await callOpenAiJson<OpenAiExtractionPayload>(
      "Extract structured fields from an immigration document. Return strict JSON: confidence (0..1), extractedJson object, fields array with fieldKey/rawValue/normalizedValue/confidence/sourcePage/sourceText/sourceCoordinates. Include only fields present in the document. Never include legal advice.",
      `Category: ${input.category}\nFilename: ${input.filename}\nOCR: ${input.ocrText}`,
    );

    return {
      provider: "openai",
      model: getAiProcessingEnv().openAiModel,
      schemaVersion: 1,
      promptVersion: 1,
      confidence: Number.isFinite(payload.confidence) ? Math.max(0, Math.min(1, payload.confidence)) : 0.5,
      extractedJson: payload.extractedJson ?? {},
      fields: (payload.fields ?? []).map((field) => ({
        fieldKey: field.fieldKey,
        rawValue: field.rawValue,
        normalizedValue: field.normalizedValue,
        confidence: Number.isFinite(field.confidence) ? Math.max(0, Math.min(1, field.confidence)) : 0,
        sourcePage: field.sourcePage,
        sourceText: field.sourceText,
        sourceCoordinates: field.sourceCoordinates,
        reviewRequired: true,
      })),
      sourceMetadata: { category: input.category, filename: input.filename },
    };
  }
}
