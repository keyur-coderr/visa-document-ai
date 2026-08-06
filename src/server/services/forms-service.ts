import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { isSupabaseEnabled } from "@/lib/env/supabase";
import { getCaseById, getClientById, getUserNameById, mockCaseRecords } from "@/lib/mock/case-management";
import {
  mockFormApprovals,
  mockFormGenerationRuns,
  mockFormValidationWarnings,
  mockGeneratedForms,
  mockGeneratedFormVersions,
} from "@/lib/mock/forms";
import { safeLog } from "@/lib/security/safe-logger";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getAuthSession } from "@/server/auth/session";
import { buildCanonicalFormData } from "@/server/forms/canonical-data-service";
import { mapCanonicalDataToForm } from "@/server/forms/mapping-engine";
import { getPdfFillProvider } from "@/server/forms/pdf-provider";
import {
  FORM_REGISTRY,
  getFormRegistryEntry,
  listFormsForStream,
  type FormCode,
  type FormRegistryEntry,
} from "@/server/forms/registry";

export type GeneratedFormStatus = "draft" | "generating" | "generated" | "needs_review" | "approved" | "failed" | "unsupported" | "archived";

export interface CaseFormOption {
  code: FormCode;
  formName: string;
  version: string;
  effectiveDate: string;
  mappingVersion: number;
  status: "supported" | "partial" | "unsupported";
  templateMode: "acroform" | "xfa" | "protected" | "flattened" | "missing";
  requiredManualReviewFields: string[];
  unsupportedFields: string[];
  requiredFacts: string[];
  missingFacts: string[];
}

export interface GeneratedFormSummary {
  id: string;
  caseId: string;
  formCode: FormCode;
  formName: string;
  formVersion: string;
  mappingVersion: number;
  status: GeneratedFormStatus;
  latestVersion: number;
  currentGeneratedFilePath: string | null;
  currentChecksum: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedFormVersionDetail {
  id: string;
  generatedFormId: string;
  version: number;
  formCode: FormCode;
  formVersion: string;
  mappingVersion: number;
  generationStatus: GeneratedFormStatus;
  providerName: string;
  providerVersion: string;
  templateMode: string;
  mappedFields: Record<string, string>;
  filledFields: string[];
  skippedFields: string[];
  unsupportedFields: string[];
  manualReviewFields: string[];
  missingRequiredFields: string[];
  warnings: string[];
  generatedFilePath: string | null;
  checksum: string | null;
  generatedBy: string;
  generatedAt: string;
  sourceFactIds: string[];
}

export interface GeneratedFormDetail {
  caseId: string;
  caseTitle: string;
  streamKey: string;
  clientName: string;
  form: GeneratedFormSummary;
  versions: GeneratedFormVersionDetail[];
  currentVersion: GeneratedFormVersionDetail | null;
  validationWarnings: Array<{ id: string; warningKey: string; severity: string; message: string; fieldName: string | null; createdAt: string }>;
  approvals: Array<{ id: string; action: string; notes: string | null; approvedBy: string; approvedAt: string }>;
  previewUrl: string | null;
}

function ensureRoleForForms(role: string | null) {
  if (role !== "practitioner" && role !== "assistant") throw new Error("forbidden");
}

function ensurePractitioner(role: string | null) {
  if (role !== "practitioner") throw new Error("forbidden_practitioner");
}

function registryRequiredSources(entry: FormRegistryEntry): string[] {
  return entry.fieldMappings.filter((item) => item.required).map((item) => item.sourceKey);
}

function collectMissingSources(entry: FormRegistryEntry, values: Record<string, string>): string[] {
  return entry.fieldMappings
    .filter((item) => item.required)
    .filter((item) => !values[item.sourceKey])
    .map((item) => item.sourceKey);
}

function statusFromGeneration(input: {
  unsupportedReason: string | null;
  missingRequiredFields: string[];
  providerMode: "mock" | "local";
}): GeneratedFormStatus {
  if (input.unsupportedReason) return "unsupported";
  if (input.missingRequiredFields.length > 0) return "needs_review";
  if (input.providerMode === "mock") return "needs_review";
  return "generated";
}

function mockPreviewPath(caseId: string, generatedFormId: string, version: number) {
  return `mock/forms/${caseId}/${generatedFormId}/v${version}.json`;
}

async function runGeneration(caseId: string, formCode: FormCode, actorUserId: string) {
  const entry = getFormRegistryEntry(formCode);
  if (!entry) return { ok: false as const, error: "Unsupported form code." };

  const canonical = await buildCanonicalFormData(caseId);
  if (!canonical) return { ok: false as const, error: "Case data is unavailable." };

  const mapping = mapCanonicalDataToForm(entry, canonical);
  const provider = getPdfFillProvider();
  const providerResult = await provider.fill({ entry, mappedValues: mapping.fieldValues });

  const status = statusFromGeneration({
    unsupportedReason: providerResult.unsupportedFormReason,
    missingRequiredFields: mapping.missingRequiredFields,
    providerMode: providerResult.provider.mode,
  });

  return {
    ok: true as const,
    entry,
    canonical,
    mapping,
    providerResult,
    status,
    actorUserId,
  };
}

export async function listCaseFormWorkspace(caseId: string): Promise<{
  caseId: string;
  caseTitle: string;
  streamKey: string;
  clientName: string;
  formOptions: CaseFormOption[];
  generatedForms: GeneratedFormSummary[];
}> {
  const session = await getAuthSession();
  ensureRoleForForms(session.role);

  if (!isSupabaseEnabled()) {
    const caseRecord = getCaseById(caseId);
    if (!caseRecord) throw new Error("not_found");
    const client = getClientById(caseRecord.clientId);
    const canonical = await buildCanonicalFormData(caseId);
    const forms = listFormsForStream(caseRecord.streamKey);

    const formOptions: CaseFormOption[] = forms.map((entry) => ({
      code: entry.code,
      formName: entry.formName,
      version: entry.version,
      effectiveDate: entry.effectiveDate,
      mappingVersion: entry.mappingVersion,
      status: entry.status,
      templateMode: entry.templateMode,
      requiredManualReviewFields: entry.requiredManualReviewFields,
      unsupportedFields: entry.unsupportedFields,
      requiredFacts: registryRequiredSources(entry),
      missingFacts: collectMissingSources(entry, canonical?.values ?? {}),
    }));

    const generatedForms = mockGeneratedForms
      .filter((item) => item.caseId === caseId)
      .map((item) => ({
        id: item.id,
        caseId: item.caseId,
        formCode: item.formCode,
        formName: item.formName,
        formVersion: item.formVersion,
        mappingVersion: item.mappingVersion,
        status: item.status,
        latestVersion: item.latestVersion,
        currentGeneratedFilePath: item.generatedFilePath,
        currentChecksum: item.checksum,
        approvedBy: item.approvedBy,
        approvedAt: item.approvedAt,
        createdBy: item.createdBy,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }));

    return {
      caseId,
      caseTitle: caseRecord.title,
      streamKey: caseRecord.streamKey,
      clientName: client?.legalName ?? "Client",
      formOptions,
      generatedForms,
    };
  }

  const client = getSupabaseServerClient();
  if (!client) throw new Error("service_unavailable");

  const canonical = await buildCanonicalFormData(caseId);
  const { data: caseRecord } = await client
    .from("cases")
    .select("id, title, stream_key, client_id")
    .eq("id", caseId)
    .maybeSingle();
  if (!caseRecord) throw new Error("not_found");

  const { data: clientRecord } = await client
    .from("clients")
    .select("id, legal_name")
    .eq("id", (caseRecord as any).client_id)
    .maybeSingle();

  const { data: generated } = await client
    .from("generated_forms")
    .select("id, case_id, form_code, form_name, form_version, mapping_version, status, latest_version, current_generated_file_path, current_checksum, approved_by, approved_at, created_by, created_at, updated_at")
    .eq("case_id", caseId)
    .order("created_at", { ascending: false });

  const forms = listFormsForStream((caseRecord as any).stream_key);

  return {
    caseId,
    caseTitle: (caseRecord as any).title,
    streamKey: (caseRecord as any).stream_key,
    clientName: (clientRecord as any)?.legal_name ?? "Client",
    formOptions: forms.map((entry) => ({
      code: entry.code,
      formName: entry.formName,
      version: entry.version,
      effectiveDate: entry.effectiveDate,
      mappingVersion: entry.mappingVersion,
      status: entry.status,
      templateMode: entry.templateMode,
      requiredManualReviewFields: entry.requiredManualReviewFields,
      unsupportedFields: entry.unsupportedFields,
      requiredFacts: registryRequiredSources(entry),
      missingFacts: collectMissingSources(entry, canonical?.values ?? {}),
    })),
    generatedForms: (generated ?? []).map((item: any) => ({
      id: item.id,
      caseId: item.case_id,
      formCode: item.form_code,
      formName: item.form_name,
      formVersion: item.form_version,
      mappingVersion: item.mapping_version,
      status: item.status,
      latestVersion: item.latest_version,
      currentGeneratedFilePath: item.current_generated_file_path,
      currentChecksum: item.current_checksum,
      approvedBy: item.approved_by,
      approvedAt: item.approved_at,
      createdBy: item.created_by,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    })),
  };
}

export async function generateCaseForm(input: { caseId: string; formCode: FormCode; regenerationReason?: string | null }) {
  const session = await getAuthSession();
  ensureRoleForForms(session.role);
  if (!session.userId) return { ok: false, error: "Session is unavailable." };

  const result = await runGeneration(input.caseId, input.formCode, session.userId);
  if (!result.ok) return result;

  if (!isSupabaseEnabled()) {
    const now = new Date().toISOString();
    const existing = mockGeneratedForms.find((item) => item.caseId === input.caseId && item.formCode === input.formCode && item.status !== "archived");
    const generatedFormId = existing?.id ?? `gf-${randomUUID()}`;
    const nextVersion = (existing?.latestVersion ?? 0) + 1;

    if (!existing) {
      mockGeneratedForms.push({
        id: generatedFormId,
        caseId: input.caseId,
        formCode: result.entry.code,
        formName: result.entry.formName,
        formVersion: result.entry.version,
        mappingVersion: result.entry.mappingVersion,
        status: result.status,
        latestVersion: nextVersion,
        generatedFilePath: mockPreviewPath(input.caseId, generatedFormId, nextVersion),
        checksum: result.providerResult.checksum,
        manualReviewRequired: true,
        approvedBy: null,
        approvedAt: null,
        createdBy: session.userId,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      existing.latestVersion = nextVersion;
      existing.status = result.status;
      existing.generatedFilePath = mockPreviewPath(input.caseId, generatedFormId, nextVersion);
      existing.checksum = result.providerResult.checksum;
      existing.approvedBy = null;
      existing.approvedAt = null;
      existing.updatedAt = now;
    }

    const versionId = `gfv-${randomUUID()}`;
    const runId = `gfr-${randomUUID()}`;
    mockGeneratedFormVersions.push({
      id: versionId,
      generatedFormId,
      caseId: input.caseId,
      version: nextVersion,
      formCode: result.entry.code,
      formVersion: result.entry.version,
      mappingVersion: result.entry.mappingVersion,
      generationStatus: result.status,
      providerName: result.providerResult.provider.name,
      providerVersion: result.providerResult.provider.version,
      templateMode: result.providerResult.templateInspection.mode,
      sourceFactIds: result.canonical.provenance.sourceFactIds,
      mappedFields: result.mapping.fieldValues,
      filledFields: result.providerResult.filledFields,
      skippedFields: Array.from(new Set([...result.mapping.skippedFields, ...result.providerResult.skippedFields])),
      unsupportedFields: result.mapping.unsupportedFields,
      manualReviewFields: result.mapping.manualReviewFields,
      missingRequiredFields: result.mapping.missingRequiredFields,
      warnings: Array.from(new Set([...result.canonical.warnings, ...result.mapping.warnings, ...result.providerResult.warnings])),
      generatedFilePath: mockPreviewPath(input.caseId, generatedFormId, nextVersion),
      checksum: result.providerResult.checksum,
      generatedBy: session.userId,
      generatedAt: now,
    });

    mockFormGenerationRuns.push({
      id: runId,
      generatedFormId,
      generatedFormVersionId: versionId,
      caseId: input.caseId,
      formCode: result.entry.code,
      formVersion: result.entry.version,
      mappingVersion: result.entry.mappingVersion,
      providerName: result.providerResult.provider.name,
      providerVersion: result.providerResult.provider.version,
      status: result.status,
      unsupportedReason: result.providerResult.unsupportedFormReason,
      skippedFields: Array.from(new Set([...result.mapping.skippedFields, ...result.providerResult.skippedFields])),
      warnings: Array.from(new Set([...result.canonical.warnings, ...result.mapping.warnings, ...result.providerResult.warnings])),
      createdBy: session.userId,
      startedAt: now,
      completedAt: now,
    });

    for (const warning of result.mapping.warnings) {
      mockFormValidationWarnings.push({
        id: `fw-${randomUUID()}`,
        runId,
        generatedFormVersionId: versionId,
        caseId: input.caseId,
        warningKey: "mapping_warning",
        severity: "medium",
        message: warning,
        fieldName: null,
        createdAt: now,
      });
    }

    if (input.regenerationReason?.trim()) {
      safeLog("form_regeneration_reason", { caseId: input.caseId, formCode: input.formCode, reasonPresent: true });
    }

    return { ok: true, generatedFormId, generatedFormVersionId: versionId, status: result.status };
  }

  const client = getSupabaseServerClient();
  if (!client) return { ok: false, error: "Service unavailable." };

  const { data: caseRow } = await client
    .from("cases")
    .select("id, firm_id")
    .eq("id", input.caseId)
    .maybeSingle();
  if (!caseRow) return { ok: false, error: "Case unavailable." };

  const now = new Date().toISOString();
  const { data: existingForm } = await client
    .from("generated_forms")
    .select("id, latest_version")
    .eq("case_id", input.caseId)
    .eq("form_code", input.formCode)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const generatedFormId = (existingForm as any)?.id ?? randomUUID();
  const nextVersion = Number((existingForm as any)?.latest_version ?? 0) + 1;
  const generatedPath = `firm/${(caseRow as any).firm_id}/case/${input.caseId}/forms/${generatedFormId}/v${nextVersion}-${result.entry.code.replace(/\s+/g, "").toLowerCase()}.json`;

  const runWarnings = Array.from(new Set([...result.canonical.warnings, ...result.mapping.warnings, ...result.providerResult.warnings]));
  const mergedSkipped = Array.from(new Set([...result.mapping.skippedFields, ...result.providerResult.skippedFields]));

  const upsertPayload = {
    id: generatedFormId,
    firm_id: (caseRow as any).firm_id,
    case_id: input.caseId,
    form_code: result.entry.code,
    form_name: result.entry.formName,
    form_version: result.entry.version,
    mapping_version: result.entry.mappingVersion,
    status: result.status,
    latest_version: nextVersion,
    current_generated_file_path: generatedPath,
    current_checksum: result.providerResult.checksum,
    manual_review_required: true,
    approval_required: true,
    approved_by: null,
    approved_at: null,
    created_by: session.userId,
  };

  if ((existingForm as any)?.id) {
    await client.from("generated_forms").update({
      status: result.status,
      latest_version: nextVersion,
      current_generated_file_path: generatedPath,
      current_checksum: result.providerResult.checksum,
      approved_by: null,
      approved_at: null,
      updated_at: now,
    }).eq("id", generatedFormId);
  } else {
    await client.from("generated_forms").insert(upsertPayload);
  }

  const versionId = randomUUID();
  await client.from("generated_form_versions").insert({
    id: versionId,
    generated_form_id: generatedFormId,
    firm_id: (caseRow as any).firm_id,
    case_id: input.caseId,
    version: nextVersion,
    form_code: result.entry.code,
    form_version: result.entry.version,
    mapping_version: result.entry.mappingVersion,
    provider_name: result.providerResult.provider.name,
    provider_version: result.providerResult.provider.version,
    template_identifier: result.entry.templateIdentifier,
    template_path: result.entry.templatePath,
    template_mode: result.providerResult.templateInspection.mode,
    generation_status: result.status,
    source_fact_ids: result.canonical.provenance.sourceFactIds,
    source_intake_response_id: result.canonical.provenance.intakeResponseId,
    source_participant_ids: result.canonical.provenance.participantIds,
    source_client_id: result.canonical.provenance.clientId,
    mapped_fields: result.mapping.fieldValues,
    filled_fields: result.providerResult.filledFields,
    skipped_fields: mergedSkipped,
    unsupported_fields: result.mapping.unsupportedFields,
    manual_review_fields: result.mapping.manualReviewFields,
    missing_required_fields: result.mapping.missingRequiredFields,
    warnings: runWarnings,
    generated_file_path: generatedPath,
    checksum: result.providerResult.checksum,
    metadata: {
      templateInspection: result.providerResult.templateInspection,
      regenerationReason: input.regenerationReason ?? null,
    },
    generated_by: session.userId,
    generated_at: now,
  });

  const runId = randomUUID();
  await client.from("form_generation_runs").insert({
    id: runId,
    generated_form_id: generatedFormId,
    generated_form_version_id: versionId,
    firm_id: (caseRow as any).firm_id,
    case_id: input.caseId,
    form_code: result.entry.code,
    form_version: result.entry.version,
    mapping_version: result.entry.mappingVersion,
    provider_name: result.providerResult.provider.name,
    provider_version: result.providerResult.provider.version,
    status: result.status,
    unsupported_reason: result.providerResult.unsupportedFormReason,
    source_fact_ids: result.canonical.provenance.sourceFactIds,
    skipped_fields: mergedSkipped,
    warnings: runWarnings,
    metadata: {
      templateInspection: result.providerResult.templateInspection,
      providerMode: result.providerResult.provider.mode,
      regenerationReason: input.regenerationReason ?? null,
    },
    started_at: now,
    completed_at: now,
    created_by: session.userId,
  });

  for (const missingField of result.mapping.missingRequiredFields) {
    await client.from("form_validation_warnings").insert({
      form_generation_run_id: runId,
      generated_form_version_id: versionId,
      firm_id: (caseRow as any).firm_id,
      case_id: input.caseId,
      warning_key: "missing_required_field",
      severity: "high",
      message: `Required field missing: ${missingField}`,
      field_name: missingField,
      metadata: {},
    });
  }

  for (const warning of runWarnings) {
    await client.from("form_validation_warnings").insert({
      form_generation_run_id: runId,
      generated_form_version_id: versionId,
      firm_id: (caseRow as any).firm_id,
      case_id: input.caseId,
      warning_key: "generation_warning",
      severity: "medium",
      message: warning,
      field_name: null,
      metadata: {},
    });
  }

  await client.from("audit_events").insert({
    firm_id: (caseRow as any).firm_id,
    case_id: input.caseId,
    actor_id: session.userId,
    actor_role: session.role,
    action: "form_generation_run",
    entity_type: "generated_form",
    entity_id: generatedFormId,
    metadata: {
      formCode: result.entry.code,
      formVersion: result.entry.version,
      mappingVersion: result.entry.mappingVersion,
      provider: result.providerResult.provider,
      status: result.status,
      unsupportedReason: result.providerResult.unsupportedFormReason,
      sourceFactIds: result.canonical.provenance.sourceFactIds,
      missingRequiredFields: result.mapping.missingRequiredFields,
      regenerationReason: input.regenerationReason ?? null,
    },
  });

  return { ok: true, generatedFormId, generatedFormVersionId: versionId, status: result.status };
}

export async function getGeneratedFormDetail(caseId: string, generatedFormId: string): Promise<GeneratedFormDetail | null> {
  const session = await getAuthSession();
  ensureRoleForForms(session.role);

  if (!isSupabaseEnabled()) {
    const form = mockGeneratedForms.find((item) => item.id === generatedFormId && item.caseId === caseId);
    if (!form) return null;
    const versions = mockGeneratedFormVersions
      .filter((item) => item.generatedFormId === generatedFormId)
      .sort((a, b) => b.version - a.version)
      .map((item) => ({
        id: item.id,
        generatedFormId: item.generatedFormId,
        version: item.version,
        formCode: item.formCode,
        formVersion: item.formVersion,
        mappingVersion: item.mappingVersion,
        generationStatus: item.generationStatus,
        providerName: item.providerName,
        providerVersion: item.providerVersion,
        templateMode: item.templateMode,
        mappedFields: item.mappedFields,
        filledFields: item.filledFields,
        skippedFields: item.skippedFields,
        unsupportedFields: item.unsupportedFields,
        manualReviewFields: item.manualReviewFields,
        missingRequiredFields: item.missingRequiredFields,
        warnings: item.warnings,
        generatedFilePath: item.generatedFilePath,
        checksum: item.checksum,
        generatedBy: item.generatedBy,
        generatedAt: item.generatedAt,
        sourceFactIds: item.sourceFactIds,
      }));

    const caseRecord = getCaseById(caseId);
    const client = caseRecord ? getClientById(caseRecord.clientId) : null;

    return {
      caseId,
      caseTitle: caseRecord?.title ?? "Case",
      streamKey: caseRecord?.streamKey ?? "unknown",
      clientName: client?.legalName ?? "Client",
      form: {
        id: form.id,
        caseId: form.caseId,
        formCode: form.formCode,
        formName: form.formName,
        formVersion: form.formVersion,
        mappingVersion: form.mappingVersion,
        status: form.status,
        latestVersion: form.latestVersion,
        currentGeneratedFilePath: form.generatedFilePath,
        currentChecksum: form.checksum,
        approvedBy: form.approvedBy,
        approvedAt: form.approvedAt,
        createdBy: form.createdBy,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt,
      },
      versions,
      currentVersion: versions.find((item) => item.version === form.latestVersion) ?? versions[0] ?? null,
      validationWarnings: mockFormValidationWarnings
        .filter((item) => item.caseId === caseId && versions.some((version) => version.id === item.generatedFormVersionId))
        .map((item) => ({
          id: item.id,
          warningKey: item.warningKey,
          severity: item.severity,
          message: item.message,
          fieldName: item.fieldName,
          createdAt: item.createdAt,
        })),
      approvals: mockFormApprovals
        .filter((item) => item.caseId === caseId && item.generatedFormId === generatedFormId)
        .map((item) => ({
          id: item.id,
          action: item.action,
          notes: item.notes,
          approvedBy: getUserNameById(item.approvedBy),
          approvedAt: item.approvedAt,
        })),
      previewUrl: null,
    };
  }

  const client = getSupabaseServerClient();
  if (!client) return null;

  const [{ data: caseRow }, { data: form }, { data: versions }, { data: warnings }, { data: approvals }, { data: clientRow }] = await Promise.all([
    client.from("cases").select("id, title, stream_key, client_id").eq("id", caseId).maybeSingle(),
    client
      .from("generated_forms")
      .select("id, case_id, form_code, form_name, form_version, mapping_version, status, latest_version, current_generated_file_path, current_checksum, approved_by, approved_at, created_by, created_at, updated_at")
      .eq("id", generatedFormId)
      .eq("case_id", caseId)
      .maybeSingle(),
    client
      .from("generated_form_versions")
      .select("id, generated_form_id, version, form_code, form_version, mapping_version, generation_status, provider_name, provider_version, template_mode, mapped_fields, filled_fields, skipped_fields, unsupported_fields, manual_review_fields, missing_required_fields, warnings, generated_file_path, checksum, generated_by, generated_at, source_fact_ids")
      .eq("generated_form_id", generatedFormId)
      .order("version", { ascending: false }),
    client
      .from("form_validation_warnings")
      .select("id, warning_key, severity, message, field_name, created_at")
      .eq("case_id", caseId)
      .order("created_at", { ascending: false }),
    client
      .from("form_approvals")
      .select("id, action, notes, approved_by, approved_at")
      .eq("generated_form_id", generatedFormId)
      .order("approved_at", { ascending: false }),
    client
      .from("clients")
      .select("id, legal_name")
      .eq("id", (await client.from("cases").select("client_id").eq("id", caseId).maybeSingle()).data?.client_id ?? "")
      .maybeSingle(),
  ]);

  if (!caseRow || !form) return null;

  const versionRows: GeneratedFormVersionDetail[] = (versions ?? []).map((item: any) => ({
    id: item.id,
    generatedFormId: item.generated_form_id,
    version: item.version,
    formCode: item.form_code,
    formVersion: item.form_version,
    mappingVersion: item.mapping_version,
    generationStatus: item.generation_status,
    providerName: item.provider_name,
    providerVersion: item.provider_version,
    templateMode: item.template_mode,
    mappedFields: item.mapped_fields ?? {},
    filledFields: item.filled_fields ?? [],
    skippedFields: item.skipped_fields ?? [],
    unsupportedFields: item.unsupported_fields ?? [],
    manualReviewFields: item.manual_review_fields ?? [],
    missingRequiredFields: item.missing_required_fields ?? [],
    warnings: item.warnings ?? [],
    generatedFilePath: item.generated_file_path,
    checksum: item.checksum,
    generatedBy: item.generated_by,
    generatedAt: item.generated_at,
    sourceFactIds: item.source_fact_ids ?? [],
  }));

  return {
    caseId,
    caseTitle: (caseRow as any).title,
    streamKey: (caseRow as any).stream_key,
    clientName: (clientRow as any)?.legal_name ?? "Client",
    form: {
      id: (form as any).id,
      caseId: (form as any).case_id,
      formCode: (form as any).form_code,
      formName: (form as any).form_name,
      formVersion: (form as any).form_version,
      mappingVersion: (form as any).mapping_version,
      status: (form as any).status,
      latestVersion: (form as any).latest_version,
      currentGeneratedFilePath: (form as any).current_generated_file_path,
      currentChecksum: (form as any).current_checksum,
      approvedBy: (form as any).approved_by,
      approvedAt: (form as any).approved_at,
      createdBy: (form as any).created_by,
      createdAt: (form as any).created_at,
      updatedAt: (form as any).updated_at,
    },
    versions: versionRows,
    currentVersion: versionRows.find((item) => item.version === (form as any).latest_version) ?? versionRows[0] ?? null,
    validationWarnings: (warnings ?? []).map((item: any) => ({
      id: item.id,
      warningKey: item.warning_key,
      severity: item.severity,
      message: item.message,
      fieldName: item.field_name,
      createdAt: item.created_at,
    })),
    approvals: (approvals ?? []).map((item: any) => ({
      id: item.id,
      action: item.action,
      notes: item.notes,
      approvedBy: item.approved_by,
      approvedAt: item.approved_at,
    })),
    previewUrl: null,
  };
}

export async function approveGeneratedForm(input: { caseId: string; generatedFormId: string; note?: string | null }) {
  const session = await getAuthSession();
  ensureRoleForForms(session.role);
  ensurePractitioner(session.role);
  if (!session.userId) return { ok: false, error: "Session unavailable." };

  if (!isSupabaseEnabled()) {
    const form = mockGeneratedForms.find((item) => item.id === input.generatedFormId && item.caseId === input.caseId);
    if (!form) return { ok: false, error: "Generated form not found." };
    const latest = mockGeneratedFormVersions
      .filter((item) => item.generatedFormId === input.generatedFormId)
      .sort((a, b) => b.version - a.version)[0];
    if (!latest) return { ok: false, error: "No generated version found." };

    const now = new Date().toISOString();
    form.status = "approved";
    form.approvedBy = session.userId;
    form.approvedAt = now;
    form.updatedAt = now;

    mockFormApprovals.push({
      id: `fa-${randomUUID()}`,
      generatedFormId: form.id,
      generatedFormVersionId: latest.id,
      caseId: form.caseId,
      action: "approve",
      notes: input.note ?? null,
      approvedBy: session.userId,
      approvedAt: now,
    });

    return { ok: true };
  }

  const client = getSupabaseServerClient();
  if (!client || !session.userId) return { ok: false, error: "Service unavailable." };

  const { data: form } = await client
    .from("generated_forms")
    .select("id, firm_id, latest_version")
    .eq("id", input.generatedFormId)
    .eq("case_id", input.caseId)
    .maybeSingle();
  if (!form) return { ok: false, error: "Generated form not found." };

  const { data: version } = await client
    .from("generated_form_versions")
    .select("id")
    .eq("generated_form_id", input.generatedFormId)
    .eq("version", (form as any).latest_version)
    .maybeSingle();
  if (!version) return { ok: false, error: "Generated form version not found." };

  const now = new Date().toISOString();
  await client.from("generated_forms").update({ status: "approved", approved_by: session.userId, approved_at: now }).eq("id", input.generatedFormId);

  await client.from("form_approvals").insert({
    generated_form_id: input.generatedFormId,
    generated_form_version_id: (version as any).id,
    firm_id: (form as any).firm_id,
    case_id: input.caseId,
    action: "approve",
    notes: input.note ?? null,
    approved_by: session.userId,
    approved_at: now,
  });

  await client.from("approvals").insert({
    firm_id: (form as any).firm_id,
    case_id: input.caseId,
    entity_type: "generated_form",
    entity_id: input.generatedFormId,
    action: "approve",
    approved_by: session.userId,
    notes: input.note ?? null,
  });

  await client.from("audit_events").insert({
    firm_id: (form as any).firm_id,
    case_id: input.caseId,
    actor_id: session.userId,
    actor_role: session.role,
    action: "generated_form_approved",
    entity_type: "generated_form",
    entity_id: input.generatedFormId,
    metadata: {
      notePresent: Boolean(input.note?.trim()),
      generatedFormVersionId: (version as any).id,
    },
  });

  return { ok: true };
}

export async function archiveGeneratedForm(input: { caseId: string; generatedFormId: string }) {
  const session = await getAuthSession();
  ensureRoleForForms(session.role);
  if (!session.userId) return { ok: false, error: "Session unavailable." };

  if (!isSupabaseEnabled()) {
    const form = mockGeneratedForms.find((item) => item.id === input.generatedFormId && item.caseId === input.caseId);
    if (!form) return { ok: false, error: "Generated form not found." };
    form.status = "archived";
    form.updatedAt = new Date().toISOString();
    return { ok: true };
  }

  const client = getSupabaseServerClient();
  if (!client) return { ok: false, error: "Service unavailable." };
  await client
    .from("generated_forms")
    .update({ status: "archived", archived_at: new Date().toISOString(), archived_by: session.userId })
    .eq("id", input.generatedFormId)
    .eq("case_id", input.caseId);

  return { ok: true };
}

export async function regenerateGeneratedForm(input: { caseId: string; generatedFormId: string; reason: string }) {
  const session = await getAuthSession();
  ensureRoleForForms(session.role);

  const base = await getGeneratedFormDetail(input.caseId, input.generatedFormId);
  if (!base) return { ok: false, error: "Generated form not found." };
  return generateCaseForm({ caseId: input.caseId, formCode: base.form.formCode, regenerationReason: input.reason });
}

export async function getGeneratedFormSignedUrl(caseId: string, generatedFormId: string) {
  const session = await getAuthSession();
  ensureRoleForForms(session.role);

  if (!isSupabaseEnabled()) {
    const detail = await getGeneratedFormDetail(caseId, generatedFormId);
    if (!detail?.currentVersion) return null;

    const mockPayload = {
      generatedFormId,
      version: detail.currentVersion.version,
      formCode: detail.form.formCode,
      mappedFields: detail.currentVersion.mappedFields,
      warnings: detail.currentVersion.warnings,
      unsupportedFields: detail.currentVersion.unsupportedFields,
      manualReviewFields: detail.currentVersion.manualReviewFields,
      note: "Mock fallback payload. This is not an official completed IRCC PDF.",
    };

    const encoded = Buffer.from(JSON.stringify(mockPayload, null, 2)).toString("base64");
    return `data:application/json;base64,${encoded}`;
  }

  const client = getSupabaseServerClient();
  if (!client) return null;
  const { data: form } = await client
    .from("generated_forms")
    .select("id, current_generated_file_path")
    .eq("id", generatedFormId)
    .eq("case_id", caseId)
    .maybeSingle();
  if (!form || !(form as any).current_generated_file_path) return null;

  const { data, error } = await client.storage
    .from("case-documents")
    .createSignedUrl((form as any).current_generated_file_path, 120);
  if (error || !data) return null;
  return data.signedUrl;
}

export function listSupportedForms(): Array<{ code: FormCode; formName: string; status: string; version: string }> {
  return FORM_REGISTRY.map((item) => ({
    code: item.code,
    formName: item.formName,
    status: item.status,
    version: item.version,
  }));
}
