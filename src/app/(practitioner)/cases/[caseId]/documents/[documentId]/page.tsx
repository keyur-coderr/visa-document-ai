"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { FormField, FormInput, FormLabel, FormSelect, FormTextarea } from "@/components/ui/Form";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageState } from "@/components/ui/PageState";
import { StatusChip } from "@/components/ui/StatusChip";
import { getCaseById } from "@/lib/mock/case-management";
import {
  exhibitLabelFromOrder,
  getDocumentActivitiesForCase,
  getDocumentById,
  getDocumentVersions,
  getChecklistLinksForCase,
  type MockManagedDocument,
} from "@/lib/mock/documents";
import { documentStatusPresentation } from "@/lib/utilities/status";

const categoryOptions: Array<MockManagedDocument["category"]> = [
  "identity",
  "relationship",
  "financial",
  "education",
  "employment",
  "medical",
  "police",
  "forms",
  "supporting",
];

export default function DocumentDetailPage() {
  const params = useParams<{ caseId: string; documentId: string }>();
  const caseId = params.caseId;
  const documentId = params.documentId;

  const caseRecord = getCaseById(caseId);
  const baseDocument = getDocumentById(documentId);
  const [document, setDocument] = useState<MockManagedDocument | undefined>(baseDocument ? { ...baseDocument } : undefined);
  const [renameValue, setRenameValue] = useState("");
  const [newNote, setNewNote] = useState("");

  const versions = useMemo(() => getDocumentVersions(documentId), [documentId]);
  const requirementOptions = useMemo(() => getChecklistLinksForCase(caseId), [caseId]);
  const activities = useMemo(
    () => getDocumentActivitiesForCase(caseId).filter((activity) => activity.documentId === documentId),
    [caseId, documentId],
  );

  if (!caseRecord || !document || document.caseId !== caseId) {
    return (
      <PageContainer title="Document" description="Document detail workspace">
        <PageState status="empty" emptyTitle="Document not found" emptyDescription="This mock document does not exist for the selected case.">
          <div />
        </PageState>
      </PageContainer>
    );
  }

  const status = documentStatusPresentation[document.status];

  return (
    <PageContainer
      title={document.filename}
      description="Document metadata, versions, review actions, and mobile photo handling placeholders."
      actions={
        <Link href={`/cases/${caseId}/documents`} className="focus-ring rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-700">
          Back to Case Documents
        </Link>
      }
    >
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Document Metadata</CardTitle>
            <CardDescription>Core file details and linked requirement information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusChip label={status.label} tone={status.tone} />
              <Badge tone="neutral">Source: {document.participantScope}</Badge>
              <Badge tone="neutral">Exhibit {exhibitLabelFromOrder(document.exhibitOrder)}</Badge>
            </div>

            <div className="grid grid-cols-1 gap-2 text-sm text-neutral-600 dark:text-neutral-400 sm:grid-cols-2">
              <p><span className="font-medium text-neutral-700 dark:text-neutral-300">Case:</span> {document.caseTitle}</p>
              <p><span className="font-medium text-neutral-700 dark:text-neutral-300">Client:</span> {document.clientName}</p>
              <p><span className="font-medium text-neutral-700 dark:text-neutral-300">Uploaded by:</span> {document.uploadedBy}</p>
              <p><span className="font-medium text-neutral-700 dark:text-neutral-300">Uploaded date:</span> {new Date(document.uploadedAt).toLocaleString()}</p>
              <p><span className="font-medium text-neutral-700 dark:text-neutral-300">Category:</span> {document.category}</p>
              <p><span className="font-medium text-neutral-700 dark:text-neutral-300">Checklist requirement:</span> {document.requirementKey ?? "Unlinked"}</p>
              <p><span className="font-medium text-neutral-700 dark:text-neutral-300">Checksum:</span> {document.checksumPlaceholder}</p>
              <p><span className="font-medium text-neutral-700 dark:text-neutral-300">File size:</span> {document.sizeKb} KB</p>
            </div>

            <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-3 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Mock Preview Placeholder</p>
              <div className="mt-2 flex h-48 items-center justify-center rounded-lg border border-dashed border-neutral-300 text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
                Preview not rendered in mock mode
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Version History</CardTitle>
              </CardHeader>
              <CardContent>
                {versions.length === 0 ? (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">No version history yet.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {versions.map((version) => (
                      <li key={version.id} className="rounded-lg border border-neutral-100 px-3 py-2 dark:border-neutral-800">
                        <p className="font-medium text-neutral-800 dark:text-neutral-200">v{version.version} - {version.filename}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{version.uploadedBy} · {new Date(version.uploadedAt).toLocaleString()} · {version.checksumPlaceholder}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{version.note}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Review Actions</CardTitle>
              <CardDescription>Mock workflow controls only.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="secondary" onClick={() => setDocument((current) => (current ? { ...current, status: "needs_reupload" } : current))}>Mark Needs Re-upload</Button>
              <Button variant="secondary" onClick={() => setDocument((current) => (current ? { ...current, status: "approved", reviewStatus: "approved" } : current))}>Approve</Button>
              <Button variant="danger" onClick={() => setDocument((current) => (current ? { ...current, status: "rejected", reviewStatus: "rejected" } : current))}>Reject</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Document Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <FormField>
                <FormLabel htmlFor="rename">Rename</FormLabel>
                <div className="flex gap-2">
                  <FormInput id="rename" value={renameValue} onChange={(event) => setRenameValue(event.target.value)} placeholder="new_filename.pdf" />
                  <Button variant="secondary" onClick={() => {
                    if (!renameValue.trim()) return;
                    setDocument((current) => (current ? { ...current, filename: renameValue.trim() } : current));
                    setRenameValue("");
                  }}>
                    Save
                  </Button>
                </div>
              </FormField>

              <FormField>
                <FormLabel htmlFor="category">Change category</FormLabel>
                <FormSelect
                  id="category"
                  value={document.category}
                  onChange={(event) => setDocument((current) => (current ? { ...current, category: event.target.value as MockManagedDocument["category"] } : current))}
                >
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </FormSelect>
              </FormField>

              <FormField>
                <FormLabel htmlFor="requirement">Link checklist requirement</FormLabel>
                <FormSelect
                  id="requirement"
                  value={document.requirementKey ?? ""}
                  onChange={(event) => setDocument((current) => (current ? { ...current, requirementKey: event.target.value || null } : current))}
                >
                  <option value="">Unlinked</option>
                  {requirementOptions.map((option) => (
                    <option key={option.id} value={option.requirementKey}>{option.requirementName}</option>
                  ))}
                </FormSelect>
              </FormField>

              <Button variant="ghost" onClick={() => setDocument((current) => (current ? { ...current, archived: !current.archived } : current))}>
                {document.archived ? "Unarchive" : "Archive"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mobile Photo Handling</CardTitle>
              <CardDescription>Placeholder controls for camera-origin image cleanup.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm">Rotate Left</Button>
                <Button variant="secondary" size="sm">Rotate Right</Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setDocument((current) => (current ? { ...current, orientationCorrected: !current.orientationCorrected } : current))}
                >
                  Toggle Orientation Corrected
                </Button>
              </div>
              <Badge tone={document.orientationCorrected ? "success" : "neutral"}>
                {document.orientationCorrected ? "Orientation Corrected" : "Orientation Unchecked"}
              </Badge>
              <Badge tone={document.qualityWarning ? "warning" : "success"}>
                {document.qualityWarning ? "Image Quality Warning" : "Image Quality OK"}
              </Badge>
              <Badge tone={document.blurryWarning ? "warning" : "success"}>
                {document.blurryWarning ? "Blurry Photo Warning" : "No Blur Warning"}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <FormTextarea value={newNote} onChange={(event) => setNewNote(event.target.value)} placeholder="Add practitioner note" />
              <Button
                variant="secondary"
                onClick={() => {
                  if (!newNote.trim()) return;
                  setDocument((current) => (current ? { ...current, practitionerNotes: [newNote.trim(), ...current.practitionerNotes] } : current));
                  setNewNote("");
                }}
              >
                Add Note
              </Button>
              <ul className="space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
                {document.practitionerNotes.map((note, index) => (
                  <li key={`${note}-${index}`} className="rounded-lg border border-neutral-100 px-3 py-2 dark:border-neutral-800">{note}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Document Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <p className="text-sm text-neutral-500 dark:text-neutral-400">No activity records for this document.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {activities.map((activity) => (
                    <li key={activity.id} className="rounded-lg border border-neutral-100 px-3 py-2 dark:border-neutral-800">
                      <p className="font-medium text-neutral-800 dark:text-neutral-200">{activity.action}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">{activity.actor} · {new Date(activity.at).toLocaleString()}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
