import type { DocumentCategoryKey, StructuredExtractionResult } from "@/server/ai/types";

export interface StructuredExtractionProvider {
  extractStructuredData(input: {
    category: DocumentCategoryKey;
    ocrText: string;
    filename: string;
  }): Promise<StructuredExtractionResult>;
}
