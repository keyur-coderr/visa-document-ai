import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseEnabled } from "@/lib/env/supabase";
import { safeLog } from "@/lib/security/safe-logger";
import { getAiProviderBundle } from "@/server/ai/providers/factory";
import type { DocumentQualityIssueKey, QualityIssueResult } from "@/server/ai/types";

interface QueueDocumentProcessingInput {
  documentId: string;
  caseId: string;
  firmId: string;
  actorId: string;
  uploadVersion: number;
}

interface ProcessingJobRow {
  id: string;
  firm_id: string;
  case_id: string;
  document_id: string;
  provider: string;
  job_type: string;
  status: "queued" | "processing" | "completed" | "failed" | "retry_pending" | "needs_review" | "cancelled";
  attempt_count: number;
  idempotency_key: string;
}

function parseDateOrNull(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function buildQualityChecks(params: {
  ocrConfidence: number;
  extractionConfidence: number;
  category: string;
  extractedJson: Record<string, unknown>;
}): QualityIssueResult[] {
  const issues: QualityIssueResult[] = [];

  if (params.ocrConfidence < 0.55) {
    issues.push({
      issueKey: "low_ocr_confidence",
      severity: "medium",
      confidence: 1 - params.ocrConfidence,
      details: { ocrConfidence: params.ocrConfidence },
    });
  }

  if (params.extractionConfidence < 0.55) {
    issues.push({
      issueKey: "unreadable_file",
      severity: "medium",
      confidence: 1 - params.extractionConfidence,
      details: { extractionConfidence: params.extractionConfidence },
    });
  }

  const expiryRaw =
    (typeof params.extractedJson.expiry_date === "string" ? params.extractedJson.expiry_date : null) ??
    (typeof params.extractedJson.expiryDate === "string" ? params.extractedJson.expiryDate : null);

  const expiryDate = parseDateOrNull(expiryRaw);
  if (expiryDate) {
    const now = new Date();
    const diffDays = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays < 0) {
      issues.push({ issueKey: "document_expired", severity: "high", confidence: 0.9, details: { expiryDate: expiryDate.toISOString() } });
    } else if (diffDays < 90) {
      issues.push({ issueKey: "document_expiring_soon", severity: "medium", confidence: 0.7, details: { expiryDate: expiryDate.toISOString(), daysRemaining: Math.round(diffDays) } });
    }
  }

  if (params.category === "unknown") {
    issues.push({
      issueKey: "unsupported_file",
      severity: "low",
      confidence: 0.6,
      details: { reason: "classification_unknown" },
    });
  }

  return issues;
}

export async function queueDocumentProcessingJob(input: QueueDocumentProcessingInput): Promise<{ jobId: string | null; queued: boolean }> {
  if (!isSupabaseEnabled()) {
    return { jobId: null, queued: false };
  }

  const admin = getSupabaseAdminClient();
  const providers = getAiProviderBundle();
  const idempotencyKey = `doc:${input.documentId}:version:${input.uploadVersion}`;

  const { data, error } = await admin
    .from("processing_jobs")
    .upsert(
      {
        firm_id: input.firmId,
        case_id: input.caseId,
        document_id: input.documentId,
        provider: providers.provider,
        job_type: "ocr_classification_extraction",
        status: "queued",
        idempotency_key: idempotencyKey,
        created_by: input.actorId,
        provider_metadata: { queuedBy: "upload", queueVersion: 1 },
      },
      { onConflict: "document_id,job_type,idempotency_key" },
    )
    .select("id")
    .single();

  if (error) {
    safeLog("queue_document_processing_failed", {
      code: error.code ?? "unknown",
      documentId: input.documentId,
      caseId: input.caseId,
    });
    return { jobId: null, queued: false };
  }

  return { jobId: data.id, queued: true };
}

async function markJobFailure(admin: ReturnType<typeof getSupabaseAdminClient>, job: ProcessingJobRow, errorCode: string, safeMessage: string) {
  const nextAttempt = job.attempt_count + 1;
  const finalStatus = nextAttempt < 3 ? "retry_pending" : "failed";
  await admin
    .from("processing_jobs")
    .update({
      status: finalStatus,
      attempt_count: nextAttempt,
      completed_at: new Date().toISOString(),
      error_code: errorCode,
      safe_error_message: safeMessage,
      provider_metadata: { failedAt: new Date().toISOString() },
    })
    .eq("id", job.id);
}

async function processJobById(jobId: string): Promise<boolean> {
  if (!isSupabaseEnabled()) return false;

  const admin = getSupabaseAdminClient();
  const { data: job, error: jobError } = await admin
    .from("processing_jobs")
    .select("id, firm_id, case_id, document_id, provider, job_type, status, attempt_count, idempotency_key")
    .eq("id", jobId)
    .maybeSingle<ProcessingJobRow>();

  if (jobError || !job) return false;
  if (job.status === "completed" || job.status === "needs_review" || job.status === "cancelled") return false;

  const now = new Date().toISOString();
  await admin
    .from("processing_jobs")
    .update({ status: "processing", started_at: now, attempt_count: job.attempt_count + 1, error_code: null, safe_error_message: null })
    .eq("id", job.id);

  const { data: document, error: documentError } = await admin
    .from("documents")
    .select("id, case_id, firm_id, storage_path, mime_type, normalized_filename")
    .eq("id", job.document_id)
    .maybeSingle();

  if (documentError || !document) {
    await markJobFailure(admin, job, "document_not_found", "Document metadata is unavailable for processing.");
    return false;
  }

  const { data: objectData, error: objectError } = await admin.storage
    .from("case-documents")
    .download(document.storage_path);

  if (objectError || !objectData) {
    await markJobFailure(admin, job, "storage_download_failed", "Document content could not be loaded for processing.");
    return false;
  }

  try {
    const providers = getAiProviderBundle();
    const contentBytes = Buffer.from(await objectData.arrayBuffer());

    const ocrResult = await providers.ocr.extractText({
      documentId: job.document_id,
      filename: document.normalized_filename,
      mimeType: document.mime_type,
      contentBytes,
    });

    const ocrText = ocrResult.pages.map((page) => page.text).join("\n\n");
    const classification = await providers.classifier.classifyDocument({
      filename: document.normalized_filename,
      mimeType: document.mime_type,
      ocrText,
    });

    const extraction = await providers.extractor.extractStructuredData({
      category: classification.predictedCategory,
      ocrText,
      filename: document.normalized_filename,
    });

    const qualityIssues = buildQualityChecks({
      ocrConfidence: ocrResult.confidence,
      extractionConfidence: extraction.confidence,
      category: classification.predictedCategory,
      extractedJson: extraction.extractedJson,
    });

    const { data: latestClassification } = await admin
      .from("document_classification_results")
      .select("run_version")
      .eq("document_id", job.document_id)
      .order("run_version", { ascending: false })
      .limit(1)
      .maybeSingle();

    const runVersion = (latestClassification?.run_version ?? 0) + 1;

    await admin
      .from("document_classification_results")
      .update({ is_latest: false })
      .eq("document_id", job.document_id)
      .eq("is_latest", true);

    await admin.from("document_classification_results").upsert(
      {
        firm_id: job.firm_id,
        case_id: job.case_id,
        document_id: job.document_id,
        provider: classification.provider,
        model: classification.model,
        schema_version: classification.schemaVersion,
        prompt_version: classification.promptVersion,
        generated_at: new Date().toISOString(),
        confidence: classification.confidence,
        run_version: runVersion,
        is_latest: true,
        predicted_category: classification.predictedCategory,
        alternatives: classification.alternatives,
        source_metadata: classification.sourceMetadata,
        review_status: "pending_review",
        idempotency_key: job.idempotency_key,
      },
      { onConflict: "document_id,idempotency_key" },
    );

    const { data: extractionRun } = await admin
      .from("document_extraction_runs")
      .upsert(
        {
          firm_id: job.firm_id,
          case_id: job.case_id,
          document_id: job.document_id,
          provider: extraction.provider,
          model: extraction.model,
          schema_version: extraction.schemaVersion,
          prompt_version: extraction.promptVersion,
          status: "completed",
          review_status: "pending_review",
          generated_at: new Date().toISOString(),
          started_at: now,
          completed_at: new Date().toISOString(),
          confidence: extraction.confidence,
          extracted_json: extraction.extractedJson,
          source_metadata: {
            ocrProvider: ocrResult.provider,
            ocrModel: ocrResult.model,
            ocrConfidence: ocrResult.confidence,
            ocrPages: ocrResult.pages.length,
            classification: classification.sourceMetadata,
            extraction: extraction.sourceMetadata,
          },
          idempotency_key: job.idempotency_key,
        },
        { onConflict: "document_id,idempotency_key" },
      )
      .select("id")
      .single();

    if (!extractionRun?.id) {
      throw new Error("extraction_run_missing");
    }

    await admin.from("document_extracted_fields").delete().eq("extraction_run_id", extractionRun.id);

    if (extraction.fields.length) {
      await admin.from("document_extracted_fields").insert(
        extraction.fields.map((field) => ({
          extraction_run_id: extractionRun.id,
          firm_id: job.firm_id,
          case_id: job.case_id,
          document_id: job.document_id,
          field_key: field.fieldKey,
          raw_value: field.rawValue,
          normalized_value: field.normalizedValue,
          confidence: field.confidence,
          source_page: field.sourcePage,
          source_text: field.sourceText,
          source_coordinates: field.sourceCoordinates,
          review_required: field.reviewRequired,
          approval_status: "pending_review",
        })),
      );
    }

    if (qualityIssues.length) {
      await admin.from("document_quality_checks").upsert(
        qualityIssues.map((issue) => ({
          firm_id: job.firm_id,
          case_id: job.case_id,
          document_id: job.document_id,
          issue_key: issue.issueKey,
          severity: issue.severity,
          detected_by: providers.provider,
          confidence: issue.confidence,
          status: "pending_review",
          details: issue.details,
          idempotency_key: job.idempotency_key,
        })),
        { onConflict: "document_id,issue_key,idempotency_key" },
      );
    }

    await admin.from("documents").update({ document_status: "needs_review" }).eq("id", job.document_id);

    await admin
      .from("processing_jobs")
      .update({
        status: "needs_review",
        completed_at: new Date().toISOString(),
        error_code: null,
        safe_error_message: null,
        provider_metadata: {
          provider: providers.provider,
          ocrConfidence: ocrResult.confidence,
          classificationConfidence: classification.confidence,
          extractionConfidence: extraction.confidence,
          qualityIssueCount: qualityIssues.length,
        },
      })
      .eq("id", job.id);

    await admin.from("audit_events").insert({
      firm_id: job.firm_id,
      case_id: job.case_id,
      actor_id: null,
      actor_role: "assistant",
      action: "ai_processing_completed",
      entity_type: "document",
      entity_id: job.document_id,
      metadata: {
        jobId: job.id,
        provider: providers.provider,
        classification: classification.predictedCategory,
        qualityIssueCount: qualityIssues.length,
      },
    });

    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    safeLog("ai_processing_failed", { jobId: job.id, code: message });
    await markJobFailure(admin, job, "provider_processing_failed", "Document processing failed and can be retried.");
    return false;
  }
}

export async function processDocumentProcessingJob(jobId: string): Promise<boolean> {
  return processJobById(jobId);
}

export async function processNextQueuedDocumentJob(): Promise<{ processed: boolean; jobId: string | null }> {
  if (!isSupabaseEnabled()) return { processed: false, jobId: null };

  const admin = getSupabaseAdminClient();
  const { data: queued } = await admin
    .from("processing_jobs")
    .select("id")
    .in("status", ["queued", "retry_pending"])
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (!queued?.id) return { processed: false, jobId: null };

  const processed = await processJobById(queued.id);
  return { processed, jobId: queued.id };
}
