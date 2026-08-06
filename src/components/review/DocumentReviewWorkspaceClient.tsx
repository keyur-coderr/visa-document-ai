"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { FormInput, FormLabel, FormSelect, FormTextarea } from "@/components/ui/Form";
import { StatusChip } from "@/components/ui/StatusChip";
import { aiConfidenceBand } from "@/lib/utilities/status";
import type { CaseReviewWorkspace, DocumentReviewDetail } from "@/server/services/review-service";

interface ActionResult {
  ok: boolean;
  error?: string;
}

const categoryOptions = [
  "passport", "language_test", "wes_eca_report", "educational_degree", "educational_transcript", "employment_reference_letter", "employment_offer_letter", "pay_slip", "tax_document", "bank_statement", "police_clearance_certificate", "marriage_certificate", "birth_certificate", "resume_cv", "medical_document", "work_permit", "study_permit", "visitor_visa", "permanent_resident_card", "national_id", "unknown",
];

export function DocumentReviewWorkspaceClient({ detail, workspace, role }: { detail: DocumentReviewDetail; workspace: CaseReviewWorkspace; role: "practitioner" | "assistant" }) {
  const [activeFieldId, setActiveFieldId] = useState(detail.fields[0]?.id ?? "");
  const [draftValue, setDraftValue] = useState(detail.fields[0]?.draft?.draftValue ?? detail.fields[0]?.normalizedValue ?? "");
  const [reviewerNote, setReviewerNote] = useState(detail.fields[0]?.draft?.reviewerNote ?? "");
  const [overrideReason, setOverrideReason] = useState("");
  const [classificationReason, setClassificationReason] = useState("");
  const [classificationFinalCategory, setClassificationFinalCategory] = useState(detail.classification.finalCategory ?? detail.classification.predictedCategory);
  const [documentReuploadReason, setDocumentReuploadReason] = useState(detail.document.reuploadReason ?? "");
  const [documentInternalNote, setDocumentInternalNote] = useState(detail.document.internalReviewNote ?? "");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const activeField = useMemo(() => detail.fields.find((field) => field.id === activeFieldId) ?? detail.fields[0], [activeFieldId, detail.fields]);
  const sourceNavigation = activeField?.sourcePage ? `Page ${activeField.sourcePage}` : "No source page";

  function syncField(fieldId: string) {
    const field = detail.fields.find((item) => item.id === fieldId);
    if (!field) return;
    setActiveFieldId(field.id);
    setDraftValue(field.draft?.draftValue ?? field.normalizedValue ?? "");
    setReviewerNote(field.draft?.reviewerNote ?? "");
    setOverrideReason(field.overrideReason ?? "");
  }

  async function callApi(path: string, body: Record<string, unknown>): Promise<ActionResult> {
    setPending(true);
    setStatusMessage(null);
    try {
      const response = await fetch(path, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as ActionResult;
      if (!response.ok || !payload.ok) {
        setStatusMessage(payload.error ?? "Request failed.");
        return { ok: false, error: payload.error };
      }
      setStatusMessage("Saved.");
      return { ok: true };
    } catch {
      setStatusMessage("Request failed.");
      return { ok: false };
    } finally {
      setPending(false);
    }
  }

  async function saveDraft() {
    if (!activeField) return;
    await callApi(`/api/review/fields/${activeField.id}`, {
      caseId: detail.caseId,
      documentId: detail.document.documentId,
      mode: "draft",
      draftValue,
      reviewerNote,
      unsavedChanges: true,
    });
  }

  async function applyFieldAction(action: "approve" | "reject" | "override" | "clarification" | "restore") {
    if (!activeField) return;
    const result = await callApi(`/api/review/fields/${activeField.id}`, {
      caseId: detail.caseId,
      documentId: detail.document.documentId,
      mode: "review",
      action,
      editedValue: draftValue,
      reason: action === "override" ? overrideReason : null,
      reviewerNote,
    });

    if (result.ok) {
      window.location.reload();
    }
  }

  async function applyClassification(action: "approve" | "use_alternative" | "override") {
    const result = await callApi(`/api/review/classifications/${detail.classification.classificationId}`, {
      caseId: detail.caseId,
      documentId: detail.document.documentId,
      action,
      finalCategory: classificationFinalCategory,
      reason: action === "approve" ? null : classificationReason,
      reviewerNote,
    });
    if (result.ok) {
      window.location.reload();
    }
  }

  async function applyDocumentAction(action: "mark_reviewed" | "approve_document" | "reject_document" | "request_reupload" | "mark_ready_for_practitioner") {
    const result = await callApi(`/api/review/documents/${detail.document.documentId}`, {
      caseId: detail.caseId,
      action,
      reuploadReason: action === "request_reupload" ? documentReuploadReason : null,
      internalNote: documentInternalNote,
    });
    if (result.ok) {
      window.location.reload();
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
      <Card className="xl:col-span-3">
        <CardHeader>
          <CardTitle>Case Review</CardTitle>
          <CardDescription>{workspace.caseTitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-neutral-200 p-3 text-sm dark:border-neutral-800">
            <p className="font-medium">Checklist</p>
            <ul className="mt-2 space-y-1 text-xs">
              {workspace.checklist.map((item) => (
                <li key={item.requirementId} className="flex items-center justify-between gap-2">
                  <span>{item.requirementName}</span>
                  <StatusChip label={item.status.replaceAll("_", " ")} tone={item.status === "approved" ? "success" : item.status === "missing" ? "danger" : "warning"} />
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-neutral-200 p-3 text-sm dark:border-neutral-800">
            <p className="font-medium">Documents</p>
            <ul className="mt-2 space-y-1 text-xs">
              {workspace.documents.map((document) => (
                <li key={document.documentId}>
                  <Link className={document.documentId === detail.document.documentId ? "font-semibold text-brand-700" : "text-neutral-600 hover:underline"} href={`/cases/${detail.caseId}/review/${document.documentId}`}>{document.filename}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-neutral-200 p-3 text-xs dark:border-neutral-800">
            <p>Missing requirements: {workspace.checklist.filter((item) => item.status === "missing").length}</p>
            <p>Reviewed docs: {workspace.reviewProgress.documentsReviewed}</p>
            <p>Unresolved flags: {workspace.unresolvedFlagCount}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="xl:col-span-5">
        <CardHeader>
          <CardTitle>Source Document</CardTitle>
          <CardDescription>{detail.document.filename}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip label={detail.document.status.replaceAll("_", " ")} tone={detail.document.status === "approved" ? "success" : detail.document.status === "rejected" ? "danger" : "warning"} />
            <span className="text-xs text-neutral-500">Uploaded {new Date(detail.document.uploadedAt).toLocaleString()}</span>
            <span className="text-xs text-neutral-500">Unresolved flags: {detail.document.unresolvedFlagCount}</span>
          </div>

          <div className="rounded-lg border border-neutral-200 p-3 text-sm dark:border-neutral-800">
            <div className="mb-2 flex flex-wrap gap-2 text-xs">
              <span className="rounded border border-neutral-200 px-2 py-1">{sourceNavigation}</span>
              <span className="rounded border border-neutral-200 px-2 py-1">Zoom placeholder</span>
              <span className="rounded border border-neutral-200 px-2 py-1">Rotate placeholder</span>
              <span className="rounded border border-neutral-200 px-2 py-1">Source highlight placeholder</span>
            </div>
            {detail.document.previewUrl ? (
              detail.document.mimeType.includes("pdf") ? (
                <iframe title="Document preview" src={detail.document.previewUrl} className="h-[540px] w-full rounded border border-neutral-200" />
              ) : (
                <img src={detail.document.previewUrl} alt="Document preview" className="max-h-[540px] w-full rounded border border-neutral-200 object-contain" />
              )
            ) : (
              <div className="flex h-[420px] items-center justify-center rounded border border-dashed border-neutral-300 text-sm text-neutral-500">Preview unavailable in this mode.</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="xl:col-span-4">
        <CardHeader>
          <CardTitle>AI Review</CardTitle>
          <CardDescription>Classification and extracted fields require practitioner sign-off.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-neutral-200 p-3 text-sm dark:border-neutral-800">
            <p className="font-medium">Classification</p>
            <p className="mt-1 text-xs text-neutral-500">Predicted: {detail.classification.predictedCategory}</p>
            <StatusChip label={`${aiConfidenceBand(detail.classification.confidence).percent}% confidence`} tone={aiConfidenceBand(detail.classification.confidence).tone} className="mt-2" />
            <FormLabel className="mt-3 block" htmlFor="final-category">Final category</FormLabel>
            <FormSelect id="final-category" value={classificationFinalCategory} onChange={(event) => setClassificationFinalCategory(event.target.value)}>
              {categoryOptions.map((item) => <option key={item} value={item}>{item}</option>)}
            </FormSelect>
            <FormLabel className="mt-2 block" htmlFor="classification-reason">Reason</FormLabel>
            <FormInput id="classification-reason" value={classificationReason} onChange={(event) => setClassificationReason(event.target.value)} placeholder="Required for override/alternative" />
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" disabled={pending || role !== "practitioner"} onClick={() => applyClassification("approve")}>Approve predicted</Button>
              <Button size="sm" variant="secondary" disabled={pending || role !== "practitioner"} onClick={() => applyClassification("use_alternative")}>Use alternative</Button>
              <Button size="sm" variant="secondary" disabled={pending || role !== "practitioner"} onClick={() => applyClassification("override")}>Manual override</Button>
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 p-3 text-sm dark:border-neutral-800">
            <p className="font-medium">Extracted fields</p>
            <div className="mt-2 max-h-40 overflow-auto rounded border border-neutral-200">
              {detail.fields.map((field) => (
                <button key={field.id} onClick={() => syncField(field.id)} className={`w-full border-b px-2 py-2 text-left text-xs last:border-0 ${field.id === activeField?.id ? "bg-brand-50" : "bg-white"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span>{field.fieldKey}</span>
                    <StatusChip label={field.approvalStatus.replaceAll("_", " ")} tone={field.approvalStatus === "approved" ? "success" : field.approvalStatus === "rejected" ? "danger" : "warning"} />
                  </div>
                </button>
              ))}
            </div>

            {activeField ? (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-neutral-500">Raw: {activeField.rawValue ?? "(empty)"}</p>
                <p className="text-xs text-neutral-500">Source: {activeField.sourceText ?? "(none)"}</p>
                <FormLabel htmlFor="draft-value">Normalized value</FormLabel>
                <FormInput id="draft-value" value={draftValue} onChange={(event) => setDraftValue(event.target.value)} />
                <FormLabel htmlFor="review-note">Reviewer note</FormLabel>
                <FormTextarea id="review-note" value={reviewerNote} onChange={(event) => setReviewerNote(event.target.value)} className="min-h-16" />
                <FormLabel htmlFor="override-reason">Override reason</FormLabel>
                <FormInput id="override-reason" value={overrideReason} onChange={(event) => setOverrideReason(event.target.value)} />

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" disabled={pending} onClick={saveDraft}>Save draft</Button>
                  <Button size="sm" variant="secondary" disabled={pending || role !== "practitioner"} onClick={() => applyFieldAction("approve")}>Approve</Button>
                  <Button size="sm" variant="secondary" disabled={pending || role !== "practitioner"} onClick={() => applyFieldAction("reject")}>Reject</Button>
                  <Button size="sm" variant="secondary" disabled={pending || role !== "practitioner"} onClick={() => applyFieldAction("override")}>Override</Button>
                  <Button size="sm" variant="secondary" disabled={pending} onClick={() => applyFieldAction("clarification")}>Needs clarification</Button>
                  <Button size="sm" variant="secondary" disabled={pending} onClick={() => applyFieldAction("restore")}>Restore AI value</Button>
                </div>
                {activeField.draft?.unsavedChanges ? <p className="text-xs text-warning-700">Unsaved changes</p> : null}
              </div>
            ) : null}
          </div>

          <div className="rounded-lg border border-neutral-200 p-3 text-sm dark:border-neutral-800">
            <p className="font-medium">Document decision</p>
            <FormLabel className="mt-2 block" htmlFor="reupload-reason">Client-visible re-upload reason</FormLabel>
            <FormTextarea id="reupload-reason" value={documentReuploadReason} onChange={(event) => setDocumentReuploadReason(event.target.value)} className="min-h-16" />
            <FormLabel className="mt-2 block" htmlFor="internal-note">Internal note</FormLabel>
            <FormTextarea id="internal-note" value={documentInternalNote} onChange={(event) => setDocumentInternalNote(event.target.value)} className="min-h-16" />
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" disabled={pending} onClick={() => applyDocumentAction("mark_reviewed")}>Mark reviewed</Button>
              <Button size="sm" variant="secondary" disabled={pending || role !== "practitioner"} onClick={() => applyDocumentAction("approve_document")}>Approve document</Button>
              <Button size="sm" variant="secondary" disabled={pending || role !== "practitioner"} onClick={() => applyDocumentAction("reject_document")}>Reject document</Button>
              <Button size="sm" variant="secondary" disabled={pending || role !== "practitioner"} onClick={() => applyDocumentAction("request_reupload")}>Request re-upload</Button>
              <Button size="sm" variant="secondary" disabled={pending || role !== "assistant"} onClick={() => applyDocumentAction("mark_ready_for_practitioner")}>Ready for practitioner</Button>
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 p-3 text-xs dark:border-neutral-800">
            <p>Fields reviewed: {detail.progress.fieldsReviewed}</p>
            <p>Fields remaining: {detail.progress.fieldsRemaining}</p>
            <p>Unresolved warnings: {detail.progress.unresolvedWarnings}</p>
            <p>Pending approvals: {workspace.reviewProgress.pendingApprovals}</p>
          </div>

          {statusMessage ? <p className="text-sm text-neutral-600">{statusMessage}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
