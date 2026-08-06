import "server-only";

import { isSupabaseEnabled } from "@/lib/env/supabase";
import { getCaseById, getClientById, mockCaseParticipants } from "@/lib/mock/case-management";
import { mockCaseFacts } from "@/lib/mock/review";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export interface CanonicalFactSource {
  id: string;
  key: string;
  value: string;
  approvedAt: string;
}

export interface CanonicalParticipant {
  id: string;
  relationship: string;
  legalName: string;
  dateOfBirth: string | null;
  metadata: Record<string, unknown>;
}

export interface CanonicalFormData {
  caseId: string;
  streamKey: string;
  client: {
    id: string;
    legalName: string;
    email: string | null;
    phone: string | null;
    language: string | null;
  };
  intake: {
    responseId: string | null;
    completionStatus: string | null;
    reviewedAt: string | null;
    answers: Record<string, unknown>;
  };
  participants: CanonicalParticipant[];
  approvedFacts: CanonicalFactSource[];
  values: Record<string, string>;
  provenance: {
    sourceFactIds: string[];
    participantIds: string[];
    intakeResponseId: string | null;
    clientId: string;
  };
  warnings: string[];
}

function flattenAnswers(prefix: string, value: unknown, out: Record<string, string>) {
  if (value === null || value === undefined) return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => flattenAnswers(`${prefix}.${index}`, item, out));
    return;
  }
  if (typeof value === "object") {
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      flattenAnswers(`${prefix}.${key}`, nested, out);
    }
    return;
  }
  out[prefix] = String(value);
}

function normalizeNameParts(fullName: string | null | undefined): { givenNames: string; lastName: string } {
  const raw = (fullName ?? "").trim();
  if (!raw) return { givenNames: "", lastName: "" };
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return { givenNames: "", lastName: parts[0] };
  const lastName = parts[parts.length - 1] ?? "";
  return { givenNames: parts.slice(0, -1).join(" "), lastName };
}

export async function buildCanonicalFormData(caseId: string): Promise<CanonicalFormData | null> {
  if (!isSupabaseEnabled()) {
    const caseRecord = getCaseById(caseId);
    if (!caseRecord) return null;
    const client = getClientById(caseRecord.clientId);
    if (!client) return null;

    const participants = mockCaseParticipants
      .filter((item) => item.caseId === caseId)
      .map((item) => ({
        id: item.id,
        relationship: item.relationship,
        legalName: item.legalName,
        dateOfBirth: null,
        metadata: {},
      }));

    const approvedFacts = mockCaseFacts
      .filter((item) => item.caseId === caseId)
      .map((item) => ({
        id: item.id,
        key: item.fieldKey,
        value: item.approvedValue,
        approvedAt: item.approvedAt,
      }));

    const values: Record<string, string> = {};
    const principal = participants.find((item) => item.relationship === "principal_applicant");
    const nameParts = normalizeNameParts(principal?.legalName ?? client.legalName);

    values["person.principal.legal_name"] = principal?.legalName ?? client.legalName;
    values["person.principal.given_names"] = nameParts.givenNames;
    values["person.principal.last_name"] = nameParts.lastName;
    values["person.principal.language_preference"] = (client.language ?? "english").toLowerCase();
    values["person.principal.email"] = client.email;
    values["person.principal.phone"] = client.phone ?? "";

    for (const fact of approvedFacts) {
      values[`fact.${fact.key}`] = fact.value;
      if (fact.key === "legal_name") {
        values["person.principal.legal_name"] = fact.value;
      }
      if (fact.key === "passport_number") {
        values["person.principal.passport_number"] = fact.value;
      }
      if (fact.key === "date_of_birth") {
        values["person.principal.date_of_birth"] = fact.value;
      }
      if (fact.key === "uci") {
        values["person.principal.uci"] = fact.value;
      }
    }

    const warnings: string[] = [];
    if (approvedFacts.length === 0) {
      warnings.push("No practitioner-approved CaseFacts were found. Form output may be incomplete.");
    }

    return {
      caseId,
      streamKey: caseRecord.streamKey,
      client: {
        id: client.id,
        legalName: client.legalName,
        email: client.email,
        phone: client.phone,
        language: client.language,
      },
      intake: {
        responseId: null,
        completionStatus: null,
        reviewedAt: null,
        answers: {},
      },
      participants,
      approvedFacts,
      values,
      provenance: {
        sourceFactIds: approvedFacts.map((item) => item.id),
        participantIds: participants.map((item) => item.id),
        intakeResponseId: null,
        clientId: client.id,
      },
      warnings,
    };
  }

  const client = getSupabaseServerClient();
  if (!client) return null;

  const { data: caseRecord } = await client
    .from("cases")
    .select("id, stream_key, client_id")
    .eq("id", caseId)
    .maybeSingle();
  if (!caseRecord) return null;

  const [{ data: clientRecord }, { data: intakeResponse }, { data: participants }, { data: facts }] = await Promise.all([
    client.from("clients").select("id, legal_name, email, phone, language").eq("id", (caseRecord as any).client_id).maybeSingle(),
    client.from("intake_responses").select("id, completion_status, reviewed_at, answers").eq("case_id", caseId).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    client.from("case_participants").select("id, relationship, legal_name, metadata").eq("case_id", caseId),
    client.from("case_facts").select("id, field_key, approved_value, approved_at").eq("case_id", caseId).order("approved_at", { ascending: false }),
  ]);

  if (!clientRecord) return null;

  const approvedFacts: CanonicalFactSource[] = (facts ?? []).map((item: any) => ({
    id: item.id,
    key: item.field_key,
    value: item.approved_value,
    approvedAt: item.approved_at,
  }));

  const mappedParticipants: CanonicalParticipant[] = (participants ?? []).map((item: any) => ({
    id: item.id,
    relationship: item.relationship,
    legalName: item.legal_name,
    dateOfBirth: typeof item.metadata?.date_of_birth === "string" ? item.metadata.date_of_birth : null,
    metadata: item.metadata ?? {},
  }));

  const values: Record<string, string> = {};
  const principal = mappedParticipants.find((item) => item.relationship === "principal_applicant");
  const principalName = principal?.legalName ?? (clientRecord as any).legal_name;
  const nameParts = normalizeNameParts(principalName);

  values["person.principal.legal_name"] = principalName;
  values["person.principal.given_names"] = nameParts.givenNames;
  values["person.principal.last_name"] = nameParts.lastName;
  values["person.principal.language_preference"] = String((clientRecord as any).language ?? "english").toLowerCase();
  values["person.principal.email"] = String((clientRecord as any).email ?? "");
  values["person.principal.phone"] = String((clientRecord as any).phone ?? "");

  for (const participant of mappedParticipants) {
    values[`participant.${participant.id}.legal_name`] = participant.legalName;
    values[`participant.${participant.id}.relationship`] = participant.relationship;
    if (participant.dateOfBirth) values[`participant.${participant.id}.date_of_birth`] = participant.dateOfBirth;
  }

  const intakeAnswers = (intakeResponse as any)?.answers ?? {};
  flattenAnswers("intake", intakeAnswers, values);

  for (const fact of approvedFacts) {
    values[`fact.${fact.key}`] = fact.value;
    if (fact.key === "legal_name") values["person.principal.legal_name"] = fact.value;
    if (fact.key === "date_of_birth") values["person.principal.date_of_birth"] = fact.value;
    if (fact.key === "passport_number") values["person.principal.passport_number"] = fact.value;
    if (fact.key === "uci") values["person.principal.uci"] = fact.value;
    if (fact.key === "marital_status") values["person.principal.marital_status"] = fact.value;
    if (fact.key === "country_of_birth") values["person.principal.country_of_birth"] = fact.value;
    if (fact.key === "birth_city") values["person.principal.birth_city"] = fact.value;
    if (fact.key === "nationality") values["person.principal.nationality"] = fact.value;
    if (fact.key === "representative_name") values["representation.representative_name"] = fact.value;
    if (fact.key === "representative_email") values["representation.representative_email"] = fact.value;
    if (fact.key === "has_representative") values["representation.has_representative"] = fact.value;
  }

  const warnings: string[] = [];
  if (approvedFacts.length === 0) {
    warnings.push("No practitioner-approved CaseFacts were found.");
  }
  if (!intakeResponse) {
    warnings.push("No intake response was found for this case.");
  } else {
    const completionStatus = (intakeResponse as any).completion_status;
    if (completionStatus !== "reviewed") {
      warnings.push("Intake response is not marked as reviewed; data may require additional practitioner confirmation.");
    }
  }

  return {
    caseId,
    streamKey: (caseRecord as any).stream_key,
    client: {
      id: (clientRecord as any).id,
      legalName: (clientRecord as any).legal_name,
      email: (clientRecord as any).email,
      phone: (clientRecord as any).phone,
      language: (clientRecord as any).language,
    },
    intake: {
      responseId: (intakeResponse as any)?.id ?? null,
      completionStatus: (intakeResponse as any)?.completion_status ?? null,
      reviewedAt: (intakeResponse as any)?.reviewed_at ?? null,
      answers: intakeAnswers,
    },
    participants: mappedParticipants,
    approvedFacts,
    values,
    provenance: {
      sourceFactIds: approvedFacts.map((item) => item.id),
      participantIds: mappedParticipants.map((item) => item.id),
      intakeResponseId: (intakeResponse as any)?.id ?? null,
      clientId: (clientRecord as any).id,
    },
    warnings,
  };
}
