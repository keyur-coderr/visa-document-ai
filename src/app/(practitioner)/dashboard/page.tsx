"use client";

import { useEffect, useState } from "react";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageState, useDemoPageState } from "@/components/ui/PageState";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/StatusChip";
import {
  dashboardKpis,
  recentActivity,
  aiProcessingSummary,
  documentStatSummary,
} from "@/lib/mock/dashboard";
import { mockCases } from "@/lib/mock/cases";
import { caseStatusPresentation } from "@/lib/utilities/status";
import { DashboardIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";

interface LifecycleWidgets {
  upcomingDeadlines: Array<{ id: string; title: string; dueAt: string | null; priority: string }>;
  todaysReminders: number;
  overdueTasks: Array<{ id: string; title: string; dueAt: string | null; priority: string }>;
  waitingForClient: number;
  waitingForConsultant: number;
  recentlyUpdatedCases: Array<{ caseId: string; title: string; updatedAt: string }>;
  recentNotifications: Array<{ id: string; title: string; status: string; createdAt: string }>;
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return "just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.round(diffHours / 24)}d ago`;
}

export default function DashboardPage() {
  const [status, setStatus] = useDemoPageState("ready");
  const summaryCases = mockCases.slice(0, 4);
  const { showToast, clearToasts } = useToast();
  const [widgets, setWidgets] = useState<LifecycleWidgets | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch("/api/dashboard/lifecycle-widgets", { method: "GET" });
        const payload = await response.json();
        if (!active || !response.ok || !payload.ok) return;
        setWidgets(payload.widgets as LifecycleWidgets);
      } catch {
        // Keep the existing dashboard sections visible if lifecycle widgets fail to load.
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <PageContainer
      title="Dashboard"
      description="A firm-wide overview of active cases, recent activity, and AI processing status."
      actions={
        <>
          <Button
            variant="secondary"
            onClick={() =>
              showToast({
                title: "Toast System Active",
                description: "This is a Phase 1 UI notification placeholder.",
                tone: "info",
              })
            }
          >
            Show Toast
          </Button>
          <Button variant="ghost" onClick={clearToasts}>
            Clear
          </Button>
        </>
      }
    >
      <PageState
        status={status}
        onStatusChange={setStatus}
        emptyTitle="No dashboard data yet"
        emptyDescription="Once cases and documents are added, your firm's activity will appear here."
        errorDescription="We couldn't load dashboard data. Try again in a moment."
        skeletonVariant="card"
      >
        <div className="flex flex-col gap-6">
          <section aria-label="Key performance indicators" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {dashboardKpis.map((kpi) => (
              <StatCard
                key={kpi.id}
                label={kpi.label}
                value={kpi.value}
                delta={kpi.delta}
                deltaTone={kpi.deltaTone}
                icon={<DashboardIcon className="h-4 w-4" />}
              />
            ))}
          </section>

          <section aria-label="Case summaries" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Case Summary</CardTitle>
                <CardDescription>Your most recently updated cases.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {summaryCases.map((caseItem) => {
                  const presentation = caseStatusPresentation[caseItem.status];
                  return (
                    <div
                      key={caseItem.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-neutral-100 px-3 py-2.5 dark:border-neutral-800"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-200">{caseItem.title}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{caseItem.assignedTo}</p>
                      </div>
                      <StatusChip label={presentation.label} tone={presentation.tone} />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest actions across your firm's cases.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {recentActivity.map((item) => (
                    <li key={item.id} className="flex gap-3 text-sm">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
                      <p className="text-neutral-600 dark:text-neutral-400">
                        <span className="font-medium text-neutral-800 dark:text-neutral-200">{item.actor}</span>{" "}
                        {item.action}{" "}
                        <span className="font-medium text-neutral-800 dark:text-neutral-200">{item.target}</span>
                        <span className="ml-2 text-xs text-neutral-400">{formatRelativeTime(item.timestamp)}</span>
                      </p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>

          <section aria-label="AI processing and document statistics" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>AI Processing Summary</CardTitle>
                <CardDescription>Extraction and classification job status (placeholder data).</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Queued</p>
                  <p className="mt-1 text-lg font-semibold text-neutral-900 dark:text-neutral-100">{aiProcessingSummary.queued}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Running</p>
                  <p className="mt-1 text-lg font-semibold text-neutral-900 dark:text-neutral-100">{aiProcessingSummary.running}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Completed Today</p>
                  <p className="mt-1 text-lg font-semibold text-success-600 dark:text-success-500">
                    {aiProcessingSummary.completedToday}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Failed Today</p>
                  <p className="mt-1 text-lg font-semibold text-danger-600 dark:text-danger-500">
                    {aiProcessingSummary.failedToday}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Document Statistics</CardTitle>
                <CardDescription>Upload and review status across all cases (placeholder data).</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Total</p>
                  <p className="mt-1 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    {documentStatSummary.totalDocuments}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Needs Review</p>
                  <p className="mt-1 text-lg font-semibold text-warning-600 dark:text-warning-500">
                    {documentStatSummary.needsReview}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Approved This Week</p>
                  <p className="mt-1 text-lg font-semibold text-success-600 dark:text-success-500">
                    {documentStatSummary.approvedThisWeek}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Avg. Confidence</p>
                  <p className="mt-1 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    {Math.round(documentStatSummary.averageConfidence * 100)}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          <section aria-label="Lifecycle workflow widgets" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Deadlines</CardTitle>
                <CardDescription>Nearest due workflow tasks.</CardDescription>
              </CardHeader>
              <CardContent>
                {widgets?.upcomingDeadlines?.length ? (
                  <ul className="space-y-2">
                    {widgets.upcomingDeadlines.map((item) => (
                      <li key={item.id} className="rounded-lg border border-neutral-100 px-3 py-2 text-sm dark:border-neutral-800">
                        <p className="font-medium text-neutral-800 dark:text-neutral-200">{item.title}</p>
                        <p className="text-xs text-neutral-500">Due: {item.dueAt ? new Date(item.dueAt).toLocaleString() : "N/A"}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-neutral-500">No upcoming deadlines.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Workflow Queue</CardTitle>
                <CardDescription>Reminder and waiting-state counts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-neutral-700 dark:text-neutral-300">Today's reminders: <span className="font-semibold">{widgets?.todaysReminders ?? 0}</span></p>
                <p className="text-neutral-700 dark:text-neutral-300">Waiting for client: <span className="font-semibold">{widgets?.waitingForClient ?? 0}</span></p>
                <p className="text-neutral-700 dark:text-neutral-300">Waiting for consultant: <span className="font-semibold">{widgets?.waitingForConsultant ?? 0}</span></p>
                <p className="text-neutral-700 dark:text-neutral-300">Overdue tasks: <span className="font-semibold">{widgets?.overdueTasks?.length ?? 0}</span></p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Notifications</CardTitle>
                <CardDescription>Latest lifecycle notifications.</CardDescription>
              </CardHeader>
              <CardContent>
                {widgets?.recentNotifications?.length ? (
                  <ul className="space-y-2">
                    {widgets.recentNotifications.map((item) => (
                      <li key={item.id} className="rounded-lg border border-neutral-100 px-3 py-2 text-sm dark:border-neutral-800">
                        <p className="font-medium text-neutral-800 dark:text-neutral-200">{item.title}</p>
                        <p className="text-xs text-neutral-500">{item.status} · {formatRelativeTime(item.createdAt)}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-neutral-500">No recent notifications.</p>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </PageState>
    </PageContainer>
  );
}
