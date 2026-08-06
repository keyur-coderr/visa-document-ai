import Link from "next/link";
import { notFound } from "next/navigation";
import { GeneratedFormDetailClient } from "@/components/forms/GeneratedFormDetailClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageContainer } from "@/components/ui/PageContainer";
import { StatusChip } from "@/components/ui/StatusChip";
import { getAuthSession } from "@/server/auth/session";
import { getGeneratedFormDetail, getGeneratedFormSignedUrl } from "@/server/services/forms-service";

function toneFromStatus(status: string) {
  if (status === "approved") return "success" as const;
  if (status === "failed" || status === "unsupported") return "danger" as const;
  if (status === "generated" || status === "needs_review") return "warning" as const;
  return "info" as const;
}

export default async function GeneratedFormDetailPage({ params }: { params: { caseId: string; generatedFormId: string } }) {
  const session = await getAuthSession();
  if (session.role !== "practitioner" && session.role !== "assistant") notFound();

  const detail = await getGeneratedFormDetail(params.caseId, params.generatedFormId);
  if (!detail) notFound();
  const previewUrl = await getGeneratedFormSignedUrl(params.caseId, params.generatedFormId);

  return (
    <PageContainer
      title={`${detail.form.formCode} Review`}
      description="Review mapped fields, warnings, and provenance before practitioner approval."
      actions={
        <Link href={`/cases/${params.caseId}/forms`} className="focus-ring rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-700">
          Back to Form Workspace
        </Link>
      }
    >
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-7">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>{detail.form.formCode} · {detail.form.formName}</CardTitle>
              <StatusChip label={detail.form.status} tone={toneFromStatus(detail.form.status)} />
            </div>
            <CardDescription>
              Form version {detail.form.formVersion} · Mapping v{detail.form.mappingVersion} · Latest version #{detail.form.latestVersion}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-neutral-200 p-3 text-sm dark:border-neutral-800">
              <p className="font-medium">Preview / Download</p>
              <p className="mt-1 text-xs text-neutral-500">Mock mode may provide a structured JSON payload instead of a filled official PDF.</p>
              {previewUrl ? (
                <>
                  <a href={previewUrl} target="_blank" className="mt-2 inline-block text-sm font-medium text-brand-700 hover:underline">
                    Open generated output
                  </a>
                  {previewUrl.startsWith("data:application/json") ? null : (
                    <iframe title="Generated form preview" src={previewUrl} className="mt-3 h-[460px] w-full rounded border border-neutral-200" />
                  )}
                </>
              ) : (
                <p className="mt-2 text-xs text-neutral-500">Generated output is unavailable for preview.</p>
              )}
            </div>

            <div className="rounded-lg border border-neutral-200 p-3 text-sm dark:border-neutral-800">
              <p className="font-medium">Current version diagnostics</p>
              <p className="mt-1 text-xs">Missing required fields: {detail.currentVersion?.missingRequiredFields.length ?? 0}</p>
              <p className="text-xs">Skipped fields: {detail.currentVersion?.skippedFields.length ?? 0}</p>
              <p className="text-xs">Unsupported fields: {detail.currentVersion?.unsupportedFields.length ?? 0}</p>
              <p className="text-xs">Manual completion fields: {detail.currentVersion?.manualReviewFields.length ?? 0}</p>
              {detail.currentVersion?.missingRequiredFields.length ? (
                <ul className="mt-2 list-disc pl-5 text-xs text-danger-700">
                  {detail.currentVersion.missingRequiredFields.map((field) => <li key={field}>{field}</li>)}
                </ul>
              ) : null}
            </div>

            <div className="rounded-lg border border-neutral-200 p-3 text-sm dark:border-neutral-800">
              <p className="font-medium">Validation warnings</p>
              {detail.validationWarnings.length === 0 ? (
                <p className="mt-1 text-xs text-success-700">No persisted warnings.</p>
              ) : (
                <ul className="mt-2 space-y-1 text-xs">
                  {detail.validationWarnings.map((warning) => (
                    <li key={warning.id} className="rounded border border-warning-200 bg-warning-50 px-2 py-1">
                      {warning.warningKey}: {warning.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-lg border border-neutral-200 p-3 text-sm dark:border-neutral-800">
              <p className="font-medium">Generation versions</p>
              <ul className="mt-2 space-y-1 text-xs">
                {detail.versions.map((version) => (
                  <li key={version.id} className="rounded border border-neutral-200 px-2 py-1">
                    v{version.version} · {version.generationStatus} · {version.providerName} {version.providerVersion} · template {version.templateMode}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-5">
          <CardHeader>
            <CardTitle>Review Actions</CardTitle>
            <CardDescription>Assistant can prepare/regenerate. Practitioner approval is required for final sign-off.</CardDescription>
          </CardHeader>
          <CardContent>
            <GeneratedFormDetailClient detail={detail} role={session.role} />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
