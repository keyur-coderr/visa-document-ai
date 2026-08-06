import type { ClassificationResult } from "@/server/ai/types";

export interface ClassificationProvider {
  classifyDocument(input: {
    filename: string;
    mimeType: string;
    ocrText: string;
  }): Promise<ClassificationResult>;
}
