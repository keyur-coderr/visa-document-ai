"use client";

import { useMemo, useState } from "react";
import { DocumentWorkspace } from "@/components/documents/DocumentWorkspace";
import { MockUploadPanel, type UploadResult } from "@/components/documents/MockUploadPanel";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageState, useDemoPageState } from "@/components/ui/PageState";
import {
  mockChecklistDocumentLinks,
  mockDuplicateGroups,
  mockManagedDocuments,
  mockUploadSessions,
  withExhibitLabels,
  type MockManagedDocument,
} from "@/lib/mock/documents";

export default function DocumentsPage() {
  const [status, setStatus] = useDemoPageState("ready");
  const [documents, setDocuments] = useState<MockManagedDocument[]>(mockManagedDocuments.map((item) => ({ ...item })));
  const [checklistLinks, setChecklistLinks] = useState(mockChecklistDocumentLinks.map((item) => ({ ...item })));

  const rows = useMemo(() => withExhibitLabels(documents), [documents]);

  function handleUpload(results: UploadResult[]) {
    const successful = results.filter((result) => result.state === "success");
    if (successful.length === 0) return;

    const fallback = documents[0];
    if (!fallback) return;

    setDocuments((existing) => [
      ...successful.map((result, index) => ({
        ...fallback,
        id: `doc_mock_${Date.now()}_${index}`,
        filename: result.fileName,
        sizeKb: result.sizeKb,
        status: "uploaded" as const,
        checksumPlaceholder: "sha256:mock-upload",
        uploadedAt: new Date().toISOString(),
        exhibitOrder: (existing.filter((document) => document.caseId === fallback.caseId).length || 0) + index,
      })),
      ...existing,
    ]);
  }

  return (
    <PageContainer title="Documents" description="Every document uploaded across your firm's cases.">
      <PageState
        status={status}
        onStatusChange={setStatus}
        emptyTitle="No documents yet"
        emptyDescription="Documents uploaded by clients or practitioners will appear here."
        errorDescription="We couldn't load documents. Try again in a moment."
        skeletonVariant="table"
      >
        <div className="space-y-4">
          <MockUploadPanel caseId={null} onUploadComplete={handleUpload} />

          <DocumentWorkspace
            title="Documents Workspace"
            documents={documents}
            onDocumentsChange={setDocuments}
            checklistLinks={checklistLinks}
            onChecklistLinksChange={setChecklistLinks}
            rows={rows}
          />

          <Card>
            <CardHeader>
              <CardTitle>Upload Sessions</CardTitle>
              <CardDescription>Mock upload queue/session records.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {mockUploadSessions.map((session) => (
                <div key={session.id} className="rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800">
                  <p className="font-medium text-neutral-800 dark:text-neutral-200">{session.fileName}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{session.sizeKb} KB · {session.progressPercent}% · {session.state}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Duplicate Detection Placeholder</CardTitle>
              <CardDescription>Suspected duplicate groups based on filename/checksum placeholders.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {mockDuplicateGroups.map((group) => (
                <div key={group.id} className="rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-neutral-800 dark:text-neutral-200">{group.matchingFilenames.join(" vs ")}</p>
                    <Badge tone={group.status === "suspected" ? "warning" : "neutral"}>
                      {group.status === "suspected" ? "Suspected Duplicate" : "Review Complete"}
                    </Badge>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Checksum placeholder: {group.matchingChecksumPlaceholder}</p>
                  <Button size="sm" variant="secondary" className="mt-2">{group.reviewerActionLabel}</Button>
                </div>
              ))}
            </CardContent>
          </Card>
          </div>
      </PageState>
    </PageContainer>
  );
}
