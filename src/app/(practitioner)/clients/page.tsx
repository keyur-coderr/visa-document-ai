"use client";

import { PageContainer } from "@/components/ui/PageContainer";
import { PageState, useDemoPageState } from "@/components/ui/PageState";

export default function ClientsPage() {
  const [status, setStatus] = useDemoPageState("empty");

  return (
    <PageContainer title="Clients" description="Client records, contact details, and linked cases for your firm.">
      <PageState
        status={status}
        onStatusChange={setStatus}
        emptyTitle="No clients yet"
        emptyDescription="Clients added by your firm will appear here, along with their linked cases."
        errorDescription="We couldn't load your clients. Try again in a moment."
        skeletonVariant="table"
      >
        <div />
      </PageState>
    </PageContainer>
  );
}
