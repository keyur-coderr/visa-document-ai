"use client";

import { PageContainer } from "@/components/ui/PageContainer";
import { PageState, useDemoPageState } from "@/components/ui/PageState";

export default function SettingsPage() {
  const [status, setStatus] = useDemoPageState("empty");

  return (
    <PageContainer title="Settings" description="Firm branding, notification preferences, and account settings.">
      <PageState
        status={status}
        onStatusChange={setStatus}
        emptyTitle="No settings configured yet"
        emptyDescription="Firm and account preferences will appear here once configuration is available."
        errorDescription="We couldn't load your settings. Try again in a moment."
        skeletonVariant="card"
      >
        <div />
      </PageState>
    </PageContainer>
  );
}
