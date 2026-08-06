import "server-only";

import { getStreamConfig } from "@/config/streams";
import { isSupabaseEnabled } from "@/lib/env/supabase";
import { mockCaseRecords, mockClients, mockDeadlines, mockTeamUsers } from "@/lib/mock/case-management";
import { mockManagedDocuments } from "@/lib/mock/documents";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export interface PortalCaseSummary {
  id: string;
  title: string;
  streamLabel: string;
  status: string;
  progressPercent: number;
  checklistCompleted: number;
  checklistTotal: number;
  nearestDeadline: string | null;
}

export interface PortalCaseDetail extends PortalCaseSummary {
  streamKey: string;
  currentMilestone: string;
  team: string[];
  requirements: Array<{ id: string; key: string; label: string; required: boolean; status: string; reason: string | null }>;
  documents: Array<{ id: string; filename: string; status: string; requirementKey: string | null; uploadedAt: string; reuploadReason: string | null }>;
  deadlines: Array<{ id: string; label: string; dueDate: string; status: string }>;
  messages: Array<{ id: string; body: string; senderName: string; senderRole: string; createdAt: string }>;
}

function mockPortalCase(caseId: string): PortalCaseDetail | null {
  const caseRecord = mockCaseRecords.find((item) => item.id === caseId && item.clientId === "client_001");
  if (!caseRecord) return null;
  const stream = getStreamConfig(caseRecord.streamKey);
  const documents = mockManagedDocuments.filter((item) => item.caseId === caseId && !item.archived);
  const requirementStatus = new Map(documents.map((item) => [item.requirementKey, item.status]));
  const requirements = stream.checklistGroups.flatMap((group) =>
    group.items.map((item) => ({
      id: `mock-${item.key}`,
      key: item.key,
      label: item.label,
      required: item.kind === "required",
      status: requirementStatus.get(item.key) ?? "missing",
      reason: documents.find((document) => document.requirementKey === item.key)?.status === "needs_reupload" ? "Please upload a clearer replacement." : null,
    })),
  );
  const team = [caseRecord.assignedPractitionerId, caseRecord.assignedAssistantId]
    .filter((id): id is string => Boolean(id))
    .map((id) => mockTeamUsers.find((user) => user.id === id)?.fullName ?? "Case team");
  return {
    ...caseRecord,
    streamKey: caseRecord.streamKey,
    team,
    requirements,
    documents: documents.map((item) => ({ id: item.id, filename: item.filename, status: item.status, requirementKey: item.requirementKey, uploadedAt: item.uploadedAt, reuploadReason: item.status === "needs_reupload" ? item.practitionerNotes[0] ?? null : null })),
    deadlines: mockDeadlines.filter((item) => item.caseId === caseId).map((item) => ({ id: item.id, label: item.label, dueDate: item.dueDate, status: item.status })),
    messages: [{ id: "mock-message-1", body: "Your case team will review uploaded documents and contact you here if anything else is needed.", senderName: "Priya Nair", senderRole: "practitioner", createdAt: "2026-08-05T09:00:00Z" }],
  };
}

export async function listPortalCases(): Promise<{ clientName: string; cases: PortalCaseSummary[] }> {
  if (!isSupabaseEnabled()) {
    const client = mockClients.find((item) => item.id === "client_001")!;
    const cases = mockCaseRecords.filter((item) => item.clientId === client.id).map((item) => ({
      id: item.id, title: item.title, streamLabel: item.streamLabel, status: item.status, progressPercent: item.progressPercent,
      checklistCompleted: item.checklistCompleted, checklistTotal: item.checklistTotal, nearestDeadline: item.nearestDeadline,
    }));
    return { clientName: client.legalName, cases };
  }

  const client = getSupabaseServerClient();
  const { data: userData } = await client!.auth.getUser();
  const { data: profile } = await client!.from("profiles").select("full_name, role, client_id").eq("id", userData.user?.id ?? "").maybeSingle();
  if (!profile || profile.role !== "client" || !profile.client_id) return { clientName: "Client", cases: [] };
  const { data: records } = await client!.from("cases").select("id, title, stream_key, status, current_milestone, updated_at, document_requirements(status), deadlines(due_at)").eq("client_id", profile.client_id).order("updated_at", { ascending: false });
  return {
    clientName: profile.full_name,
    cases: (records ?? []).map((record) => {
      const requirements = record.document_requirements ?? [];
      const completed = requirements.filter((item: { status: string }) => item.status === "approved").length;
      return { id: record.id, title: record.title, streamLabel: record.stream_key, status: record.status, progressPercent: requirements.length ? Math.round((completed / requirements.length) * 100) : 0, checklistCompleted: completed, checklistTotal: requirements.length, nearestDeadline: record.deadlines?.[0]?.due_at ?? null };
    }),
  };
}

export async function getPortalCase(caseId: string): Promise<PortalCaseDetail | null> {
  if (!isSupabaseEnabled()) return mockPortalCase(caseId);
  const client = getSupabaseServerClient();
  const { data: caseRecord } = await client!.from("cases").select("id, title, stream_key, status, current_milestone, document_requirements(id, requirement_key, label, required, status, reason), documents(id, original_filename, document_status, requirement_id, uploaded_at, reupload_reason), deadlines(id, label, due_at, status), case_assignments(profiles(full_name)), case_messages(id, body, sender_role, created_at, profiles(full_name))").eq("id", caseId).maybeSingle();
  if (!caseRecord) return null;
  const requirements = caseRecord.document_requirements ?? [];
  const completed = requirements.filter((item: { status: string }) => item.status === "approved").length;
  return {
    id: caseRecord.id, title: caseRecord.title, streamKey: caseRecord.stream_key, streamLabel: caseRecord.stream_key, status: caseRecord.status, currentMilestone: caseRecord.current_milestone, progressPercent: requirements.length ? Math.round((completed / requirements.length) * 100) : 0, checklistCompleted: completed, checklistTotal: requirements.length, nearestDeadline: caseRecord.deadlines?.[0]?.due_at ?? null,
    requirements: requirements.map((item: { id: string; requirement_key: string; label: string; required: boolean; status: string; reason: string | null }) => ({ id: item.id, key: item.requirement_key, label: item.label, required: item.required, status: item.status, reason: item.reason })),
    documents: (caseRecord.documents ?? []).map((item: { id: string; original_filename: string; document_status: string; requirement_id: string | null; uploaded_at: string; reupload_reason: string | null }) => ({ id: item.id, filename: item.original_filename, status: item.document_status, requirementKey: item.requirement_id, uploadedAt: item.uploaded_at, reuploadReason: item.reupload_reason })),
    deadlines: (caseRecord.deadlines ?? []).map((item: { id: string; label: string; due_at: string; status: string }) => ({ id: item.id, label: item.label, dueDate: item.due_at, status: item.status })),
    team: (caseRecord.case_assignments ?? []).map((item: { profiles: Array<{ full_name: string }> }) => item.profiles[0]?.full_name ?? "Case team"),
    messages: (caseRecord.case_messages ?? []).map((item: { id: string; body: string; sender_role: string; created_at: string; profiles: Array<{ full_name: string }> }) => ({ id: item.id, body: item.body, senderRole: item.sender_role, senderName: item.profiles[0]?.full_name ?? "Case team", createdAt: item.created_at })),
  };
}