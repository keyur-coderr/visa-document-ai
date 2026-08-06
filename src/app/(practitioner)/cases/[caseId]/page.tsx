"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getStreamConfig } from "@/config/streams";
import type { ChecklistItemStatus } from "@/config/streams/types";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageState } from "@/components/ui/PageState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/StatusChip";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FormField, FormLabel, FormSelect, FormTextarea } from "@/components/ui/Form";
import { MilestoneStepper } from "@/components/cases/MilestoneStepper";
import { useToast } from "@/components/ui/ToastProvider";
import { buildCaseChecklistSummary } from "@/lib/checklist/engine";
import { caseStatusPresentation, type StatusTone } from "@/lib/utilities/status";
import {
  getCaseById,
  getClientById,
  getUserNameById,
  milestoneOrder,
  mockActivities,
  mockCaseNotesByCaseId,
  mockCaseFlags,
  mockChecklistStatusByCaseId,
  mockDocumentStatusByCaseId,
  mockCaseParticipants,
  mockDeadlines,
  mockFormStatusByCaseId,
  mockTeamUsers,
  formatIsoDate,
} from "@/lib/mock/case-management";
import type { MilestoneKey } from "@/types/domain";

const milestoneLabel: Record<MilestoneKey, string> = {
  intake: "Intake",
  documents_complete: "Documents Complete",
  forms_ready: "Forms Ready",
  submitted: "Submitted",
  awaiting_decision: "Awaiting Decision",
  decision_received: "Decision Received",
};

type CaseDetailTab = "overview" | "checklist" | "forms" | "documents" | "timeline" | "notes";

const tabOptions: Array<{ key: CaseDetailTab; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "checklist", label: "Checklist" },
  { key: "forms", label: "Forms" },
  { key: "documents", label: "Documents" },
  { key: "timeline", label: "Timeline" },
  { key: "notes", label: "Notes" },
];

const checklistStatusPresentation: Record<ChecklistItemStatus, { label: string; tone: StatusTone }> = {
  required: { label: "Required", tone: "danger" },
  optional: { label: "Optional", tone: "neutral" },
  pending: { label: "Pending", tone: "warning" },
  uploaded: { label: "Uploaded", tone: "info" },
  missing: { label: "Missing", tone: "danger" },
  approved: { label: "Approved", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
  needs_review: { label: "Needs Review", tone: "warning" },
};

const formStatusPresentation = {
  not_started: { label: "Not Started", tone: "neutral" as const },
  in_progress: { label: "In Progress", tone: "info" as const },
  completed: { label: "Completed", tone: "brand" as const },
  approved: { label: "Approved", tone: "success" as const },
};

const documentStatusPresentation = {
  pending: { label: "Pending", tone: "warning" as const },
  uploaded: { label: "Uploaded", tone: "info" as const },
  approved: { label: "Approved", tone: "success" as const },
  rejected: { label: "Rejected", tone: "danger" as const },
  needs_review: { label: "Needs Review", tone: "warning" as const },
};

function participantScopeLabel(scope: "applicant" | "spouse" | "children"): string {
  if (scope === "applicant") return "Applicant";
  if (scope === "spouse") return "Spouse";
  return "Children";
}

export default function CaseDetailPage() {
  const params = useParams<{ caseId: string }>();
  const caseId = params.caseId;
  const { showToast } = useToast();

  const caseRecord = getCaseById(caseId);
  const client = caseRecord ? getClientById(caseRecord.clientId) : undefined;

  const [currentMilestone, setCurrentMilestone] = useState<MilestoneKey>(
    caseRecord?.currentMilestone ?? "intake",
  );
  const [assistantId, setAssistantId] = useState<string>(caseRecord?.assignedAssistantId ?? "none");
  const [activeTab, setActiveTab] = useState<CaseDetailTab>("overview");
  const [draftNote, setDraftNote] = useState<string>("");
  const [localNotes, setLocalNotes] = useState<string[]>([]);

  const deadlines = useMemo(() => mockDeadlines.filter((deadline) => deadline.caseId === caseId), [caseId]);
  const flags = useMemo(() => mockCaseFlags.filter((flag) => flag.caseId === caseId), [caseId]);
  const participants = useMemo(
    () => mockCaseParticipants.filter((participant) => participant.caseId === caseId),
    [caseId],
  );
  const activities = useMemo(
    () => mockActivities.filter((activity) => activity.entityType === "case" && activity.entityId === caseId),
    [caseId],
  );
  const assistants = mockTeamUsers.filter((user) => user.role === "assistant");

  if (!caseRecord) {
    return (
      <PageContainer title="Case" description="Case details">
        <PageState
          status="empty"
          emptyTitle="Case not found"
          emptyDescription="This mock case does not exist in the current in-memory dataset."
        >
          <div />
        </PageState>
      </PageContainer>
    );
  }

  const status = caseStatusPresentation[caseRecord.status];
  const streamConfig = getStreamConfig(caseRecord.streamKey);
  const checklistSummary = buildCaseChecklistSummary(
    streamConfig,
    mockChecklistStatusByCaseId[caseRecord.id],
  );
  const formStatuses = mockFormStatusByCaseId[caseRecord.id] ?? {};
  const documentStatuses = mockDocumentStatusByCaseId[caseRecord.id] ?? {};
  const notes = [...(mockCaseNotesByCaseId[caseRecord.id] ?? []), ...localNotes];

  return (
    <PageContainer
      title={caseRecord.title}
      description="Stream-configured intake, checklist, forms, documents, timeline, and notes."
      actions={
        <Link href="/cases/new" className="focus-ring rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-700">
          Create New Case
        </Link>
      }
    >
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>Case Header</CardTitle>
              <StatusChip label={status.label} tone={status.tone} />
            </div>
            <CardDescription>
              {client?.legalName ?? "Unknown client"} · {caseRecord.streamLabel}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <MilestoneStepper milestones={milestoneOrder} current={currentMilestone} />

            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                <span>Overall completion</span>
                <span>{caseRecord.progressPercent}%</span>
              </div>
              <div className="h-2 rounded-full bg-neutral-100 dark:bg-neutral-800">
                <div className="h-2 rounded-full bg-brand-600" style={{ width: `${caseRecord.progressPercent}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm text-neutral-600 dark:text-neutral-400">
              <p><span className="font-medium text-neutral-700 dark:text-neutral-300">Checklist:</span> {caseRecord.checklistCompleted}/{caseRecord.checklistTotal}</p>
              <p><span className="font-medium text-neutral-700 dark:text-neutral-300">Documents:</span> {caseRecord.documentCount}</p>
              <p><span className="font-medium text-neutral-700 dark:text-neutral-300">Exhibits:</span> {caseRecord.exhibitCount}</p>
              <p><span className="font-medium text-neutral-700 dark:text-neutral-300">Pending approvals:</span> {caseRecord.pendingApprovals}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-lg border border-neutral-100 px-3 py-2 dark:border-neutral-800">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Checklist Completion</p>
                <p className="text-base font-semibold text-neutral-800 dark:text-neutral-100">{checklistSummary.metrics.completionPercent}%</p>
              </div>
              <div className="rounded-lg border border-neutral-100 px-3 py-2 dark:border-neutral-800">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Required Remaining</p>
                <p className="text-base font-semibold text-neutral-800 dark:text-neutral-100">{checklistSummary.metrics.requiredRemaining}</p>
              </div>
              <div className="rounded-lg border border-neutral-100 px-3 py-2 dark:border-neutral-800">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Optional Remaining</p>
                <p className="text-base font-semibold text-neutral-800 dark:text-neutral-100">{checklistSummary.metrics.optionalRemaining}</p>
              </div>
              <div className="rounded-lg border border-neutral-100 px-3 py-2 dark:border-neutral-800">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Needs Review</p>
                <p className="text-base font-semibold text-neutral-800 dark:text-neutral-100">{checklistSummary.metrics.needsReviewCount}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField>
                <FormLabel htmlFor="milestone-select">Update mock milestone</FormLabel>
                <FormSelect
                  id="milestone-select"
                  value={currentMilestone}
                  onChange={(event) => setCurrentMilestone(event.target.value as MilestoneKey)}
                >
                  {milestoneOrder.map((milestone) => (
                    <option key={milestone} value={milestone}>{milestoneLabel[milestone]}</option>
                  ))}
                </FormSelect>
              </FormField>
              <div className="flex items-end">
                <Button
                  onClick={() =>
                    showToast({
                      title: "Mock milestone updated",
                      description: `Milestone set to ${milestoneLabel[currentMilestone]} in local state only.`,
                      tone: "info",
                    })
                  }
                >
                  Save Milestone
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assigned Team</CardTitle>
            <CardDescription>Practitioner and assistant assignment.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              <span className="font-medium text-neutral-700 dark:text-neutral-300">Practitioner:</span>{" "}
              {getUserNameById(caseRecord.assignedPractitionerId)}
            </p>
            <FormField>
              <FormLabel htmlFor="assistant-select">Assign assistant (mock)</FormLabel>
              <FormSelect id="assistant-select" value={assistantId} onChange={(event) => setAssistantId(event.target.value)}>
                <option value="none">Unassigned</option>
                {assistants.map((assistant) => (
                  <option key={assistant.id} value={assistant.id}>{assistant.fullName}</option>
                ))}
              </FormSelect>
            </FormField>
            <Button
              variant="secondary"
              onClick={() =>
                showToast({
                  title: "Mock assistant assignment updated",
                  description: assistantId === "none" ? "Assistant removed in local state." : `${getUserNameById(assistantId)} assigned in local state.`,
                  tone: "info",
                })
              }
            >
              Save Assignment
            </Button>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Mock-only operation. No backend persistence.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Case Workspace</CardTitle>
            <CardDescription>All tabs are derived from stream configuration and mock case state.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {tabOptions.map((tab) => {
                const isActive = tab.key === activeTab;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={
                      isActive
                        ? "focus-ring rounded-md border border-brand-300 bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 dark:border-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                        : "focus-ring rounded-md border border-neutral-200 px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    }
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {activeTab === "overview" && (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Deadlines</CardTitle>
                    <CardDescription>Nearest due items for this case.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {deadlines.length === 0 ? (
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">No upcoming deadlines.</p>
                    ) : (
                      <ul className="space-y-2">
                        {deadlines.map((deadline) => (
                          <li key={deadline.id} className="rounded-lg border border-neutral-100 px-3 py-2 text-sm dark:border-neutral-800">
                            <p className="font-medium text-neutral-800 dark:text-neutral-200">{deadline.label}</p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">Due {formatIsoDate(deadline.dueDate)}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Unresolved Flags</CardTitle>
                    <CardDescription>Flags requiring team attention.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {flags.length === 0 ? (
                      <Badge tone="success">No unresolved flags</Badge>
                    ) : (
                      <ul className="space-y-2">
                        {flags.map((flag) => (
                          <li key={flag.id} className="rounded-lg border border-danger-100 bg-danger-50 px-3 py-2 text-sm text-danger-700 dark:border-danger-500/20 dark:bg-danger-500/10 dark:text-danger-500">
                            {flag.title}
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Participants</CardTitle>
                    <CardDescription>Applicant and dependants.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {participants.length === 0 ? (
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">No participants listed yet.</p>
                    ) : (
                      <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                        {participants.map((participant) => (
                          <li key={participant.id} className="rounded-lg border border-neutral-100 px-3 py-2 dark:border-neutral-800">
                            <p className="font-medium text-neutral-800 dark:text-neutral-200">{participant.legalName}</p>
                            <p className="text-xs">{participant.relationship.replace("_", " ")}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "checklist" && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge tone="brand">Completion {checklistSummary.metrics.completionPercent}%</Badge>
                  <Badge tone="danger">Required remaining {checklistSummary.metrics.requiredRemaining}</Badge>
                  <Badge tone="neutral">Optional remaining {checklistSummary.metrics.optionalRemaining}</Badge>
                  <Badge tone="warning">Needs review {checklistSummary.metrics.needsReviewCount}</Badge>
                </div>
                {checklistSummary.groups.map((group) => (
                  <Card key={group.key}>
                    <CardHeader>
                      <CardTitle>{group.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {group.items.map((item) => {
                          const requirement = checklistStatusPresentation[item.requirement];
                          const statusPresentation = checklistStatusPresentation[item.status];
                          return (
                            <li key={item.key} className="flex flex-col gap-2 rounded-lg border border-neutral-100 px-3 py-2 text-sm dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="font-medium text-neutral-800 dark:text-neutral-200">{item.label}</p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">Applies to {participantScopeLabel(item.appliesTo)}</p>
                              </div>
                              <div className="flex gap-2">
                                <Badge tone={requirement.tone}>{requirement.label}</Badge>
                                <Badge tone={statusPresentation.tone}>{statusPresentation.label}</Badge>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {activeTab === "forms" && (
              <div className="space-y-3">
                {streamConfig.forms.map((form) => {
                  const statusKey = formStatuses[form.key] ?? "not_started";
                  const presentation = formStatusPresentation[statusKey];
                  return (
                    <div key={form.key} className="flex flex-col gap-2 rounded-lg border border-neutral-100 px-3 py-2 text-sm dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-neutral-800 dark:text-neutral-200">{form.label}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Form key: {form.key}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge tone={form.required ? "danger" : "neutral"}>{form.required ? "Required" : "Optional"}</Badge>
                        <Badge tone={presentation.tone}>{presentation.label}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === "documents" && (
              <div className="space-y-3">
                {[...streamConfig.requiredDocuments, ...streamConfig.optionalDocuments].map((documentName) => {
                  const isRequired = streamConfig.requiredDocuments.includes(documentName);
                  const statusKey = documentStatuses[documentName] ?? "pending";
                  const presentation = documentStatusPresentation[statusKey];
                  return (
                    <div key={documentName} className="flex flex-col gap-2 rounded-lg border border-neutral-100 px-3 py-2 text-sm dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between">
                      <p className="font-medium text-neutral-800 dark:text-neutral-200">{documentName}</p>
                      <div className="flex gap-2">
                        <Badge tone={isRequired ? "danger" : "neutral"}>{isRequired ? "Required" : "Optional"}</Badge>
                        <Badge tone={presentation.tone}>{presentation.label}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === "timeline" && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Milestone Path</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {streamConfig.milestones.map((milestone) => {
                        const reached = milestoneOrder.indexOf(currentMilestone) >= milestoneOrder.indexOf(milestone);
                        return (
                          <li key={milestone} className="flex items-center justify-between rounded-lg border border-neutral-100 px-3 py-2 dark:border-neutral-800">
                            <span className="text-neutral-700 dark:text-neutral-300">{milestoneLabel[milestone]}</span>
                            <Badge tone={reached ? "success" : "neutral"}>{reached ? "Reached" : "Upcoming"}</Badge>
                          </li>
                        );
                      })}
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Review Stages & Deadlines</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Review stages</p>
                      <ul className="space-y-2 text-sm">
                        {streamConfig.reviewStages.map((stage) => (
                          <li key={stage} className="rounded-lg border border-neutral-100 px-3 py-2 dark:border-neutral-800">
                            {stage.replaceAll("_", " ")}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Stream deadlines</p>
                      <ul className="space-y-2 text-sm">
                        {streamConfig.deadlines.map((deadline) => (
                          <li key={deadline.key} className="rounded-lg border border-neutral-100 px-3 py-2 dark:border-neutral-800">
                            <p className="font-medium text-neutral-800 dark:text-neutral-200">{deadline.label}</p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">Target: {milestoneLabel[deadline.targetMilestone]} · +{deadline.targetDaysFromCaseOpen} days</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Recent Case Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {activities.length === 0 ? (
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">No recent activity.</p>
                    ) : (
                      <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                        {activities.map((activity) => (
                          <li key={activity.id} className="rounded-lg border border-neutral-100 px-3 py-2 dark:border-neutral-800">
                            <p>{activity.text}</p>
                            <p className="text-xs text-neutral-400">{formatIsoDate(activity.at)}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "notes" && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Case Notes</CardTitle>
                    <CardDescription>Internal notes are mock-only and local to this browser session.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <FormField>
                      <FormLabel htmlFor="note-input">Add mock note</FormLabel>
                      <FormTextarea
                        id="note-input"
                        placeholder="Write a case note..."
                        value={draftNote}
                        onChange={(event) => setDraftNote(event.target.value)}
                      />
                    </FormField>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        if (!draftNote.trim()) return;
                        setLocalNotes((existing) => [draftNote.trim(), ...existing]);
                        setDraftNote("");
                        showToast({
                          title: "Mock note saved",
                          description: "The note was added to local state only.",
                          tone: "info",
                        });
                      }}
                    >
                      Save Note
                    </Button>
                  </CardContent>
                </Card>

                {notes.length === 0 ? (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">No notes available for this case.</p>
                ) : (
                  <ul className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
                    {notes.map((note, index) => (
                      <li key={`${note}-${index}`} className="rounded-lg border border-neutral-100 px-3 py-2 dark:border-neutral-800">
                        {note}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2 text-xs text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
              Stream config in use: {streamConfig.streamName}. Derived requirements: {streamConfig.requiredDocuments.length} required docs, {streamConfig.optionalDocuments.length} optional docs, {streamConfig.forms.length} forms.
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
