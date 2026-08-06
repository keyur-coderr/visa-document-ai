import { NextResponse } from "next/server";
import { getAiProcessingEnv } from "@/lib/env/ai-processing";
import { processNextQueuedDocumentJob } from "@/server/services/ai-processing-service";

export async function POST(request: Request) {
  const env = getAiProcessingEnv();
  const token = request.headers.get("x-ai-job-token");

  if (!env.internalJobToken || token !== env.internalJobToken) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const result = await processNextQueuedDocumentJob();
  return NextResponse.json(result, { status: 200 });
}
