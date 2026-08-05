"use client";

import { PageContainer } from "@/components/ui/PageContainer";
import { PageState, useDemoPageState } from "@/components/ui/PageState";

export default function ReportsPage() {
  const [status, setStatus] = useDemoPageState("empty");

  return (
    <PageContainer title="Reports" description="Operational and compliance reporting across cases, documents, and staff activity.">
      <PageState
        status={status}
        onStatusChange={setStatus}
        emptyTitle="No reports yet"
        emptyDescription="Generated reports will appear here once reporting is configured."
        errorDescription="We couldn't load your reports. Try again in a moment."
        skeletonVariant="card"
      >
        <div />
      </PageState>
    </PageContainer>
  );
}
