"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageState } from "@/components/ui/PageState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import {
  getClientById,
  mockCaseParticipants,
  mockCaseRecords,
  mockActivities,
  getUserNameById,
  type ClientLifecycleStatus,
} from "@/lib/mock/case-management";
import { formatIsoDate } from "@/lib/mock/case-management";

const clientStatusTone: Record<ClientLifecycleStatus, { label: string; tone: "success" | "warning" | "danger" }> = {
  active: { label: "Active", tone: "success" },
  onboarding: { label: "Onboarding", tone: "warning" },
  attention: { label: "Needs Attention", tone: "danger" },
};

export default function ClientDetailPage() {
  const params = useParams<{ clientId: string }>();
  const clientId = params.clientId;
  const [status, setStatus] = useState<"ready" | "loading" | "empty" | "error">("ready");
  const { showToast } = useToast();

  const client = getClientById(clientId);
  const associatedCases = useMemo(
    () => mockCaseRecords.filter((record) => record.clientId === clientId),
    [clientId],
  );
  const caseIds = new Set(associatedCases.map((record) => record.id));
  const participants = mockCaseParticipants.filter((participant) => caseIds.has(participant.caseId));
  const recentActivity = mockActivities
    .filter((activity) =>
      (activity.entityType === "client" && activity.entityId === clientId) ||
      (activity.entityType === "case" && caseIds.has(activity.entityId)),
    )
    .slice(0, 6);

  if (!client) {
    return (
      <PageContainer
        title="Client"
        description="Client details"
      >
        <PageState
          status="empty"
          emptyTitle="Client not found"
          emptyDescription="This mock client does not exist in the current in-memory dataset."
        >
          <div />
        </PageState>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={client.legalName}
      description="Client profile summary, associated cases, participants, and activity."
      actions={
        <Button
          variant="secondary"
          onClick={() =>
            showToast({
              title: "Edit Client (Mock)",
              description: "This is a placeholder action and does not persist.",
              tone: "info",
            })
          }
        >
          Edit Client
        </Button>
      }
    >
      <PageState
        status={status}
        onStatusChange={setStatus}
        emptyTitle="No client data"
        emptyDescription="This client does not have profile data yet."
        errorDescription="Unable to load client details right now."
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Client Profile Summary</CardTitle>
              <CardDescription>Primary profile and contact information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
              <div className="flex items-center justify-between">
                <p className="font-medium text-neutral-800 dark:text-neutral-200">Status</p>
                <StatusChip label={clientStatusTone[client.status].label} tone={clientStatusTone[client.status].tone} />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <p><span className="font-medium text-neutral-700 dark:text-neutral-300">Email:</span> {client.email}</p>
                <p><span className="font-medium text-neutral-700 dark:text-neutral-300">Phone:</span> {client.phone}</p>
                <p><span className="font-medium text-neutral-700 dark:text-neutral-300">Language:</span> {client.language}</p>
                <p><span className="font-medium text-neutral-700 dark:text-neutral-300">Active cases:</span> {associatedCases.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Participants</CardTitle>
              <CardDescription>Dependants and related profiles.</CardDescription>
            </CardHeader>
            <CardContent>
              {participants.length === 0 ? (
                <p className="text-sm text-neutral-500 dark:text-neutral-400">No participants linked yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {participants.map((participant) => (
                    <li key={participant.id} className="rounded-lg border border-neutral-100 px-3 py-2 dark:border-neutral-800">
                      <p className="font-medium text-neutral-800 dark:text-neutral-200">{participant.legalName}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">{participant.relationship.replace("_", " ")}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Associated Cases</CardTitle>
              <CardDescription>Cases linked to this client profile.</CardDescription>
            </CardHeader>
            <CardContent>
              {associatedCases.length === 0 ? (
                <p className="text-sm text-neutral-500 dark:text-neutral-400">No cases linked to this client yet.</p>
              ) : (
                <ul className="space-y-2">
                  {associatedCases.map((record) => (
                    <li key={record.id} className="flex items-center justify-between gap-2 rounded-lg border border-neutral-100 px-3 py-2 dark:border-neutral-800">
                      <div>
                        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{record.title}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{record.streamLabel}</p>
                      </div>
                      <div className="text-right text-xs text-neutral-500 dark:text-neutral-400">
                        <p>Practitioner: {getUserNameById(record.assignedPractitionerId)}</p>
                        <Link href={`/cases/${record.id}`} className="focus-ring rounded text-brand-600 hover:text-brand-700">
                          Open case
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates for this client and their cases.</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-neutral-500 dark:text-neutral-400">No recent activity found.</p>
              ) : (
                <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                  {recentActivity.map((activity) => (
                    <li key={activity.id} className="rounded-lg border border-neutral-100 px-3 py-2 dark:border-neutral-800">
                      <p>{activity.text}</p>
                      <p className="mt-1 text-xs text-neutral-400">{formatIsoDate(activity.at)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </PageState>
    </PageContainer>
  );
}
