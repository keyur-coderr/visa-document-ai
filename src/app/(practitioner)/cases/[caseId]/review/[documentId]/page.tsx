import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentReviewWorkspaceClient } from "@/components/review/DocumentReviewWorkspaceClient";
import { PageContainer } from "@/components/ui/PageContainer";
import { getAuthSession } from "@/server/auth/session";
import { getCaseReviewWorkspace, getDocumentReviewDetail } from "@/server/services/review-service";

export default async function DocumentReviewPage({ params }: { params: { caseId: string; documentId: string } }) {
  const [workspace, detail, session] = await Promise.all([
    getCaseReviewWorkspace(params.caseId),
    getDocumentReviewDetail(params.caseId, params.documentId),
    getAuthSession(),
  ]);

  if (!workspace || !detail) notFound();
  if (session.role !== "practitioner" && session.role !== "assistant") notFound();

  return (
    <PageContainer
      title="Document Review"
      description="Compare source document, AI classification, and extracted fields before approval."
      actions={
        <Link href={`/cases/${params.caseId}/review`} className="focus-ring rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-700">
          Back to Case Review
        </Link>
      }
    >
      <DocumentReviewWorkspaceClient detail={detail} workspace={workspace} role={session.role} />
    </PageContainer>
  );
}
