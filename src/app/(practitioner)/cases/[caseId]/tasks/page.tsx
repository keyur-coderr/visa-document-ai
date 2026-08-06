import Link from "next/link";
import { notFound } from "next/navigation";
import { CaseTasksClient } from "@/components/lifecycle/CaseTasksClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageContainer } from "@/components/ui/PageContainer";
import { getAuthSession } from "@/server/auth/session";
import { getCaseLifecycleWorkspace } from "@/server/services/lifecycle-service";

export default async function CaseTasksPage({ params }: { params: { caseId: string } }) {
  const session = await getAuthSession();
  if (session.role !== "practitioner" && session.role !== "assistant") notFound();

  const workspace = await getCaseLifecycleWorkspace(params.caseId);
  if (!workspace) notFound();

  return (
    <PageContainer
      title="Case Tasks"
      description="Internal task queue tied to workflow milestones."
      actions={<Link href={`/cases/${params.caseId}/workflow`} className="focus-ring rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-700">Back to Workflow</Link>}
    >
      <Card>
        <CardHeader>
          <CardTitle>{workspace.caseTitle}</CardTitle>
          <CardDescription>{workspace.tasks.length} tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <CaseTasksClient caseId={workspace.caseId} tasks={workspace.tasks} />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
