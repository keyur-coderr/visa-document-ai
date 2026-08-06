import type { OcrResult, ProviderDocumentInput } from "@/server/ai/types";

export interface OcrProvider {
  extractText(input: ProviderDocumentInput): Promise<OcrResult>;
}
