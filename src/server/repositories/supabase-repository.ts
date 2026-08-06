import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { safeLog } from "@/lib/security/safe-logger";
import type {
  AppRepository,
  AssignmentRecord,
  AuditEventInput,
  CaseRecord,
  ClientRecord,
  CurrentUserContext,
  DocumentRecord,
} from "@/server/repositories/contracts";

export class SupabaseRepository implements AppRepository {
  readonly mode = "supabase" as const;

  private getClient() {
    const client = getSupabaseServerClient();
    if (!client) {
      throw new Error("Supabase server client is unavailable.");
    }
    return client;
  }

  async getCurrentUserContext(): Promise<CurrentUserContext | null> {
    const client = this.getClient();
    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) return null;

    const { data: profile } = await client
      .from("profiles")
      .select("id, email, role, firm_id, client_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) return null;

    return {
      userId: profile.id,
      email: profile.email,
      role: profile.role,
      firmId: profile.firm_id,
      clientId: profile.client_id,
    };
  }

  async listClients(): Promise<ClientRecord[]> {
    const client = this.getClient();
    const { data, error } = await client.from("clients").select("id, legal_name, email, language, status").order("created_at", { ascending: false });
    if (error) {
      safeLog("supabase_list_clients_failed", { reason: error.message });
      return [];
    }

    return (data ?? []).map((item) => ({
      id: item.id,
      legalName: item.legal_name,
      email: item.email,
      language: item.language,
      status: item.status,
    }));
  }

  async listCases(): Promise<CaseRecord[]> {
    const client = this.getClient();
    const { data, error } = await client
      .from("cases")
      .select("id, title, client_id, stream_key, stream_config_version, status")
      .order("updated_at", { ascending: false });

    if (error) {
      safeLog("supabase_list_cases_failed", { reason: error.message });
      return [];
    }

    return (data ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      clientId: item.client_id,
      streamKey: item.stream_key,
      streamConfigVersion: item.stream_config_version,
      status: item.status,
    }));
  }

  async listAssignments(caseId: string): Promise<AssignmentRecord[]> {
    const client = this.getClient();
    const { data, error } = await client
      .from("case_assignments")
      .select("id, case_id, user_id, role, is_primary")
      .eq("case_id", caseId);

    if (error) {
      safeLog("supabase_list_assignments_failed", { reason: error.message, caseId });
      return [];
    }

    return (data ?? []).map((item) => ({
      id: item.id,
      caseId: item.case_id,
      userId: item.user_id,
      role: item.role,
      isPrimary: item.is_primary,
    }));
  }

  async listCaseDocuments(caseId: string): Promise<DocumentRecord[]> {
    const client = this.getClient();
    const { data, error } = await client
      .from("documents")
      .select("id, case_id, normalized_filename, document_status, storage_path, uploaded_at")
      .eq("case_id", caseId)
      .order("uploaded_at", { ascending: false });

    if (error) {
      safeLog("supabase_list_documents_failed", { reason: error.message, caseId });
      return [];
    }

    return (data ?? []).map((item) => ({
      id: item.id,
      caseId: item.case_id,
      filename: item.normalized_filename,
      status: item.document_status,
      storagePath: item.storage_path,
      uploadedAt: item.uploaded_at,
    }));
  }

  async createSignedDocumentUrl(documentId: string, expiresInSeconds = 120): Promise<string | null> {
    const client = this.getClient();
    const { data: document, error } = await client
      .from("documents")
      .select("storage_path")
      .eq("id", documentId)
      .maybeSingle();

    if (error || !document) {
      safeLog("supabase_signed_url_document_lookup_failed", { reason: error?.message ?? "not_found", documentId });
      return null;
    }

    const { data: signed, error: signedError } = await client.storage
      .from("case-documents")
      .createSignedUrl(document.storage_path, expiresInSeconds);

    if (signedError) {
      safeLog("supabase_signed_url_failed", { reason: signedError.message, documentId });
      return null;
    }

    return signed.signedUrl;
  }

  async logAuditEvent(input: AuditEventInput): Promise<void> {
    const client = this.getClient();
    const context = await this.getCurrentUserContext();
    if (!context?.firmId) return;

    const { error } = await client.from("audit_events").insert({
      firm_id: context.firmId,
      case_id: input.caseId,
      actor_id: context.userId,
      actor_role: context.role,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId,
      metadata: input.metadata,
      before_hash: null,
      after_hash: null,
    });

    if (error) {
      safeLog("supabase_audit_log_failed", { reason: error.message, action: input.action, entityType: input.entityType });
    }
  }
}
