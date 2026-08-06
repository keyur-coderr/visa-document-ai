import { AiReviewQueueClient } from "@/components/review/AiReviewQueueClient";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageState } from "@/components/ui/PageState";
import { getAuthSession } from "@/server/auth/session";
import { listReviewQueue } from "@/server/services/review-service";

export default async function AiReviewPage() {
  const session = await getAuthSession();
  if (session.role !== "practitioner" && session.role !== "assistant") {
    notFound();
  }

  let rows = [];
  let status: "loading" | "empty" | "error" | "ready" = "loading";

  try {
    rows = await listReviewQueue();
    status = rows.length ? "ready" : "empty";
  } catch {
    status = "error";
  }

  return (
    <PageContainer
      title="AI Review"
      description="Human review queue for AI-generated extractions, classifications, and flags. Every item requires practitioner sign-off."
    >
      <PageState
        status={status}
        emptyTitle="Nothing waiting for review"
        emptyDescription="AI-generated extractions, classifications, and flags that need your approval will appear here."
        errorDescription="We couldn't load the review queue. Try again in a moment."
        skeletonVariant="table"
      >
        <AiReviewQueueClient rows={rows} />
      </PageState>
    </PageContainer>
  );
}
