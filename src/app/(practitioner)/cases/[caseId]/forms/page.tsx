import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageContainer } from "@/components/ui/PageContainer";
import { StatusChip } from "@/components/ui/StatusChip";
import { getAuthSession } from "@/server/auth/session";
import { listCaseFormWorkspace } from "@/server/services/forms-service";

function toneFromStatus(status: string) {
  if (status === "approved") return "success" as const;
  if (status === "failed" || status === "unsupported") return "danger" as const;
  if (status === "generated" || status === "needs_review") return "warning" as const;
  return "info" as const;
}

export default async function CaseFormsPage({ params }: { params: { caseId: string } }) {
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
      title="Form Workspace"
      description="Generate, review, and approve IRCC forms using practitioner-approved case data only."
      actions={
        <Link href={`/cases/${params.caseId}/forms/new`} className="focus-ring rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-700">
          New Form Generation
        </Link>
      }
    >
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{workspace.caseTitle}</CardTitle>
            <CardDescription>{workspace.clientName} · {workspace.streamKey}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {workspace.formOptions.map((item) => (
              <div key={item.code} className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-neutral-800 dark:text-neutral-200">{item.code} · {item.formName}</p>
                  <StatusChip label={item.status} tone={item.status === "supported" ? "success" : item.status === "partial" ? "warning" : "danger"} />
                </div>
                <p className="mt-1 text-xs text-neutral-500">Version {item.version} · Mapping v{item.mappingVersion}</p>
                <p className="mt-1 text-xs text-neutral-500">Template mode: {item.templateMode}</p>
                <p className="mt-2 text-xs font-medium text-neutral-600">Missing required sources: {item.missingFacts.length}</p>
                {item.missingFacts.length ? (
                  <ul className="mt-1 list-disc pl-5 text-xs text-neutral-500">
                    {item.missingFacts.slice(0, 6).map((field) => <li key={field}>{field}</li>)}
                  </ul>
                ) : (
                  <p className="mt-1 text-xs text-success-700">No required source gaps detected.</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generation History</CardTitle>
            <CardDescription>Versioned outputs are immutable; regenerate to create a new version.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {workspace.generatedForms.length === 0 ? (
              <p className="text-sm text-neutral-500">No form generation runs yet.</p>
            ) : (
              workspace.generatedForms.map((form) => (
                <Link key={form.id} href={`/cases/${params.caseId}/forms/${form.id}`} className="block rounded-lg border border-neutral-200 px-3 py-2 hover:border-brand-300 dark:border-neutral-800">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{form.formCode} · {form.formName}</p>
                    <StatusChip label={form.status} tone={toneFromStatus(form.status)} />
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">Form version {form.formVersion} · Mapping v{form.mappingVersion} · Latest generated version {form.latestVersion}</p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
