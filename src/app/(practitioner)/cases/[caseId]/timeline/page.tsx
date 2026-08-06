import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageContainer } from "@/components/ui/PageContainer";
import { getAuthSession } from "@/server/auth/session";
import { getCaseLifecycleWorkspace } from "@/server/services/lifecycle-service";

export default async function CaseTimelinePage({ params }: { params: { caseId: string } }) {
  const session = await getAuthSession();
  if (session.role !== "practitioner" && session.role !== "assistant") notFound();

  const workspace = await getCaseLifecycleWorkspace(params.caseId);
  if (!workspace) notFound();

  return (
    <PageContainer
      title="Case Timeline"
      description="Immutable timeline of lifecycle and workflow actions."
      actions={<Link href={`/cases/${params.caseId}/workflow`} className="focus-ring rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-700">Back to Workflow</Link>}
    >
      <Card>
        <CardHeader>
          <CardTitle>{workspace.caseTitle}</CardTitle>
          <CardDescription>{workspace.timeline.length} events</CardDescription>
        </CardHeader>
        <CardContent>
          {workspace.timeline.length === 0 ? (
            <p className="text-sm text-neutral-500">No timeline events yet.</p>
          ) : (
            <ul className="space-y-2">
              {workspace.timeline.map((event) => (
                <li key={event.id} className="rounded-lg border border-neutral-200 p-3 text-sm dark:border-neutral-800">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-neutral-800 dark:text-neutral-200">{event.eventLabel}</p>
                    <span className="text-xs text-neutral-500">{event.icon}</span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">{event.actor} ({event.actorRole}) · {new Date(event.createdAt).toLocaleString()}</p>
                  <p className="text-xs text-neutral-500">Event key: {event.eventKey}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
