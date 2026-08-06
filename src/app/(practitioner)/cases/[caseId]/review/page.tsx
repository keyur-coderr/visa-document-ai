import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageContainer } from "@/components/ui/PageContainer";
import { StatusChip } from "@/components/ui/StatusChip";
import { getAuthSession } from "@/server/auth/session";
import { getCaseReviewWorkspace } from "@/server/services/review-service";

export default async function CaseReviewPage({ params }: { params: { caseId: string } }) {
  const session = await getAuthSession();
  if (session.role !== "practitioner" && session.role !== "assistant") notFound();

  const workspace = await getCaseReviewWorkspace(params.caseId);
  if (!workspace) notFound();

  return (
    <PageContainer title="Case Review Workspace" description="Cross-check AI extraction output with source documents before practitioner approval.">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{workspace.caseTitle}</CardTitle>
            <CardDescription>{workspace.clientName} · {workspace.stream}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-neutral-200 p-3 text-sm dark:border-neutral-800">
                <p className="text-xs text-neutral-500">Fields reviewed</p>
                <p className="text-lg font-semibold">{workspace.reviewProgress.fieldsReviewed}</p>
              </div>
              <div className="rounded-lg border border-neutral-200 p-3 text-sm dark:border-neutral-800">
                <p className="text-xs text-neutral-500">Fields remaining</p>
                <p className="text-lg font-semibold">{workspace.reviewProgress.fieldsRemaining}</p>
              </div>
              <div className="rounded-lg border border-neutral-200 p-3 text-sm dark:border-neutral-800">
                <p className="text-xs text-neutral-500">Pending approvals</p>
                <p className="text-lg font-semibold">{workspace.reviewProgress.pendingApprovals}</p>
              </div>
              <div className="rounded-lg border border-neutral-200 p-3 text-sm dark:border-neutral-800">
                <p className="text-xs text-neutral-500">Unresolved warnings</p>
                <p className="text-lg font-semibold">{workspace.reviewProgress.unresolvedWarnings}</p>
              </div>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
              <div className="h-full bg-brand-600" style={{ width: `${workspace.reviewProgress.completionPercent}%` }} />
            </div>

            <div className="space-y-2 rounded-lg border border-neutral-200 p-3 text-sm dark:border-neutral-800">
              <p className="font-medium">Case checklist</p>
              <ul className="space-y-2">
                {workspace.checklist.map((item) => (
                  <li key={item.requirementId} className="flex items-center justify-between gap-2">
                    <span>{item.requirementName}</span>
                    <StatusChip label={item.status.replaceAll("_", " ")} tone={item.status === "approved" ? "success" : item.status === "missing" ? "danger" : "warning"} />
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Document queue</CardTitle>
            <CardDescription>Open a document to review extracted fields.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {workspace.documents.map((document) => (
              <Link key={document.documentId} href={`/cases/${workspace.caseId}/review/${document.documentId}`} className="block rounded-lg border border-neutral-200 px-3 py-2 hover:border-brand-300 dark:border-neutral-800">
                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{document.filename}</p>
                <div className="mt-1 flex items-center justify-between text-xs text-neutral-500">
                  <span>{document.predictedCategory}</span>
                  <span>{new Date(document.uploadedAt).toLocaleDateString()}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <StatusChip label={document.status.replaceAll("_", " ")} tone={document.status === "approved" ? "success" : document.status === "rejected" ? "danger" : "warning"} />
                  <span>Warnings: {document.qualityWarningCount}</span>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
