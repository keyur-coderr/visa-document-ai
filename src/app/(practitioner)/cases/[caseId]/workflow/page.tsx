import Link from "next/link";
import { notFound } from "next/navigation";
import { CaseProgressTracker } from "@/components/lifecycle/CaseProgressTracker";
import { CaseWorkflowActionsClient } from "@/components/lifecycle/CaseWorkflowActionsClient";
import { NotificationsListClient } from "@/components/lifecycle/NotificationsListClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageContainer } from "@/components/ui/PageContainer";
import { getAuthSession } from "@/server/auth/session";
import { getCaseLifecycleWorkspace } from "@/server/services/lifecycle-service";

export default async function CaseWorkflowPage({ params }: { params: { caseId: string } }) {
  const session = await getAuthSession();
  if (session.role !== "practitioner" && session.role !== "assistant") notFound();

  const workspace = await getCaseLifecycleWorkspace(params.caseId);
  if (!workspace) notFound();

  return (
    <PageContainer
      title="Case Workflow"
      description="Lifecycle stages, milestones, tasks, and notifications for this case."
      actions={
        <>
          <Link href={`/cases/${params.caseId}/tasks`} className="focus-ring rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-700">Tasks</Link>
          <Link href={`/cases/${params.caseId}/timeline`} className="focus-ring rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-700">Timeline</Link>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <CardHeader>
            <CardTitle>{workspace.caseTitle}</CardTitle>
            <CardDescription>{workspace.clientName} · {workspace.streamKey}</CardDescription>
          </CardHeader>
          <CardContent>
            <CaseProgressTracker
              stages={workspace.stages}
              currentStage={workspace.currentStage}
              completionPercent={workspace.completionPercent}
              estimatedCompletionDate={workspace.estimatedCompletionDate}
            />
          </CardContent>
        </Card>

        <Card className="xl:col-span-4">
          <CardHeader>
            <CardTitle>Workflow Actions</CardTitle>
            <CardDescription>Transition stages and create internal tasks.</CardDescription>
          </CardHeader>
          <CardContent>
            <CaseWorkflowActionsClient caseId={workspace.caseId} stages={workspace.stages} />
          </CardContent>
        </Card>

        <Card className="xl:col-span-6">
          <CardHeader>
            <CardTitle>Open Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {workspace.tasks.length === 0 ? (
              <p className="text-sm text-neutral-500">No tasks.</p>
            ) : (
              workspace.tasks.map((task) => (
                <div key={task.id} className="rounded-lg border border-neutral-200 p-3 text-sm dark:border-neutral-800">
                  <p className="font-medium text-neutral-800 dark:text-neutral-200">{task.title}</p>
                  <p className="text-xs text-neutral-500">Priority: {task.priority} · Status: {task.status}</p>
                  <p className="text-xs text-neutral-500">Due: {task.dueAt ? new Date(task.dueAt).toLocaleString() : "N/A"} · Assigned: {task.assignedTo}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-6">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <NotificationsListClient notifications={workspace.notifications} />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
