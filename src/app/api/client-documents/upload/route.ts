import { createHash, randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/env/supabase";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { safeLog } from "@/lib/security/safe-logger";
import { processDocumentProcessingJob, queueDocumentProcessingJob } from "@/server/services/ai-processing-service";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);
const ALLOWED_EXTENSIONS = new Set(["pdf", "jpg", "jpeg", "png"]);

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizedFilename(filename: string): string {
  return filename
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120) || "document";
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const caseId = String(formData.get("caseId") ?? "");
  const requirementId = String(formData.get("requirementId") ?? "");
  const documentId = String(formData.get("documentId") ?? "");
  const uploadNote = String(formData.get("uploadNote") ?? "").trim().slice(0, 500);

  if (!(file instanceof File) || !isUuid(caseId) || !isUuid(requirementId) || (documentId && !isUuid(documentId))) {
    return errorResponse("The upload request is invalid.", 400);
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_MIME_TYPES.has(file.type) || !ALLOWED_EXTENSIONS.has(extension)) {
    return errorResponse("Only PDF, JPG, JPEG, and PNG files are accepted.", 415);
  }
  if (file.size <= 0 || file.size > MAX_FILE_SIZE_BYTES) {
    return errorResponse("This file exceeds the 10 MB upload limit.", 413);
  }

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ documentId: `mock-${randomUUID()}`, version: 1, status: "uploaded" }, { status: 201 });
  }

  const client = getSupabaseServerClient();
  if (!client) return errorResponse("Secure upload is unavailable.", 503);

  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return errorResponse("Please sign in to upload documents.", 401);

  const { data: profile } = await client
    .from("profiles")
    .select("id, role, firm_id, client_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || profile.role !== "client" || !profile.client_id) {
    return errorResponse("You are not allowed to upload to this case.", 403);
  }

  const { data: caseRecord } = await client
    .from("cases")
    .select("id, firm_id, client_id")
    .eq("id", caseId)
    .maybeSingle();
  if (!caseRecord || caseRecord.client_id !== profile.client_id) {
    return errorResponse("You are not allowed to upload to this case.", 403);
  }

  const { data: requirement } = await client
    .from("document_requirements")
    .select("id, case_id")
    .eq("id", requirementId)
    .maybeSingle();
  if (!requirement || requirement.case_id !== caseId) {
    return errorResponse("The selected checklist requirement is unavailable.", 400);
  }

  let existingDocument: { id: string; document_status: string; exhibit_label: string | null } | null = null;
  if (documentId) {
    const { data } = await client
      .from("documents")
      .select("id, document_status, exhibit_label")
      .eq("id", documentId)
      .eq("case_id", caseId)
      .maybeSingle();
    existingDocument = data;
    if (!existingDocument || existingDocument.document_status !== "needs_reupload") {
      return errorResponse("This document cannot be replaced at this time.", 409);
    }
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const checksum = `sha256:${createHash("sha256").update(buffer).digest("hex")}`;
  const safeFilename = normalizedFilename(file.name);
  const targetDocumentId = existingDocument?.id ?? randomUUID();
  const { data: latestVersion } = existingDocument
    ? await client.from("document_versions").select("version").eq("document_id", targetDocumentId).order("version", { ascending: false }).limit(1).maybeSingle()
    : { data: null };
  const version = (latestVersion?.version ?? 0) + 1;
  const storagePath = `firm/${caseRecord.firm_id}/case/${caseId}/client/${profile.client_id}/documents/${targetDocumentId}/v${version}-${safeFilename}`;

  const { error: storageError } = await client.storage.from("case-documents").upload(storagePath, buffer, {
    contentType: file.type,
    upsert: false,
  });
  if (storageError) {
    safeLog("client_document_upload_storage_failed", { caseId, requirementId, code: storageError.statusCode ?? "unknown" });
    return errorResponse("The file could not be uploaded. Please try again.", 502);
  }

  const documentPayload = {
    id: targetDocumentId,
    firm_id: caseRecord.firm_id,
    case_id: caseId,
    requirement_id: requirementId,
    original_filename: file.name.slice(0, 255),
    normalized_filename: safeFilename,
    storage_path: storagePath,
    mime_type: file.type,
    size_bytes: file.size,
    checksum,
    upload_source: "client_portal",
    document_status: "uploaded",
    exhibit_label: existingDocument?.exhibit_label ?? null,
    uploaded_by: user.id,
    uploaded_at: new Date().toISOString(),
    client_upload_note: uploadNote || null,
    reupload_reason: null,
    reupload_requested_at: null,
    reupload_requested_by: null,
  };

  const { error: documentError } = existingDocument
    ? await client.from("documents").update(documentPayload).eq("id", targetDocumentId)
    : await client.from("documents").insert(documentPayload);
  if (documentError) {
    await client.storage.from("case-documents").remove([storagePath]);
    safeLog("client_document_upload_record_failed", { caseId, requirementId, code: documentError.code });
    return errorResponse("The document record could not be saved. Please try again.", 500);
  }

  const { error: versionError } = await client.from("document_versions").insert({
    document_id: targetDocumentId,
    version,
    storage_path: storagePath,
    checksum,
    created_by: user.id,
    original_filename: file.name.slice(0, 255),
    mime_type: file.type,
    size_bytes: file.size,
    upload_note: uploadNote || null,
  });
  if (versionError) {
    safeLog("client_document_version_failed", { caseId, documentId: targetDocumentId, code: versionError.code });
    return errorResponse("The upload completed but version metadata could not be saved.", 500);
  }

  await client.from("document_requirements").update({ status: "uploaded" }).eq("id", requirementId);
  await client.from("audit_events").insert({
    firm_id: caseRecord.firm_id,
    case_id: caseId,
    actor_id: user.id,
    actor_role: "client",
    action: existingDocument ? "document_reuploaded" : "document_uploaded",
    entity_type: "document",
    entity_id: targetDocumentId,
    metadata: { requirementId, version, mimeType: file.type, sizeBytes: file.size },
  });

  const queueResult = await queueDocumentProcessingJob({
    documentId: targetDocumentId,
    caseId,
    firmId: caseRecord.firm_id,
    actorId: user.id,
    uploadVersion: version,
  });

  if (queueResult.jobId) {
    void processDocumentProcessingJob(queueResult.jobId).catch((error) => {
      safeLog("ai_processing_async_dispatch_failed", {
        documentId: targetDocumentId,
        code: error instanceof Error ? error.message : "unknown",
      });
    });
  }

  return NextResponse.json({ documentId: targetDocumentId, version, status: "uploaded", aiQueued: queueResult.queued }, { status: 201 });
}
