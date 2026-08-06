import Link from "next/link";
import { notFound } from "next/navigation";
import { FormGenerateClient } from "@/components/forms/FormGenerateClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageContainer } from "@/components/ui/PageContainer";
import { getAuthSession } from "@/server/auth/session";
import { listCaseFormWorkspace } from "@/server/services/forms-service";

export default async function NewCaseFormPage({ params }: { params: { caseId: string } }) {
  const session = await getAuthSession();
  if (session.role !== "practitioner" && session.role !== "assistant") notFound();

  let workspace;
  try {
    workspace = await listCaseFormWorkspace(params.caseId);
  } catch {
    notFound();
  }

  return (
    <PageContainer
      title="Generate IRCC Form"
      description="Run versioned generation from approved case data with manual review safeguards."
      actions={
        <Link href={`/cases/${params.caseId}/forms`} className="focus-ring rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-700">
          Back to Form Workspace
        </Link>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>New Generation Run</CardTitle>
          <CardDescription>{workspace.caseTitle} · {workspace.clientName}</CardDescription>
        </CardHeader>
        <CardContent>
          <FormGenerateClient
            caseId={params.caseId}
            options={workspace.formOptions.map((item) => ({
              code: item.code,
              formName: item.formName,
              version: item.version,
              status: item.status,
            }))}
          />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
