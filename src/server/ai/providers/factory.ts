import { getAiProcessingEnv } from "@/lib/env/ai-processing";
import type { ClassificationProvider } from "@/server/ai/providers/classification-provider";
import type { StructuredExtractionProvider } from "@/server/ai/providers/extraction-provider";
import type { OcrProvider } from "@/server/ai/providers/ocr-provider";
import {
  MockClassificationProvider,
  MockOcrProvider,
  MockStructuredExtractionProvider,
} from "@/server/ai/providers/mock-provider";
import {
  OpenAiClassificationProvider,
  OpenAiOcrProvider,
  OpenAiStructuredExtractionProvider,
} from "@/server/ai/providers/openai-provider";

export interface AiProviderBundle {
  provider: "mock" | "openai";
  ocr: OcrProvider;
  classifier: ClassificationProvider;
  extractor: StructuredExtractionProvider;
}

let cached: AiProviderBundle | null = null;

export function getAiProviderBundle(): AiProviderBundle {
  if (cached) return cached;

  const env = getAiProcessingEnv();
  if (env.provider === "openai") {
    cached = {
      provider: "openai",
      ocr: new OpenAiOcrProvider(),
      classifier: new OpenAiClassificationProvider(),
      extractor: new OpenAiStructuredExtractionProvider(),
    };
    return cached;
  }

  cached = {
    provider: "mock",
    ocr: new MockOcrProvider(),
    classifier: new MockClassificationProvider(),
    extractor: new MockStructuredExtractionProvider(),
  };
  return cached;
}
