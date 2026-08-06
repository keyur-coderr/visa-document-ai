import "server-only";

import { isSupabaseEnabled } from "@/lib/env/supabase";
import {
  getMockCaseMeta,
  getMockChecklistForCase,
  getMockReviewerNameById,
  getMockUnresolvedFlagCount,
  mockCaseFacts,
  mockReviewClassifications,
  mockReviewDrafts,
  mockReviewExtractionRuns,
  mockReviewFields,
  mockReviewQualityWarnings,
  type MockCategory,
  type MockReviewDraft,
} from "@/lib/mock/review";
import { mockCaseRecords, mockClients } from "@/lib/mock/case-management";
import { mockManagedDocuments } from "@/lib/mock/documents";
import { safeLog } from "@/lib/security/safe-logger";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getAuthSession } from "@/server/auth/session";
import { createSignedDocumentUrl } from "@/server/services/documents-service";

export type ProcessingStatus = "queued" | "processing" | "completed" | "failed" | "retry_pending" | "needs_review" | "cancelled";
export type ReviewStatus = "pending_review" | "approved" | "rejected" | "overridden";

export interface ReviewQueueItem {
  documentId: string;
  caseId: string;
  caseTitle: string;
  clientName: string;
  stream: string;
  filename: string;
  predictedCategory: string;
  classificationConfidence: number;
  extractionConfidence: number;
  qualityWarningCount: number;
  processingStatus: ProcessingStatus;
  assignedReviewer: string;
  uploadedAt: string;
  unresolvedFlagCount: number;
}

export interface WorkspaceChecklistItem {
  requirementId: string;
  requirementKey: string;
  requirementName: string;
  status: string;
  required: boolean;
  linkedDocumentIds: string[];
}

export interface WorkspaceDocumentSummary {
  documentId: string;
  filename: string;
  status: string;
  uploadedAt: string;
  reviewed: boolean;
  predictedCategory: string;
  qualityWarningCount: number;
}

export interface CaseReviewWorkspace {
  caseId: string;
  caseTitle: string;
  stream: string;
  clientName: string;
  checklist: WorkspaceChecklistItem[];
  documents: WorkspaceDocumentSummary[];
  unresolvedFlagCount: number;
  reviewProgress: {
    fieldsReviewed: number;
    fieldsRemaining: number;
    documentsReviewed: number;
    pendingApprovals: number;
    unresolvedWarnings: number;
    completionPercent: number;
  };
}

export interface DocumentReviewField {
  id: string;
  extractionRunId: string;
  fieldKey: string;
  rawValue: string | null;
  normalizedValue: string | null;
  confidence: number;
  sourceText: string | null;
  sourcePage: number | null;
  sourceCoordinates: Record<string, unknown> | null;
  approvalStatus: ReviewStatus;
  approvedValue: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  clarificationRequired: boolean;
  overrideReason: string | null;
  draft: {
    draftValue: string | null;
    reviewerNote: string | null;
    unsavedChanges: boolean;
  } | null;
}

export interface DocumentReviewDetail {
  caseId: string;
  caseTitle: string;
  clientName: string;
  stream: string;
  document: {
    documentId: string;
    filename: string;
    status: string;
    uploadedAt: string;
    mimeType: string;
    previewUrl: string | null;
    reviewedBy: string | null;
    reviewedAt: string | null;
    internalReviewNote: string | null;
    reuploadReason: string | null;
    unresolvedFlagCount: number;
  };
  classification: {
    classificationId: string;
    predictedCategory: string;
    finalCategory: string | null;
    confidence: number;
    alternatives: Array<{ category: string; confidence: number }>;
    reviewStatus: ReviewStatus;
    overrideReason: string | null;
    reviewNote: string | null;
    provider: string;
    model: string;
    schemaVersion: number;
    promptVersion: number;
  };
  extraction: {
    extractionRunId: string;
    confidence: number;
    provider: string;
    model: string;
    schemaVersion: number;
    promptVersion: number;
    extractionVersion: number;
  };
  qualityWarnings: Array<{ id: string; issueKey: string; severity: string; confidence: number; status: ReviewStatus }>;
  fields: DocumentReviewField[];
  progress: {
    fieldsReviewed: number;
    fieldsRemaining: number;
    unresolvedWarnings: number;
  };
}

function assertCanAccessReview(role: string | null): void {
  if (role !== "practitioner" && role !== "assistant") {
    throw new Error("forbidden");
  }
}

function mapMockQueue(): ReviewQueueItem[] {
  return mockManagedDocuments.map((document) => {
    const caseRecord = mockCaseRecords.find((item) => item.id === document.caseId);
    const client = mockClients.find((item) => item.id === document.clientId);
    const classification = mockReviewClassifications.find((item) => item.documentId === document.id);
    const extraction = mockReviewExtractionRuns.find((item) => item.documentId === document.id);
    const warningCount = mockReviewQualityWarnings.filter((item) => item.documentId === document.id && item.status === "pending_review").length;

    return {
      documentId: document.id,
      caseId: document.caseId,
      caseTitle: caseRecord?.title ?? document.caseTitle,
      clientName: client?.legalName ?? document.clientName,
      stream: caseRecord?.streamLabel ?? "Unknown Stream",
      filename: document.filename,
      predictedCategory: classification?.predictedCategory ?? "unknown",
      classificationConfidence: classification?.confidence ?? 0,
      extractionConfidence: extraction?.confidence ?? 0,
      qualityWarningCount: warningCount,
      processingStatus: document.status === "processing" ? "processing" : document.reviewStatus === "pending_review" ? "needs_review" : "completed",
      assignedReviewer: getMockReviewerNameById(caseRecord?.assignedPractitionerId),
      uploadedAt: document.uploadedAt,
      unresolvedFlagCount: getMockUnresolvedFlagCount(document.caseId),
    };
  });
}

function computeCompletionPercent(reviewed: number, total: number): number {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((reviewed / total) * 100)));
}

function getMockFieldDraft(fieldId: string, reviewerId: string): MockReviewDraft | null {
  return mockReviewDrafts.find((item) => item.fieldId === fieldId && item.reviewerId === reviewerId) ?? null;
}

export async function listReviewQueue(): Promise<ReviewQueueItem[]> {
  const session = await getAuthSession();
  assertCanAccessReview(session.role);

  if (!isSupabaseEnabled()) {
    return mapMockQueue();
  }

  const client = getSupabaseServerClient();
  if (!client) return [];

  const { data: documents, error: documentsError } = await client
    .from("documents")
    .select("id, case_id, normalized_filename, document_status, uploaded_at, reviewed_by, reviewed_at, cases(id, title, stream_key, assigned_practitioner_id, client_id)")
    .order("uploaded_at", { ascending: false })
    .limit(300);

  if (documentsError) {
    safeLog("review_queue_documents_failed", { code: documentsError.code ?? "unknown" });
    return [];
  }

  const caseIds = Array.from(new Set((documents ?? []).map((item: any) => item.case_id)));
  const documentIds = Array.from(new Set((documents ?? []).map((item: any) => item.id)));
  const clientIds = Array.from(new Set((documents ?? []).map((item: any) => item.cases?.client_id).filter(Boolean)));

  const [{ data: clients }, { data: classifications }, { data: extractionRuns }, { data: qualityWarnings }, { data: processingJobs }, { data: flags }, { data: practitioners }] = await Promise.all([
    client.from("clients").select("id, legal_name").in("id", clientIds),
    client
      .from("document_classification_results")
      .select("id, document_id, predicted_category, confidence, is_latest")
      .in("document_id", documentIds)
      .eq("is_latest", true),
    client
      .from("document_extraction_runs")
      .select("id, document_id, confidence, created_at")
      .in("document_id", documentIds)
      .order("created_at", { ascending: false }),
    client
      .from("document_quality_checks")
      .select("id, document_id, status")
      .in("document_id", documentIds),
    client
      .from("processing_jobs")
      .select("id, document_id, status, created_at")
      .in("document_id", documentIds)
      .order("created_at", { ascending: false }),
    client
      .from("case_flags")
      .select("id, case_id, status")
      .in("case_id", caseIds),
    client
      .from("profiles")
      .select("id, full_name")
      .in("id", Array.from(new Set((documents ?? []).map((item: any) => item.cases?.assigned_practitioner_id).filter(Boolean)))),
  ]);

  const clientById = new Map((clients ?? []).map((item: any) => [item.id, item.legal_name]));
  const classificationByDocumentId = new Map((classifications ?? []).map((item: any) => [item.document_id, item]));
  const extractionByDocumentId = new Map<string, any>();
  for (const run of extractionRuns ?? []) {
    if (!extractionByDocumentId.has((run as any).document_id)) {
      extractionByDocumentId.set((run as any).document_id, run);
    }
  }
  const qualityCountByDocumentId = new Map<string, number>();
  for (const warning of qualityWarnings ?? []) {
    const row = warning as any;
    if (row.status !== "pending_review") continue;
    qualityCountByDocumentId.set(row.document_id, (qualityCountByDocumentId.get(row.document_id) ?? 0) + 1);
  }
  const latestProcessingByDocumentId = new Map<string, any>();
  for (const job of processingJobs ?? []) {
    const row = job as any;
    if (!latestProcessingByDocumentId.has(row.document_id)) latestProcessingByDocumentId.set(row.document_id, row);
  }
  const unresolvedFlagsByCaseId = new Map<string, number>();
  for (const flag of flags ?? []) {
    const row = flag as any;
    if (row.status !== "open" && row.status !== "in_progress") continue;
    unresolvedFlagsByCaseId.set(row.case_id, (unresolvedFlagsByCaseId.get(row.case_id) ?? 0) + 1);
  }
  const practitionerById = new Map((practitioners ?? []).map((item: any) => [item.id, item.full_name]));

  return (documents ?? []).map((row: any) => {
    const classification = classificationByDocumentId.get(row.id);
    const extraction = extractionByDocumentId.get(row.id);
    const processing = latestProcessingByDocumentId.get(row.id);
    return {
      documentId: row.id,
      caseId: row.case_id,
      caseTitle: row.cases?.title ?? "Case",
      clientName: clientById.get(row.cases?.client_id) ?? "Client",
      stream: row.cases?.stream_key ?? "stream",
      filename: row.normalized_filename,
      predictedCategory: classification?.predicted_category ?? "unknown",
      classificationConfidence: classification?.confidence ?? 0,
      extractionConfidence: extraction?.confidence ?? 0,
      qualityWarningCount: qualityCountByDocumentId.get(row.id) ?? 0,
      processingStatus: processing?.status ?? "queued",
      assignedReviewer: practitionerById.get(row.cases?.assigned_practitioner_id) ?? "Unassigned",
      uploadedAt: row.uploaded_at,
      unresolvedFlagCount: unresolvedFlagsByCaseId.get(row.case_id) ?? 0,
    };
  });
}

export async function getCaseReviewWorkspace(caseId: string): Promise<CaseReviewWorkspace | null> {
  const session = await getAuthSession();
  assertCanAccessReview(session.role);

  if (!isSupabaseEnabled()) {
    const meta = getMockCaseMeta(caseId);
    if (!meta) return null;
    const checklist = getMockChecklistForCase(caseId).map((item) => ({
      requirementId: item.id,
      requirementKey: item.requirementKey,
      requirementName: item.requirementName,
      status: item.status,
      required: item.required,
      linkedDocumentIds: item.linkedDocumentIds,
    }));
    const documents = mapMockQueue().filter((item) => item.caseId === caseId).map((item) => ({
      documentId: item.documentId,
      filename: item.filename,
      status: item.processingStatus,
      uploadedAt: item.uploadedAt,
      reviewed: item.processingStatus === "completed",
      predictedCategory: item.predictedCategory,
      qualityWarningCount: item.qualityWarningCount,
    }));
    const fields = mockReviewFields.filter((item) => item.caseId === caseId);
    const fieldsReviewed = fields.filter((item) => item.approvalStatus !== "pending_review").length;
    const unresolvedWarnings = mockReviewQualityWarnings.filter((item) => item.caseId === caseId && item.status === "pending_review").length;
    const pendingApprovals = fields.filter((item) => item.approvalStatus === "pending_review").length;

    return {
      caseId,
      caseTitle: meta.caseTitle,
      stream: meta.streamLabel,
      clientName: meta.clientName,
      checklist,
      documents,
      unresolvedFlagCount: getMockUnresolvedFlagCount(caseId),
      reviewProgress: {
        fieldsReviewed,
        fieldsRemaining: Math.max(fields.length - fieldsReviewed, 0),
        documentsReviewed: documents.filter((item) => item.reviewed).length,
        pendingApprovals,
        unresolvedWarnings,
        completionPercent: computeCompletionPercent(fieldsReviewed, fields.length),
      },
    };
  }

  const client = getSupabaseServerClient();
  if (!client) return null;

  const { data: caseRecord } = await client
    .from("cases")
    .select("id, title, stream_key, client_id")
    .eq("id", caseId)
    .maybeSingle();
  if (!caseRecord) return null;

  const [{ data: clientRecord }, { data: requirements }, { data: docs }, { data: latestClassifications }, { data: fields }, { data: warnings }, { data: flags }] = await Promise.all([
    client.from("clients").select("id, legal_name").eq("id", (caseRecord as any).client_id).maybeSingle(),
    client.from("document_requirements").select("id, requirement_key, label, status, required").eq("case_id", caseId).order("sort_order", { ascending: true }),
    client.from("documents").select("id, normalized_filename, document_status, uploaded_at").eq("case_id", caseId).order("uploaded_at", { ascending: false }),
    client.from("document_classification_results").select("document_id, predicted_category, is_latest").eq("case_id", caseId).eq("is_latest", true),
    client.from("document_extracted_fields").select("id, approval_status").eq("case_id", caseId),
    client.from("document_quality_checks").select("id, status").eq("case_id", caseId),
    client.from("case_flags").select("id, status").eq("case_id", caseId),
  ]);

  const byDocumentCategory = new Map((latestClassifications ?? []).map((row: any) => [row.document_id, row.predicted_category]));
  const warningByDocument = new Map<string, number>();
  for (const row of warnings ?? []) {
    const warning = row as any;
    if (warning.status !== "pending_review") continue;
    warningByDocument.set(warning.document_id, (warningByDocument.get(warning.document_id) ?? 0) + 1);
  }

  const reviewedFieldCount = (fields ?? []).filter((item: any) => item.approval_status !== "pending_review").length;
  const totalFields = (fields ?? []).length;
  const unresolvedWarnings = (warnings ?? []).filter((item: any) => item.status === "pending_review").length;
  const unresolvedFlags = (flags ?? []).filter((item: any) => item.status === "open" || item.status === "in_progress").length;

  return {
    caseId,
    caseTitle: (caseRecord as any).title,
    stream: (caseRecord as any).stream_key,
    clientName: (clientRecord as any)?.legal_name ?? "Client",
    checklist: (requirements ?? []).map((item: any) => ({
      requirementId: item.id,
      requirementKey: item.requirement_key,
      requirementName: item.label,
      status: item.status,
      required: item.required,
      linkedDocumentIds: [],
    })),
    documents: (docs ?? []).map((item: any) => ({
      documentId: item.id,
      filename: item.normalized_filename,
      status: item.document_status,
      uploadedAt: item.uploaded_at,
      reviewed: item.document_status === "approved" || item.document_status === "rejected",
      predictedCategory: byDocumentCategory.get(item.id) ?? "unknown",
      qualityWarningCount: warningByDocument.get(item.id) ?? 0,
    })),
    unresolvedFlagCount: unresolvedFlags,
    reviewProgress: {
      fieldsReviewed: reviewedFieldCount,
      fieldsRemaining: Math.max(totalFields - reviewedFieldCount, 0),
      documentsReviewed: (docs ?? []).filter((item: any) => item.document_status === "approved" || item.document_status === "rejected").length,
      pendingApprovals: (fields ?? []).filter((item: any) => item.approval_status === "pending_review").length,
      unresolvedWarnings,
      completionPercent: computeCompletionPercent(reviewedFieldCount, totalFields),
    },
  };
}

export async function getDocumentReviewDetail(caseId: string, documentId: string): Promise<DocumentReviewDetail | null> {
  const session = await getAuthSession();
  assertCanAccessReview(session.role);

  if (!isSupabaseEnabled()) {
    const meta = getMockCaseMeta(caseId);
    const document = mockManagedDocuments.find((item) => item.id === documentId && item.caseId === caseId);
    const classification = mockReviewClassifications.find((item) => item.documentId === documentId);
    const extraction = mockReviewExtractionRuns.find((item) => item.documentId === documentId);
    if (!meta || !document || !classification || !extraction) return null;

    const fields = mockReviewFields.filter((item) => item.documentId === documentId).map((item) => {
      const draft = getMockFieldDraft(item.id, session.userId ?? "mock-user");
      return {
        id: item.id,
        extractionRunId: item.extractionRunId,
        fieldKey: item.fieldKey,
        rawValue: item.rawValue,
        normalizedValue: item.normalizedValue,
        confidence: item.confidence,
        sourceText: item.sourceText,
        sourcePage: item.sourcePage,
        sourceCoordinates: item.sourceCoordinates,
        approvalStatus: item.approvalStatus,
        approvedValue: item.approvedValue,
        approvedBy: item.approvedBy,
        approvedAt: item.approvedAt,
        clarificationRequired: item.clarificationRequired,
        overrideReason: item.overrideReason,
        draft: draft
          ? {
              draftValue: draft.draftValue,
              reviewerNote: draft.reviewerNote,
              unsavedChanges: draft.unsavedChanges,
            }
          : null,
      };
    });

    const pendingWarnings = mockReviewQualityWarnings.filter((item) => item.documentId === documentId);
    const reviewedCount = fields.filter((item) => item.approvalStatus !== "pending_review").length;

    return {
      caseId,
      caseTitle: meta.caseTitle,
      clientName: meta.clientName,
      stream: meta.streamLabel,
      document: {
        documentId,
        filename: document.filename,
        status: document.status,
        uploadedAt: document.uploadedAt,
        mimeType: document.filename.endsWith(".pdf") ? "application/pdf" : "image/jpeg",
        previewUrl: `/mock-download/${documentId}`,
        reviewedBy: null,
        reviewedAt: null,
        internalReviewNote: document.practitionerNotes[0] ?? null,
        reuploadReason: document.status === "needs_reupload" ? document.practitionerNotes[0] ?? null : null,
        unresolvedFlagCount: getMockUnresolvedFlagCount(caseId),
      },
      classification: {
        classificationId: classification.id,
        predictedCategory: classification.predictedCategory,
        finalCategory: classification.finalCategory,
        confidence: classification.confidence,
        alternatives: classification.alternatives,
        reviewStatus: classification.reviewStatus,
        overrideReason: classification.overrideReason,
        reviewNote: classification.reviewNote,
        provider: classification.provider,
        model: classification.model,
        schemaVersion: classification.schemaVersion,
        promptVersion: classification.promptVersion,
      },
      extraction: {
        extractionRunId: extraction.id,
        confidence: extraction.confidence,
        provider: extraction.provider,
        model: extraction.model,
        schemaVersion: extraction.schemaVersion,
        promptVersion: extraction.promptVersion,
        extractionVersion: extraction.extractionVersion,
      },
      qualityWarnings: pendingWarnings.map((warning) => ({
        id: warning.id,
        issueKey: warning.issueKey,
        severity: warning.severity,
        confidence: warning.confidence,
        status: warning.status,
      })),
      fields,
      progress: {
        fieldsReviewed: reviewedCount,
        fieldsRemaining: Math.max(fields.length - reviewedCount, 0),
        unresolvedWarnings: pendingWarnings.filter((item) => item.status === "pending_review").length,
      },
    };
  }

  const client = getSupabaseServerClient();
  if (!client) return null;

  const { data: document } = await client
    .from("documents")
    .select("id, case_id, normalized_filename, document_status, uploaded_at, mime_type, reviewed_by, reviewed_at, internal_review_note, reupload_reason, cases(id, title, stream_key, client_id)")
    .eq("id", documentId)
    .eq("case_id", caseId)
    .maybeSingle();
  if (!document) return null;

  const [{ data: clientRecord }, { data: classification }, { data: extractionRun }, { data: fields }, { data: warnings }, { data: drafts }, { data: flags }] = await Promise.all([
    client.from("clients").select("id, legal_name").eq("id", (document as any).cases.client_id).maybeSingle(),
    client.from("document_classification_results").select("id, predicted_category, final_category, confidence, alternatives, review_status, override_reason, review_note, provider, model, schema_version, prompt_version").eq("document_id", documentId).eq("is_latest", true).maybeSingle(),
    client.from("document_extraction_runs").select("id, confidence, provider, model, schema_version, prompt_version, created_at").eq("document_id", documentId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    client.from("document_extracted_fields").select("id, extraction_run_id, field_key, raw_value, normalized_value, confidence, source_text, source_page, source_coordinates, approval_status, approved_value, approved_by, approved_at, clarification_required, override_reason").eq("document_id", documentId).order("created_at", { ascending: true }),
    client.from("document_quality_checks").select("id, issue_key, severity, confidence, status").eq("document_id", documentId),
    client.from("document_field_review_drafts").select("field_id, draft_value, reviewer_note, unsaved_changes").eq("document_id", documentId).eq("reviewer_id", session.userId ?? ""),
    client.from("case_flags").select("id, status").eq("case_id", caseId),
  ]);

  const draftsByField = new Map((drafts ?? []).map((item: any) => [item.field_id, item]));
  const extractionVersion = extractionRun ? Math.max(1, new Date((extractionRun as any).created_at).getTime()) : 1;
  const previewUrl = await createSignedDocumentUrl(documentId, 120);

  const normalizedFields: DocumentReviewField[] = (fields ?? []).map((item: any) => {
    const draft = draftsByField.get(item.id);
    return {
      id: item.id,
      extractionRunId: item.extraction_run_id,
      fieldKey: item.field_key,
      rawValue: item.raw_value,
      normalizedValue: item.normalized_value,
      confidence: item.confidence,
      sourceText: item.source_text,
      sourcePage: item.source_page,
      sourceCoordinates: item.source_coordinates,
      approvalStatus: item.approval_status,
      approvedValue: item.approved_value,
      approvedBy: item.approved_by,
      approvedAt: item.approved_at,
      clarificationRequired: item.clarification_required,
      overrideReason: item.override_reason,
      draft: draft
        ? {
            draftValue: draft.draft_value,
            reviewerNote: draft.reviewer_note,
            unsavedChanges: draft.unsaved_changes,
          }
        : null,
    };
  });

  const fieldsReviewed = normalizedFields.filter((item) => item.approvalStatus !== "pending_review").length;
  const unresolvedWarnings = (warnings ?? []).filter((item: any) => item.status === "pending_review").length;

  return {
    caseId,
    caseTitle: (document as any).cases.title,
    clientName: (clientRecord as any)?.legal_name ?? "Client",
    stream: (document as any).cases.stream_key,
    document: {
      documentId,
      filename: (document as any).normalized_filename,
      status: (document as any).document_status,
      uploadedAt: (document as any).uploaded_at,
      mimeType: (document as any).mime_type,
      previewUrl,
      reviewedBy: (document as any).reviewed_by,
      reviewedAt: (document as any).reviewed_at,
      internalReviewNote: (document as any).internal_review_note,
      reuploadReason: (document as any).reupload_reason,
      unresolvedFlagCount: (flags ?? []).filter((item: any) => item.status === "open" || item.status === "in_progress").length,
    },
    classification: {
      classificationId: (classification as any)?.id ?? `classification-${documentId}`,
      predictedCategory: (classification as any)?.predicted_category ?? "unknown",
      finalCategory: (classification as any)?.final_category ?? null,
      confidence: (classification as any)?.confidence ?? 0,
      alternatives: (classification as any)?.alternatives ?? [],
      reviewStatus: (classification as any)?.review_status ?? "pending_review",
      overrideReason: (classification as any)?.override_reason ?? null,
      reviewNote: (classification as any)?.review_note ?? null,
      provider: (classification as any)?.provider ?? "unknown",
      model: (classification as any)?.model ?? "unknown",
      schemaVersion: (classification as any)?.schema_version ?? 1,
      promptVersion: (classification as any)?.prompt_version ?? 1,
    },
    extraction: {
      extractionRunId: (extractionRun as any)?.id ?? `run-${documentId}`,
      confidence: (extractionRun as any)?.confidence ?? 0,
      provider: (extractionRun as any)?.provider ?? "unknown",
      model: (extractionRun as any)?.model ?? "unknown",
      schemaVersion: (extractionRun as any)?.schema_version ?? 1,
      promptVersion: (extractionRun as any)?.prompt_version ?? 1,
      extractionVersion,
    },
    qualityWarnings: (warnings ?? []).map((item: any) => ({ id: item.id, issueKey: item.issue_key, severity: item.severity, confidence: item.confidence, status: item.status })),
    fields: normalizedFields,
    progress: {
      fieldsReviewed,
      fieldsRemaining: Math.max(normalizedFields.length - fieldsReviewed, 0),
      unresolvedWarnings,
    },
  };
}

export async function saveFieldReviewDraft(input: {
  caseId: string;
  documentId: string;
  fieldId: string;
  draftValue: string | null;
  reviewerNote: string | null;
  unsavedChanges: boolean;
}) {
  const session = await getAuthSession();
  assertCanAccessReview(session.role);

  if (!isSupabaseEnabled()) {
    const key = `${input.fieldId}:${session.userId ?? "mock-user"}`;
    const existingIndex = mockReviewDrafts.findIndex((item) => `${item.fieldId}:${item.reviewerId}` === key);
    const row = {
      fieldId: input.fieldId,
      reviewerId: session.userId ?? "mock-user",
      draftValue: input.draftValue,
      reviewerNote: input.reviewerNote,
      unsavedChanges: input.unsavedChanges,
      updatedAt: new Date().toISOString(),
    };
    if (existingIndex >= 0) mockReviewDrafts[existingIndex] = row;
    else mockReviewDrafts.push(row);
    return { ok: true };
  }

  const client = getSupabaseServerClient();
  if (!client || !session.userId) return { ok: false };
  const { data: field } = await client
    .from("document_extracted_fields")
    .select("id, firm_id, case_id, document_id")
    .eq("id", input.fieldId)
    .maybeSingle();
  if (!field) return { ok: false };

  await client.from("document_field_review_drafts").upsert(
    {
      field_id: input.fieldId,
      reviewer_id: session.userId,
      firm_id: (field as any).firm_id,
      case_id: (field as any).case_id,
      document_id: (field as any).document_id,
      draft_value: input.draftValue,
      reviewer_note: input.reviewerNote,
      unsaved_changes: input.unsavedChanges,
    },
    { onConflict: "field_id,reviewer_id" },
  );

  return { ok: true };
}

export async function reviewExtractionField(input: {
  caseId: string;
  documentId: string;
  fieldId: string;
  action: "approve" | "reject" | "override" | "clarification" | "restore";
  editedValue?: string | null;
  reason?: string | null;
  reviewerNote?: string | null;
}) {
  const session = await getAuthSession();
  assertCanAccessReview(session.role);

  const isFinalAction = input.action === "approve" || input.action === "reject" || input.action === "override";
  if (isFinalAction && session.role !== "practitioner") {
    return { ok: false, error: "Only practitioners can finalize field approvals." };
  }

  if (!isSupabaseEnabled()) {
    const field = mockReviewFields.find((item) => item.id === input.fieldId && item.documentId === input.documentId && item.caseId === input.caseId);
    const extractionRun = mockReviewExtractionRuns.find((item) => item.id === field?.extractionRunId);
    if (!field || !extractionRun) return { ok: false, error: "Field not found." };

    const beforeValue = field.normalizedValue;
    if (input.action === "clarification") {
      field.clarificationRequired = true;
      field.approvalStatus = "pending_review";
    } else if (input.action === "restore") {
      field.normalizedValue = field.rawValue;
      field.clarificationRequired = false;
      field.approvalStatus = "pending_review";
    } else if (input.action === "reject") {
      field.approvalStatus = "rejected";
      field.approvedBy = session.userId;
      field.approvedAt = new Date().toISOString();
    } else if (input.action === "approve") {
      field.approvalStatus = "approved";
      field.approvedValue = input.editedValue ?? field.normalizedValue;
      field.approvedBy = session.userId;
      field.approvedAt = new Date().toISOString();
      const existing = mockCaseFacts.find((item) => item.caseId === input.caseId && item.documentId === input.documentId && item.fieldKey === field.fieldKey);
      if (existing) {
        existing.approvedValue = field.approvedValue ?? "";
        existing.originalAiValue = field.rawValue;
        existing.approvedAt = new Date().toISOString();
        existing.approvedBy = session.userId ?? "u_priya";
      } else {
        mockCaseFacts.push({
          id: `fact-${field.id}`,
          caseId: input.caseId,
          documentId: input.documentId,
          fieldKey: field.fieldKey,
          originalAiValue: field.rawValue,
          approvedValue: field.approvedValue ?? "",
          extractionVersion: extractionRun.extractionVersion,
          approvedBy: session.userId ?? "u_priya",
          approvedAt: new Date().toISOString(),
        });
      }
    } else if (input.action === "override") {
      if (!input.reason?.trim()) return { ok: false, error: "Override reason is required." };
      field.approvalStatus = "overridden";
      field.approvedValue = input.editedValue ?? field.normalizedValue;
      field.overrideReason = input.reason.trim();
      field.approvedBy = session.userId;
      field.approvedAt = new Date().toISOString();
      const existing = mockCaseFacts.find((item) => item.caseId === input.caseId && item.documentId === input.documentId && item.fieldKey === field.fieldKey);
      if (existing) {
        existing.approvedValue = field.approvedValue ?? "";
        existing.originalAiValue = field.rawValue;
        existing.approvedAt = new Date().toISOString();
        existing.approvedBy = session.userId ?? "u_priya";
      } else {
        mockCaseFacts.push({
          id: `fact-${field.id}`,
          caseId: input.caseId,
          documentId: input.documentId,
          fieldKey: field.fieldKey,
          originalAiValue: field.rawValue,
          approvedValue: field.approvedValue ?? "",
          extractionVersion: extractionRun.extractionVersion,
          approvedBy: session.userId ?? "u_priya",
          approvedAt: new Date().toISOString(),
        });
      }
    }

    const draft = mockReviewDrafts.find((item) => item.fieldId === field.id && item.reviewerId === (session.userId ?? "mock-user"));
    if (draft) draft.unsavedChanges = false;

    safeLog("mock_field_review_action", {
      caseId: input.caseId,
      documentId: input.documentId,
      fieldId: input.fieldId,
      action: input.action,
      beforeValue: beforeValue ? "set" : "empty",
      afterValue: field.approvedValue ? "set" : "empty",
    });

    return { ok: true };
  }

  const client = getSupabaseServerClient();
  if (!client || !session.userId) return { ok: false, error: "Review service unavailable." };

  const { data: field } = await client
    .from("document_extracted_fields")
    .select("id, firm_id, case_id, document_id, extraction_run_id, field_key, raw_value, normalized_value, approval_status")
    .eq("id", input.fieldId)
    .eq("case_id", input.caseId)
    .eq("document_id", input.documentId)
    .maybeSingle();
  if (!field) return { ok: false, error: "Field not found." };

  const { data: extractionRun } = await client
    .from("document_extraction_runs")
    .select("id, provider, model, schema_version, prompt_version, created_at")
    .eq("id", (field as any).extraction_run_id)
    .maybeSingle();

  const now = new Date().toISOString();
  let approvalStatus: ReviewStatus = (field as any).approval_status;
  let approvedValue: string | null = (field as any).normalized_value;
  let clarificationRequired = false;

  if (input.action === "approve") {
    approvalStatus = "approved";
    approvedValue = input.editedValue ?? (field as any).normalized_value;
  } else if (input.action === "reject") {
    approvalStatus = "rejected";
    approvedValue = null;
  } else if (input.action === "override") {
    if (!input.reason?.trim()) return { ok: false, error: "Override reason is required." };
    approvalStatus = "overridden";
    approvedValue = input.editedValue ?? (field as any).normalized_value;
  } else if (input.action === "clarification") {
    approvalStatus = "pending_review";
    clarificationRequired = true;
  } else if (input.action === "restore") {
    approvalStatus = "pending_review";
    approvedValue = (field as any).raw_value;
  }

  const { error: fieldUpdateError } = await client
    .from("document_extracted_fields")
    .update({
      approval_status: approvalStatus,
      approved_value: approvalStatus === "pending_review" ? null : approvedValue,
      approved_by: approvalStatus === "pending_review" ? null : session.userId,
      approved_at: approvalStatus === "pending_review" ? null : now,
      clarification_required: clarificationRequired,
      override_reason: input.action === "override" ? input.reason ?? null : null,
    })
    .eq("id", input.fieldId);

  if (fieldUpdateError) {
    return { ok: false, error: "Unable to update field review state." };
  }

  if (approvalStatus === "approved" || approvalStatus === "overridden") {
    await client.from("case_facts").upsert(
      {
        firm_id: (field as any).firm_id,
        case_id: input.caseId,
        document_id: input.documentId,
        extracted_field_id: input.fieldId,
        extraction_run_id: (field as any).extraction_run_id,
        field_key: (field as any).field_key,
        original_ai_value: (field as any).raw_value,
        approved_value: approvedValue,
        provider: (extractionRun as any)?.provider ?? null,
        model: (extractionRun as any)?.model ?? null,
        schema_version: (extractionRun as any)?.schema_version ?? null,
        prompt_version: (extractionRun as any)?.prompt_version ?? null,
        extraction_version: (extractionRun as any)?.created_at ? new Date((extractionRun as any).created_at).getTime() : null,
        approved_by: session.userId,
        approved_at: now,
      },
      { onConflict: "case_id,document_id,field_key" },
    );

    await client.from("approvals").insert({
      firm_id: (field as any).firm_id,
      case_id: input.caseId,
      entity_type: "extracted_field",
      entity_id: input.fieldId,
      action: approvalStatus === "approved" ? "approve" : "override",
      approved_by: session.userId,
      notes: input.reviewerNote ?? input.reason ?? null,
    });
  }

  await client.from("audit_events").insert({
    firm_id: (field as any).firm_id,
    case_id: input.caseId,
    actor_id: session.userId,
    actor_role: session.role,
    action: `field_review_${input.action}`,
    entity_type: "extracted_field",
    entity_id: input.fieldId,
    metadata: {
      originalAiValuePresent: Boolean((field as any).raw_value),
      editedValuePresent: Boolean(approvedValue),
      extractionRunId: (field as any).extraction_run_id,
      model: (extractionRun as any)?.model ?? null,
      schemaVersion: (extractionRun as any)?.schema_version ?? null,
      promptVersion: (extractionRun as any)?.prompt_version ?? null,
      reason: input.reason ?? null,
    },
  });

  await client
    .from("document_field_review_drafts")
    .delete()
    .eq("field_id", input.fieldId)
    .eq("reviewer_id", session.userId);

  return { ok: true };
}

export async function reviewClassification(input: {
  caseId: string;
  documentId: string;
  classificationId: string;
  action: "approve" | "use_alternative" | "override";
  finalCategory?: string | null;
  reason?: string | null;
  reviewerNote?: string | null;
}) {
  const session = await getAuthSession();
  assertCanAccessReview(session.role);

  if (session.role !== "practitioner") {
    return { ok: false, error: "Only practitioners can finalize document classification." };
  }

  if (input.action !== "approve" && !input.finalCategory) {
    return { ok: false, error: "A final category is required." };
  }

  if ((input.action === "override" || input.action === "use_alternative") && !input.reason?.trim()) {
    return { ok: false, error: "A reason is required for classification overrides." };
  }

  if (!isSupabaseEnabled()) {
    const row = mockReviewClassifications.find((item) => item.id === input.classificationId && item.documentId === input.documentId);
    if (!row) return { ok: false, error: "Classification not found." };
    row.finalCategory = input.action === "approve" ? row.predictedCategory : (input.finalCategory as MockCategory);
    row.reviewStatus = input.action === "approve" ? "approved" : "overridden";
    row.reviewedBy = session.userId;
    row.reviewedAt = new Date().toISOString();
    row.overrideReason = input.reason ?? null;
    row.reviewNote = input.reviewerNote ?? null;
    return { ok: true };
  }

  const client = getSupabaseServerClient();
  if (!client || !session.userId) return { ok: false, error: "Review service unavailable." };

  const { data: row } = await client
    .from("document_classification_results")
    .select("id, firm_id, predicted_category, provider, model, schema_version, prompt_version")
    .eq("id", input.classificationId)
    .eq("document_id", input.documentId)
    .maybeSingle();
  if (!row) return { ok: false, error: "Classification not found." };

  const finalCategory = input.action === "approve" ? (row as any).predicted_category : input.finalCategory;
  const reviewStatus = input.action === "approve" ? "approved" : "overridden";

  await client
    .from("document_classification_results")
    .update({
      final_category: finalCategory,
      review_status: reviewStatus,
      reviewed_by: session.userId,
      reviewed_at: new Date().toISOString(),
      override_reason: input.reason ?? null,
      review_note: input.reviewerNote ?? null,
    })
    .eq("id", input.classificationId);

  await client.from("approvals").insert({
    firm_id: (row as any).firm_id,
    case_id: input.caseId,
    entity_type: "classification_result",
    entity_id: input.classificationId,
    action: input.action === "approve" ? "approve" : "override",
    approved_by: session.userId,
    notes: input.reviewerNote ?? input.reason ?? null,
  });

  await client.from("audit_events").insert({
    firm_id: (row as any).firm_id,
    case_id: input.caseId,
    actor_id: session.userId,
    actor_role: session.role,
    action: `classification_review_${input.action}`,
    entity_type: "classification_result",
    entity_id: input.classificationId,
    metadata: {
      priorCategory: (row as any).predicted_category,
      finalCategory,
      reason: input.reason ?? null,
      model: (row as any).model,
      schemaVersion: (row as any).schema_version,
      promptVersion: (row as any).prompt_version,
    },
  });

  return { ok: true };
}

export async function reviewDocumentAction(input: {
  caseId: string;
  documentId: string;
  action: "mark_reviewed" | "approve_document" | "reject_document" | "request_reupload" | "mark_ready_for_practitioner";
  reuploadReason?: string | null;
  internalNote?: string | null;
}) {
  const session = await getAuthSession();
  assertCanAccessReview(session.role);

  const practitionerOnly = input.action === "approve_document" || input.action === "reject_document" || input.action === "request_reupload";
  if (practitionerOnly && session.role !== "practitioner") {
    return { ok: false, error: "Only practitioners can finalize document decisions." };
  }

  if (input.action === "request_reupload" && !input.reuploadReason?.trim()) {
    return { ok: false, error: "Client-visible re-upload reason is required." };
  }

  if (!isSupabaseEnabled()) {
    const document = mockManagedDocuments.find((item) => item.id === input.documentId && item.caseId === input.caseId);
    if (!document) return { ok: false, error: "Document not found." };

    if (input.action === "approve_document") {
      document.status = "approved";
      document.reviewStatus = "approved";
    } else if (input.action === "reject_document") {
      document.status = "rejected";
      document.reviewStatus = "rejected";
    } else if (input.action === "request_reupload") {
      document.status = "needs_reupload";
      document.reviewStatus = "rejected";
      if (input.reuploadReason?.trim()) {
        document.practitionerNotes = [input.reuploadReason.trim(), ...document.practitionerNotes];
      }
    } else if (input.action === "mark_ready_for_practitioner") {
      document.practitionerNotes = ["Assistant marked this document ready for practitioner review.", ...document.practitionerNotes];
    }

    if (input.internalNote?.trim()) {
      document.practitionerNotes = [input.internalNote.trim(), ...document.practitionerNotes];
    }

    return { ok: true };
  }

  const client = getSupabaseServerClient();
  if (!client || !session.userId) return { ok: false, error: "Review service unavailable." };

  const { data: document } = await client
    .from("documents")
    .select("id, firm_id, document_status")
    .eq("id", input.documentId)
    .eq("case_id", input.caseId)
    .maybeSingle();
  if (!document) return { ok: false, error: "Document not found." };

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    reviewed_by: session.userId,
    reviewed_at: now,
    internal_review_note: input.internalNote ?? null,
  };

  if (input.action === "approve_document") {
    patch.document_status = "approved";
    patch.reupload_reason = null;
  } else if (input.action === "reject_document") {
    patch.document_status = "rejected";
  } else if (input.action === "request_reupload") {
    patch.document_status = "needs_reupload";
    patch.reupload_reason = input.reuploadReason?.trim() ?? null;
    patch.reupload_requested_by = session.userId;
    patch.reupload_requested_at = now;
  } else if (input.action === "mark_ready_for_practitioner") {
    patch.document_status = "needs_review";
  }

  await client.from("documents").update(patch).eq("id", input.documentId);

  if (practitionerOnly) {
    await client.from("approvals").insert({
      firm_id: (document as any).firm_id,
      case_id: input.caseId,
      entity_type: "document",
      entity_id: input.documentId,
      action: input.action === "approve_document" ? "approve" : input.action === "reject_document" ? "reject" : "override",
      approved_by: session.userId,
      notes: input.internalNote ?? input.reuploadReason ?? null,
    });
  }

  await client.from("audit_events").insert({
    firm_id: (document as any).firm_id,
    case_id: input.caseId,
    actor_id: session.userId,
    actor_role: session.role,
    action: `document_review_${input.action}`,
    entity_type: "document",
    entity_id: input.documentId,
    metadata: {
      reuploadReasonPresent: Boolean(input.reuploadReason?.trim()),
      internalNotePresent: Boolean(input.internalNote?.trim()),
    },
  });

  return { ok: true };
}
