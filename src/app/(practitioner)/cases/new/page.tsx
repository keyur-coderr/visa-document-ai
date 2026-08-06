"use client";

import { useMemo, useState } from "react";
import { PageContainer } from "@/components/ui/PageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormField, FormInput, FormLabel, FormSelect } from "@/components/ui/Form";
import { useToast } from "@/components/ui/ToastProvider";
import {
  mockClients,
  mockTeamUsers,
  phase1Streams,
  getUserNameById,
} from "@/lib/mock/case-management";

const steps = [
  "Client",
  "Stream",
  "Participants",
  "Assignments",
  "Review",
] as const;

export default function CreateCasePage() {
  const [step, setStep] = useState(0);
  const [useNewClient, setUseNewClient] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(mockClients[0]?.id ?? "");
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [streamKey, setStreamKey] = useState(phase1Streams[0]?.key ?? "express-entry-fswp");
  const [primaryApplicantName, setPrimaryApplicantName] = useState("");
  const [participantName, setParticipantName] = useState("");
  const [participantRelationship, setParticipantRelationship] = useState("spouse");
  const [participants, setParticipants] = useState<Array<{ name: string; relationship: string }>>([]);
  const [practitionerId, setPractitionerId] = useState(
    mockTeamUsers.find((user) => user.role === "practitioner")?.id ?? "",
  );
  const [assistantId, setAssistantId] = useState<string>("none");
  const [createdCaseId, setCreatedCaseId] = useState<string | null>(null);
  const { showToast } = useToast();

  const practitionerOptions = mockTeamUsers.filter((user) => user.role === "practitioner");
  const assistantOptions = mockTeamUsers.filter((user) => user.role === "assistant");

  const selectedClient = mockClients.find((client) => client.id === selectedClientId);
  const selectedStream = phase1Streams.find((stream) => stream.key === streamKey);

  const canAdvance = useMemo(() => {
    if (step === 0) {
      return useNewClient ? newClientName.trim().length > 0 : selectedClientId.length > 0;
    }
    if (step === 1) return streamKey.length > 0;
    if (step === 2) return primaryApplicantName.trim().length > 0;
    if (step === 3) return practitionerId.length > 0;
    return true;
  }, [step, useNewClient, newClientName, selectedClientId, streamKey, primaryApplicantName, practitionerId]);

  const addParticipant = () => {
    if (!participantName.trim()) return;
    setParticipants((current) => [...current, { name: participantName.trim(), relationship: participantRelationship }]);
    setParticipantName("");
  };

  const createMockCase = () => {
    const id = `case_mock_${Date.now()}`;
    setCreatedCaseId(id);
    showToast({
      title: "Mock case created",
      description: "Case creation is in-memory only and does not persist after refresh.",
      tone: "success",
    });
  };

  return (
    <PageContainer
      title="Create Case"
      description="Phase 2 mock workflow: create a case in browser memory only."
    >
      <Card>
        <CardHeader>
          <CardTitle>Case Creation Steps</CardTitle>
          <CardDescription>
            Mock-only operation. This does not write to a database.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <ol className="grid grid-cols-2 gap-2 md:grid-cols-5" aria-label="Create case progress">
            {steps.map((label, index) => (
              <li
                key={label}
                className={`rounded-lg border px-3 py-2 text-xs font-medium ${index <= step
                  ? "border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-800 dark:bg-brand-900/30 dark:text-brand-300"
                  : "border-neutral-200 bg-neutral-50 text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400"}`}
              >
                {index + 1}. {label}
              </li>
            ))}
          </ol>

          {step === 0 ? (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button variant={useNewClient ? "secondary" : "primary"} onClick={() => setUseNewClient(false)}>
                  Select Existing Client
                </Button>
                <Button variant={useNewClient ? "primary" : "secondary"} onClick={() => setUseNewClient(true)}>
                  Create Basic Client
                </Button>
              </div>

              {!useNewClient ? (
                <FormField>
                  <FormLabel htmlFor="existing-client">Existing client</FormLabel>
                  <FormSelect
                    id="existing-client"
                    value={selectedClientId}
                    onChange={(event) => setSelectedClientId(event.target.value)}
                  >
                    {mockClients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.legalName}
                      </option>
                    ))}
                  </FormSelect>
                </FormField>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <FormField>
                    <FormLabel htmlFor="new-client-name">Client name</FormLabel>
                    <FormInput
                      id="new-client-name"
                      value={newClientName}
                      onChange={(event) => setNewClientName(event.target.value)}
                      placeholder="Legal name"
                    />
                  </FormField>
                  <FormField>
                    <FormLabel htmlFor="new-client-email">Client email</FormLabel>
                    <FormInput
                      id="new-client-email"
                      type="email"
                      value={newClientEmail}
                      onChange={(event) => setNewClientEmail(event.target.value)}
                      placeholder="name@email.com"
                    />
                  </FormField>
                </div>
              )}
            </div>
          ) : null}

          {step === 1 ? (
            <FormField>
              <FormLabel htmlFor="stream">Immigration stream</FormLabel>
              <FormSelect id="stream" value={streamKey} onChange={(event) => setStreamKey(event.target.value)}>
                {phase1Streams.map((stream) => (
                  <option key={stream.key} value={stream.key}>
                    {stream.label}
                  </option>
                ))}
              </FormSelect>
            </FormField>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <FormField>
                <FormLabel htmlFor="primary-applicant">Primary applicant</FormLabel>
                <FormInput
                  id="primary-applicant"
                  value={primaryApplicantName}
                  onChange={(event) => setPrimaryApplicantName(event.target.value)}
                  placeholder="Primary applicant full name"
                />
              </FormField>

              <div className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Add participant or dependant</p>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <FormInput
                    value={participantName}
                    onChange={(event) => setParticipantName(event.target.value)}
                    placeholder="Participant name"
                  />
                  <FormSelect value={participantRelationship} onChange={(event) => setParticipantRelationship(event.target.value)}>
                    <option value="spouse">Spouse</option>
                    <option value="common_law_partner">Common-law partner</option>
                    <option value="dependant_child">Dependant child</option>
                    <option value="sponsor">Sponsor</option>
                    <option value="other_family_member">Other family member</option>
                  </FormSelect>
                  <Button variant="secondary" onClick={addParticipant}>Add</Button>
                </div>

                <ul className="mt-3 space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                  {participants.length === 0 ? <li>No additional participants added yet.</li> : null}
                  {participants.map((participant, index) => (
                    <li key={`${participant.name}-${index}`} className="rounded bg-neutral-50 px-2 py-1 dark:bg-neutral-900">
                      {participant.name} · {participant.relationship.replace("_", " ")}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField>
                <FormLabel htmlFor="practitioner">Assigned practitioner</FormLabel>
                <FormSelect
                  id="practitioner"
                  value={practitionerId}
                  onChange={(event) => setPractitionerId(event.target.value)}
                >
                  {practitionerOptions.map((user) => (
                    <option key={user.id} value={user.id}>{user.fullName}</option>
                  ))}
                </FormSelect>
              </FormField>
              <FormField>
                <FormLabel htmlFor="assistant">Assigned assistant (optional)</FormLabel>
                <FormSelect id="assistant" value={assistantId} onChange={(event) => setAssistantId(event.target.value)}>
                  <option value="none">No assistant</option>
                  {assistantOptions.map((user) => (
                    <option key={user.id} value={user.id}>{user.fullName}</option>
                  ))}
                </FormSelect>
              </FormField>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-3 rounded-lg border border-neutral-200 p-4 text-sm dark:border-neutral-800">
              <p><span className="font-medium text-neutral-800 dark:text-neutral-200">Client:</span> {useNewClient ? newClientName || "New client" : selectedClient?.legalName}</p>
              <p><span className="font-medium text-neutral-800 dark:text-neutral-200">Stream:</span> {selectedStream?.label}</p>
              <p><span className="font-medium text-neutral-800 dark:text-neutral-200">Primary applicant:</span> {primaryApplicantName || "Not provided"}</p>
              <p><span className="font-medium text-neutral-800 dark:text-neutral-200">Participants:</span> {participants.length}</p>
              <p><span className="font-medium text-neutral-800 dark:text-neutral-200">Practitioner:</span> {getUserNameById(practitionerId)}</p>
              <p><span className="font-medium text-neutral-800 dark:text-neutral-200">Assistant:</span> {assistantId === "none" ? "Unassigned" : getUserNameById(assistantId)}</p>

              <Button onClick={createMockCase}>Create Mock Case</Button>
            </div>
          ) : null}

          {createdCaseId ? (
            <div className="rounded-lg border border-success-200 bg-success-50 p-3 text-sm text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-500">
              Mock case created: {createdCaseId}. This in-memory record is for Phase 2 interaction only and is not persisted.
            </div>
          ) : null}

          <div className="flex items-center justify-between">
            <Button variant="secondary" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0}>
              Back
            </Button>
            {step < steps.length - 1 ? (
              <Button onClick={() => setStep((current) => current + 1)} disabled={!canAdvance}>
                Next
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
