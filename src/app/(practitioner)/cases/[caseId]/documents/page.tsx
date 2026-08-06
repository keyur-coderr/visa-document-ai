"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getStreamConfig } from "@/config/streams";
import { CaseChecklistDocumentPanel } from "@/components/documents/CaseChecklistDocumentPanel";
import { DocumentWorkspace } from "@/components/documents/DocumentWorkspace";
import { MockUploadPanel, type UploadResult } from "@/components/documents/MockUploadPanel";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageState, useDemoPageState } from "@/components/ui/PageState";
import {
  getCaseById,
  getClientById,
} from "@/lib/mock/case-management";
import {
  getChecklistLinksForCase,
  getDuplicateGroupsForCase,
  mockManagedDocuments,
  withExhibitLabels,
  type MockChecklistDocumentLink,
  type MockManagedDocument,
} from "@/lib/mock/documents";

export default function CaseDocumentsPage() {
  const params = useParams<{ caseId: string }>();
  const caseId = params.caseId;
  const [status, setStatus] = useDemoPageState("ready");

  const caseRecord = getCaseById(caseId);
  const client = caseRecord ? getClientById(caseRecord.clientId) : undefined;

  const [documents, setDocuments] = useState<MockManagedDocument[]>(
    mockManagedDocuments.filter((document) => document.caseId === caseId).map((item) => ({ ...item })),
  );
  const [checklistLinks, setChecklistLinks] = useState<MockChecklistDocumentLink[]>(() => {
    if (!caseRecord) return [];

    const seededLinks = getChecklistLinksForCase(caseId).map((item) => ({ ...item }));
    const byRequirementKey = new Map(seededLinks.map((link) => [link.requirementKey, link]));

    const streamConfig = getStreamConfig(caseRecord.streamKey);
    const generated = streamConfig.checklistGroups.flatMap((group) =>
      group.items.map((item) => {
        const existing = byRequirementKey.get(item.key);
        if (existing) return existing;
        return {
          id: `generated_${caseId}_${item.key}`,
          caseId,
          requirementKey: item.key,
          requirementName: item.label,
          participantScope: item.appliesTo,
          required: item.kind === "required",
          status: item.kind === "required" ? "missing" : "uploaded",
          linkedDocumentIds: [],
          practitionerNote: "Awaiting upload.",
          reviewStatus: "pending_review",
        } satisfies MockChecklistDocumentLink;
      }),
    );

    return generated;
  });

  const rows = useMemo(() => withExhibitLabels(documents), [documents]);
  const duplicateGroups = useMemo(() => getDuplicateGroupsForCase(caseId), [caseId]);

  function handleUpload(results: UploadResult[]) {
    if (!caseRecord || !client) return;

    const successful = results.filter((result) => result.state === "success");
    if (successful.length === 0) return;

    setDocuments((existing) => [
      ...successful.map((result, index) => ({
        id: `doc_case_${Date.now()}_${index}`,
        caseId,
        clientId: client.id,
        caseTitle: caseRecord.title,
        clientName: client.legalName,
        filename: result.fileName,
        category: "supporting" as const,
        status: "uploaded" as const,
        participantScope: "applicant" as const,
        requirementKey: null,
        uploadedBy: "Mock Upload",
        uploadedAt: new Date().toISOString(),
        sizeKb: result.sizeKb,
        checksumPlaceholder: "sha256:mock-upload",
        confidence: null,
        exhibitOrder: existing.length + index,
        archived: false,
        practitionerNotes: ["Uploaded via mock upload panel."],
        reviewStatus: "pending_review" as const,
        orientationCorrected: false,
        qualityWarning: false,
        blurryWarning: false,
      })),
      ...existing,
    ]);
  }

  if (!caseRecord || !client) {
    return (
      <PageContainer title="Case Documents" description="Case-specific document workspace">
        <PageState status="empty" emptyTitle="Case not found" emptyDescription="This case does not exist in the current mock data.">
          <div />
        </PageState>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={`${caseRecord.title} - Documents`}
      description="Checklist-linked case document management with mock upload workflows."
      actions={
        <Link href={`/cases/${caseId}`} className="focus-ring rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-700">
          Back to Case
        </Link>
      }
    >
      <PageState
        status={status}
        onStatusChange={setStatus}
        emptyTitle="No case documents"
        emptyDescription="Use the upload panel to add mock files to this case."
        errorDescription="Unable to load case document workspace."
        skeletonVariant="table"
      >
        <div className="space-y-4">
          <MockUploadPanel caseId={caseId} onUploadComplete={handleUpload} />

          <DocumentWorkspace
            title="Case Documents"
            caseId={caseId}
            documents={documents}
            onDocumentsChange={setDocuments}
            checklistLinks={checklistLinks}
            onChecklistLinksChange={setChecklistLinks}
            rows={rows}
          />

          <CaseChecklistDocumentPanel
            caseId={caseId}
            links={checklistLinks}
            documents={documents}
            onLinksChange={setChecklistLinks}
          />

          <Card>
            <CardHeader>
              <CardTitle>Case Duplicate Groups</CardTitle>
              <CardDescription>Suspected duplicate review placeholders for this case.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {duplicateGroups.length === 0 ? (
                <p className="text-sm text-neutral-500 dark:text-neutral-400">No suspected duplicates for this case.</p>
              ) : (
                duplicateGroups.map((group) => (
                  <div key={group.id} className="rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800">
                    <p className="font-medium text-neutral-800 dark:text-neutral-200">{group.matchingFilenames.join(" vs ")}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Checksum placeholder: {group.matchingChecksumPlaceholder}</p>
                    <Button size="sm" variant="secondary" className="mt-2">{group.reviewerActionLabel}</Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </PageState>
    </PageContainer>
  );
}
