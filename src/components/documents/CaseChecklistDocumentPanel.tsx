"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { FormField, FormLabel, FormTextarea } from "@/components/ui/Form";
import { StatusChip } from "@/components/ui/StatusChip";
import type { MockChecklistDocumentLink, MockManagedDocument } from "@/lib/mock/documents";
import { documentStatusPresentation, reviewStatusPresentation } from "@/lib/utilities/status";

export interface CaseChecklistDocumentPanelProps {
  caseId: string;
  links: MockChecklistDocumentLink[];
  documents: MockManagedDocument[];
  onLinksChange: (links: MockChecklistDocumentLink[]) => void;
}

function participantLabel(scope: MockChecklistDocumentLink["participantScope"]): string {
  if (scope === "applicant") return "Applicant";
  if (scope === "spouse") return "Spouse";
  return "Children";
}

export function CaseChecklistDocumentPanel({ caseId, links, documents, onLinksChange }: CaseChecklistDocumentPanelProps) {
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});

  const documentById = useMemo(() => {
    const map = new Map<string, MockManagedDocument>();
    documents.forEach((document) => map.set(document.id, document));
    return map;
  }, [documents]);

  if (links.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Checklist Integration</CardTitle>
          <CardDescription>No checklist requirements linked for this case yet.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Checklist Integration</CardTitle>
        <CardDescription>Requirement status, linked documents, and review placeholders.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {links.map((link) => {
          const status = documentStatusPresentation[link.status];
          const review = reviewStatusPresentation[link.reviewStatus];
          const linkedDocs = link.linkedDocumentIds.map((id) => documentById.get(id)).filter(Boolean) as MockManagedDocument[];

          return (
            <div key={link.id} className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{link.requirementName}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{participantLabel(link.participantScope)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone={link.required ? "danger" : "neutral"}>{link.required ? "Required" : "Optional"}</Badge>
                  <StatusChip label={status.label} tone={status.tone} />
                  <StatusChip label={review.label} tone={review.tone} />
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Linked uploads</p>
                {linkedDocs.length === 0 ? (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">No documents linked yet.</p>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {linkedDocs.map((document) => (
                      <li key={document.id} className="flex items-center justify-between rounded-lg border border-neutral-100 px-3 py-2 dark:border-neutral-800">
                        <Link href={`/cases/${caseId}/documents/${document.id}`} className="text-brand-700 hover:underline dark:text-brand-300">
                          {document.filename}
                        </Link>
                        <StatusChip label={documentStatusPresentation[document.status].label} tone={documentStatusPresentation[document.status].tone} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary">Upload Placeholder</Button>
                <Button size="sm" variant="secondary">Re-upload Placeholder</Button>
              </div>

              <FormField className="mt-3">
                <FormLabel htmlFor={`note-${link.id}`}>Practitioner note</FormLabel>
                <FormTextarea
                  id={`note-${link.id}`}
                  value={draftNotes[link.id] ?? link.practitionerNote}
                  onChange={(event) =>
                    setDraftNotes((existing) => ({
                      ...existing,
                      [link.id]: event.target.value,
                    }))
                  }
                  className="min-h-16"
                />
              </FormField>

              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    const updated = links.map((current) =>
                      current.id === link.id
                        ? {
                            ...current,
                            practitionerNote: draftNotes[link.id] ?? current.practitionerNote,
                          }
                        : current,
                    );
                    onLinksChange(updated);
                  }}
                >
                  Save Note
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
