"use client";

import { PageContainer } from "@/components/ui/PageContainer";
import { PageState, useDemoPageState } from "@/components/ui/PageState";

export default function AiReviewPage() {
  const [status, setStatus] = useDemoPageState("empty");

  return (
    <PageContainer
      title="AI Review"
      description="Human review queue for AI-generated extractions, classifications, and flags. Every item requires practitioner sign-off."
    >
      <PageState
        status={status}
        onStatusChange={setStatus}
        emptyTitle="Nothing waiting for review"
        emptyDescription="AI-generated extractions, classifications, and flags that need your approval will appear here."
        errorDescription="We couldn't load the review queue. Try again in a moment."
        skeletonVariant="table"
      >
        <div />
      </PageState>
    </PageContainer>
  );
}
