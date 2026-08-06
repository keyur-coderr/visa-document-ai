export interface AiProcessingEnv {
  openAiApiKey?: string;
  openAiModel: string;
  provider: "mock" | "openai";
  internalJobToken?: string;
}

export function getAiProcessingEnv(): AiProcessingEnv {
  const openAiApiKey = process.env.OPENAI_API_KEY;
  const provider = openAiApiKey ? "openai" : "mock";

  return {
    openAiApiKey,
    openAiModel: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
    provider,
    internalJobToken: process.env.AI_PROCESSING_INTERNAL_TOKEN,
  };
}

export function isOpenAiProcessingEnabled(): boolean {
  return getAiProcessingEnv().provider === "openai";
}
