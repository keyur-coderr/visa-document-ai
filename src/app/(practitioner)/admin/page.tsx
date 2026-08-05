"use client";

import { PageContainer } from "@/components/ui/PageContainer";
import { PageState, useDemoPageState } from "@/components/ui/PageState";

export default function AdminPage() {
  const [status, setStatus] = useDemoPageState("empty");

  return (
    <PageContainer title="Admin" description="Firm administration: team members, roles, and firm-wide configuration.">
      <PageState
        status={status}
        onStatusChange={setStatus}
        emptyTitle="No admin data yet"
        emptyDescription="Team members and firm administration tools will appear here."
        errorDescription="We couldn't load admin data. Try again in a moment."
        skeletonVariant="table"
      >
        <div />
      </PageState>
    </PageContainer>
  );
}
