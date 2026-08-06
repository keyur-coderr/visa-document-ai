"use client";

import { useEffect, useState } from "react";
import { PageState, useDemoPageState } from "@/components/ui/PageState";
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
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { Dropdown } from "@/components/ui/Dropdown";
import {
  AdminIcon,
  AiReviewIcon,
  AlertTriangleIcon,
  CasesIcon,
  ChevronRightIcon,
  DashboardIcon,
  DocumentsIcon,
  FilterIcon,
  InboxIcon,
  ChevronDownIcon,
  ReportsIcon,
} from "@/components/ui/icons";
import { cn } from "@/lib/utilities/cn";

interface LifecycleWidgets {
  upcomingDeadlines: Array<{ id: string; title: string; dueAt: string | null; priority: string }>;
  todaysReminders: number;
  overdueTasks: Array<{ id: string; title: string; dueAt: string | null; priority: string }>;
  waitingForClient: number;
  waitingForConsultant: number;
  recentlyUpdatedCases: Array<{ caseId: string; title: string; updatedAt: string }>;
  recentNotifications: Array<{ id: string; title: string; status: string; createdAt: string }>;
}

type CaseTab = "all" | "my" | "team";
type CaseFilter = "all" | "attention" | "ready";

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return "just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.round(diffHours / 24)}d ago`;
}

function initials(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function progressForCase(documentsComplete: number, documentsTotal: number): number {
  if (documentsTotal === 0) return 0;
  return Math.round((documentsComplete / documentsTotal) * 100);
}

function aiScoreForCase(documentsComplete: number, documentsTotal: number, openFlags: number): number {
  if (documentsTotal === 0) return 44;
  const completion = (documentsComplete / documentsTotal) * 70;
  const flagPenalty = openFlags * 6;
  const cleanBonus = openFlags === 0 ? 25 : 15;
  const raw = Math.round(completion + cleanBonus - flagPenalty);
  return Math.max(40, Math.min(98, raw));
}

function nextActionForCase(openFlags: number, progress: number, statusLabel: string): string {
  if (openFlags > 0) return "Resolve AI flags";
  if (progress < 100) return "Collect missing docs";
  if (statusLabel === "Ready for Submission") return "Submit package";
  return "Review timeline";
}

function statusChipClass(label: string): string {
  const map: Record<string, string> = {
    "Ready for Submission": "bg-emerald-50 text-emerald-700 border-emerald-200",
    Submitted: "bg-blue-50 text-blue-700 border-blue-200",
    "In Review": "bg-amber-50 text-amber-700 border-amber-200",
    "Documents in Progress": "bg-indigo-50 text-indigo-700 border-indigo-200",
    "Awaiting Decision": "bg-cyan-50 text-cyan-700 border-cyan-200",
    "Intake in Progress": "bg-violet-50 text-violet-700 border-violet-200",
    Draft: "bg-slate-100 text-slate-700 border-slate-200",
    Closed: "bg-neutral-100 text-neutral-700 border-neutral-200",
  };
  return map[label] ?? "bg-slate-100 text-slate-700 border-slate-200";
}

function KebabIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={cn("h-4 w-4", className)}>
      <circle cx="3" cy="8" r="1.2" fill="currentColor" />
      <circle cx="8" cy="8" r="1.2" fill="currentColor" />
      <circle cx="13" cy="8" r="1.2" fill="currentColor" />
    </svg>
  );
}

function DotConnectorIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={cn("h-3 w-3", className)}>
      <circle cx="8" cy="8" r="3" fill="currentColor" />
    </svg>
  );
}

function Sparkline({ points, className }: { points: string; className?: string }) {
  return (
    <svg viewBox="0 0 100 28" role="img" aria-label="Trend" className={cn("h-8 w-full", className)}>
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function DashboardPage() {
  const [status] = useDemoPageState("ready");
  const [widgets, setWidgets] = useState<LifecycleWidgets | null>(null);
  const [caseTab, setCaseTab] = useState<CaseTab>("all");
  const [caseFilter, setCaseFilter] = useState<CaseFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

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

  const activeCases = mockCases.filter((item) => item.status !== "closed").length;
  const pendingReviewCases = mockCases.filter(
    (item) => item.status === "in_review" || item.status === "documents_in_progress",
  ).length;
  const aiFlags = mockCases.reduce((count, item) => count + item.openFlags, 0);
  const readyToSubmitCases = mockCases.filter((item) => item.status === "ready_for_submission").length;
  const avgTurnaround = dashboardKpis.find((item) => item.id === "avg-turnaround")?.value ?? "4.2 days";

  const overdueCount = widgets?.overdueTasks?.length ?? 0;
  const incompleteDocuments = mockCases.reduce(
    (count, item) => count + Math.max(item.documentsTotal - item.documentsComplete, 0),
    0,
  );

  const aiFindings = [
    {
      id: "missing-documents",
      label: "Missing documents",
      count: incompleteDocuments,
      detail: "Files still required before submission packages can be finalized.",
      icon: AlertTriangleIcon,
      tone: "text-warning-700 bg-warning-50 border-warning-100",
      severity: "warning",
      confidence: "Needs Review",
    },
    {
      id: "expired-documents",
      label: "Expired documents",
      count: overdueCount,
      detail: "Expiry windows exceeded in active workflows.",
      icon: InboxIcon,
      tone: "text-danger-700 bg-danger-50 border-danger-100",
      severity: "danger",
      confidence: "High Risk",
    },
    {
      id: "signature-issues",
      label: "Signature issues",
      count: aiProcessingSummary.failedToday,
      detail: "Documents require updated signatures or initials.",
      icon: DocumentsIcon,
      tone: "text-info-700 bg-info-50 border-info-100",
      severity: "warning",
      confidence: "Follow-up",
    },
    {
      id: "form-version",
      label: "Incorrect form version",
      count: aiProcessingSummary.queued,
      detail: "Version mismatches detected against latest IRCC forms.",
      icon: AdminIcon,
      tone: "text-brand-700 bg-brand-50 border-brand-100",
      severity: "success",
      confidence: "Low Risk",
    },
  ];

  const priorityItems = [
    {
      id: "needs-review",
      title: "Needs Review",
      subtitle: "Cases waiting for consultant review",
      count: pendingReviewCases,
      icon: DocumentsIcon,
      tone: "text-warning-700 bg-warning-50 border-warning-100",
      urgency: "High",
    },
    {
      id: "waiting-client",
      title: "Waiting for Client",
      subtitle: "Pending client uploads or responses",
      count: widgets?.waitingForClient ?? 0,
      icon: InboxIcon,
      tone: "text-info-700 bg-info-50 border-info-100",
      urgency: "Medium",
    },
    {
      id: "ready-submission",
      title: "Ready for Submission",
      subtitle: "Complete cases ready to submit",
      count: readyToSubmitCases,
      icon: ReportsIcon,
      tone: "text-success-700 bg-success-50 border-success-100",
      urgency: "Low",
    },
    {
      id: "requires-attention",
      title: "Requires Attention",
      subtitle: "Urgent items with workflow risk",
      count: aiFlags + overdueCount,
      icon: AlertTriangleIcon,
      tone: "text-danger-700 bg-danger-50 border-danger-100",
      urgency: "Critical",
    },
  ];

  const kpiCards = [
    {
      id: "active-cases",
      label: "Active Cases",
      value: `${activeCases}`,
      trend: "+7.1%",
      compare: "vs last 30 days",
      icon: CasesIcon,
      iconClass: "bg-brand-50 text-brand-700",
      cardTint: "from-brand-50/40",
      lineClass: "text-brand-500",
      points: "2,20 14,16 26,18 38,11 50,13 62,8 74,10 86,6 98,8",
    },
    {
      id: "pending-review",
      label: "Pending Review",
      value: `${pendingReviewCases}`,
      trend: "+1.8%",
      compare: "vs yesterday",
      icon: DocumentsIcon,
      iconClass: "bg-warning-50 text-warning-700",
      cardTint: "from-warning-50/35",
      lineClass: "text-warning-500",
      points: "2,14 14,16 26,15 38,17 50,16 62,18 74,16 86,17 98,16",
    },
    {
      id: "ai-flags",
      label: "AI Flags",
      value: `${aiFlags}`,
      trend: "-3.4%",
      compare: "improved this week",
      icon: AlertTriangleIcon,
      iconClass: "bg-danger-50 text-danger-700",
      cardTint: "from-danger-50/30",
      lineClass: "text-danger-500",
      points: "2,9 14,10 26,13 38,12 50,14 62,16 74,17 86,19 98,20",
    },
    {
      id: "ready-submit",
      label: "Ready to Submit",
      value: `${readyToSubmitCases}`,
      trend: "+4.2%",
      compare: "pipeline acceleration",
      icon: ReportsIcon,
      iconClass: "bg-success-50 text-success-700",
      cardTint: "from-success-50/35",
      lineClass: "text-success-500",
      points: "2,22 14,18 26,20 38,16 50,14 62,13 74,10 86,8 98,7",
    },
    {
      id: "avg-turnaround",
      label: "Average Turnaround",
      value: avgTurnaround,
      trend: "-0.4 day",
      compare: "faster than last month",
      icon: DashboardIcon,
      iconClass: "bg-info-50 text-info-700",
      cardTint: "from-info-50/35",
      lineClass: "text-info-500",
      points: "2,11 14,12 26,10 38,9 50,8 62,9 74,7 86,6 98,5",
    },
  ];

  const tabbedCases = mockCases.filter((item) => {
    if (caseTab === "my") return item.assignedTo.includes("Priya");
    if (caseTab === "team") return item.assignedTo !== "Unassigned";
    return true;
  });

  const filteredCases = tabbedCases.filter((item) => {
    if (caseFilter === "attention" && item.openFlags === 0) return false;
    if (caseFilter === "ready" && item.status !== "ready_for_submission") return false;
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    return (
      item.clientName.toLowerCase().includes(query) ||
      item.title.toLowerCase().includes(query) ||
      item.streamLabel.toLowerCase().includes(query)
    );
  });

  return (
    <div className="mx-auto flex w-full max-w-[var(--layout-content-max)] flex-col gap-7 px-4 py-6 sm:px-6 lg:px-8">
      <PageState
        status={status}
        emptyTitle="No dashboard data yet"
        emptyDescription="Once cases and documents are added, your firm's activity will appear here."
        errorDescription="We couldn't load dashboard data. Try again in a moment."
        skeletonVariant="card"
      >
        <div className="fade-in flex flex-col gap-7">
          <section aria-label="Dashboard hero" className="relative overflow-hidden rounded-[24px] border border-brand-100/70 bg-gradient-to-br from-blue-50 via-white to-violet-100 p-7 shadow-[var(--shadow-lg)] before:pointer-events-none before:absolute before:inset-x-0 before:bottom-0 before:h-10 before:bg-gradient-to-t before:from-brand-100/30 before:to-transparent sm:p-8">
            <span className="pointer-events-none absolute -right-8 -top-12 h-48 w-48 rounded-full bg-blue-400/20 blur-3xl" aria-hidden="true" />
            <span className="pointer-events-none absolute -bottom-20 left-16 h-64 w-64 rounded-full bg-violet-400/20 blur-3xl" aria-hidden="true" />
            <div className="relative z-10 grid gap-7 xl:grid-cols-[1.3fr_1fr] xl:items-end">
              <div className="space-y-5">
                <p className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/85 px-3.5 py-1 text-small font-medium text-brand-700 shadow-[var(--shadow-xs)]">
                  <AiReviewIcon className="h-3.5 w-3.5" />
                  AI Operations Brief
                </p>
                <div>
                  <h1 className="text-display text-4xl sm:text-[2.65rem]">Good Morning, Priya! 👋</h1>
                  <p className="mt-4 max-w-2xl text-body text-[color:var(--color-text-secondary)]">
                    Your team is moving quickly today. AI completed {aiProcessingSummary.completedToday} workflows, with {aiFlags} open flags and {readyToSubmitCases} case packages ready for submission.
                  </p>
                </div>
                <p className="pt-1 text-small text-[color:var(--color-text-secondary)]/95">
                  {widgets?.todaysReminders ?? 0} reminders scheduled today • {widgets?.recentNotifications?.length ?? 0} fresh notifications • {documentStatSummary.needsReview} documents need review
                </p>
              </div>

              <div className="flex w-full flex-col gap-4 xl:items-end">
                <div className="relative hidden h-28 w-56 overflow-hidden rounded-2xl border border-white/80 bg-gradient-to-br from-white/80 to-blue-50/80 shadow-[var(--shadow-sm)] md:block motion-safe:animate-[heroFloat_6s_ease-in-out_infinite]">
                  <span className="absolute -right-4 -top-6 h-16 w-16 rounded-full bg-violet-300/25" aria-hidden="true" />
                  <span className="absolute right-6 top-6 h-10 w-10 rounded-full border border-violet-200 bg-violet-100/60" aria-hidden="true" />
                  <svg className="absolute left-11 top-[26px] h-6 w-20 text-brand-300" viewBox="0 0 100 24" aria-hidden="true">
                    <path d="M2 12h58l10-8M60 12l10 8" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="absolute bottom-2 left-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-[var(--shadow-sm)]" aria-hidden="true">
                    <AiReviewIcon className="h-5 w-5" />
                  </span>
                  <span className="absolute left-16 top-3 inline-flex items-center rounded-full border border-brand-100 bg-white px-2 py-0.5 text-[10px] font-semibold text-brand-700 shadow-[var(--shadow-xs)]">
                    17 workflows
                  </span>
                  <span className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-brand-600 shadow-[var(--shadow-xs)]" aria-hidden="true">
                    <DashboardIcon className="h-4 w-4" />
                  </span>
                  <span className="absolute bottom-3 right-3 text-xs font-medium text-[color:var(--color-text-secondary)]">Live AI Briefing</span>
                </div>

                <div className="flex w-full flex-wrap items-center justify-start gap-2.5 xl:w-auto xl:justify-end">
                  <Button className="min-w-[112px] rounded-[14px] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                    New Case
                  </Button>
                  <div className="inline-flex flex-wrap items-center gap-2 rounded-[14px] border border-white/70 bg-white/60 p-1.5">
                    <Button
                      variant="secondary"
                      className="min-w-[126px] rounded-[12px] border-white/90 bg-white/90 shadow-[var(--shadow-xs)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                    >
                      Upload Documents
                    </Button>
                    <Button
                      variant="outline"
                      className="min-w-[112px] rounded-[12px] bg-white/70 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                    >
                      Run AI Review
                    </Button>
                    <Button
                      variant="ghost"
                      className="min-w-[108px] rounded-[12px] transition-all duration-200 hover:-translate-y-0.5"
                    >
                      Create Client
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section aria-label="Key performance indicators" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {kpiCards.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <Card key={kpi.id} className={cn("group flex h-full flex-col overflow-hidden rounded-[18px] border border-neutral-200/70 bg-gradient-to-b to-white shadow-[var(--shadow-sm)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-md)]", kpi.cardTint)}>
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-h-[70px]">
                        <p className="text-small text-[color:var(--color-text-secondary)]">{kpi.label}</p>
                        <p className="mt-1 text-3xl font-semibold tracking-tight text-[color:var(--color-text-primary)]">{kpi.value}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className={cn("inline-flex h-10 w-10 items-center justify-center rounded-full ring-1 ring-black/5", kpi.iconClass)}>
                          <Icon className="h-4.5 w-4.5" />
                        </span>
                        <button
                          type="button"
                          aria-label={`More insights for ${kpi.label}`}
                          className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-md text-[color:var(--color-text-secondary)] opacity-25 transition-all duration-200 hover:bg-[color:var(--color-surface-subtle)] group-hover:opacity-100 focus-visible:opacity-100"
                        >
                          <KebabIcon />
                        </button>
                      </div>
                    </div>
                    <div className="min-h-[42px] space-y-1">
                      <p className="text-small font-medium text-[color:var(--color-text-primary)]">{kpi.trend}</p>
                      <p className="text-caption">Weekly comparison: {kpi.compare}</p>
                    </div>
                    <div className="rounded-xl bg-[color:var(--color-surface-subtle)]/70 px-2.5 py-1.5">
                      <Sparkline points={kpi.points} className={cn(kpi.lineClass, "opacity-85 transition-all duration-200 motion-safe:animate-[sparkIn_500ms_ease-out] group-hover:opacity-100 group-hover:translate-y-[-1px]")} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </section>

          <section aria-label="AI assistant and priorities" className="grid grid-cols-1 gap-4 xl:grid-cols-5">
            <Card className="xl:col-span-3 rounded-[20px] border-brand-100/80 bg-gradient-to-br from-white via-white to-violet-50/45 shadow-[var(--shadow-lg)]">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>AI Assistant</CardTitle>
                    <CardDescription>High-priority findings detected across active immigration files.</CardDescription>
                  </div>
                  <span className="inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-caption font-semibold text-brand-700">
                    BETA
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <p className="max-w-xl text-body text-[color:var(--color-text-secondary)]">
                    AI confidence is trending upward at {Math.round(documentStatSummary.averageConfidence * 100)}%. These findings should be addressed before submission windows close.
                  </p>
                  <div className="relative h-16 w-40 overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-r from-brand-50 to-violet-50">
                    <span className="absolute left-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white text-brand-600 shadow-[var(--shadow-xs)]" aria-hidden="true">
                      <AiReviewIcon className="h-5 w-5" />
                    </span>
                    <span className="absolute right-3 top-3 text-xs font-medium text-brand-700">Confidence</span>
                    <span className="absolute right-3 bottom-2 text-sm font-semibold text-brand-700">{Math.round(documentStatSummary.averageConfidence * 100)}%</span>
                  </div>
                </div>
                <div className="rounded-[14px] border border-brand-100/80 bg-white/80 px-3.5 py-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-medium text-[color:var(--color-text-primary)]">Recommendation: Resolve high-risk document gaps before end-of-day filing windows.</p>
                    <span className="inline-flex items-center rounded-full bg-danger-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-danger-700">Urgent</span>
                  </div>
                </div>
                <ul className="space-y-2">
                  {aiFindings.map((item) => {
                    const Icon = item.icon;
                    const severityClass = item.severity === "danger"
                      ? "bg-danger-50 text-danger-700 border-danger-100"
                      : item.severity === "warning"
                        ? "bg-warning-50 text-warning-700 border-warning-100"
                        : "bg-success-50 text-success-700 border-success-100";
                    return (
                      <li
                        key={item.id}
                        className="group flex items-start justify-between gap-3 rounded-[16px] border border-[color:var(--color-border)]/80 bg-white/90 px-3.5 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-[color:var(--color-border-strong)] hover:shadow-[var(--shadow-xs)]"
                      >
                        <div className="flex min-w-0 flex-1 items-start gap-2.5">
                          <span className={cn("mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full border", item.tone)}>
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[color:var(--color-text-primary)]">{item.id === "missing-documents" ? "Missing Passports" : item.id === "expired-documents" ? "Expired PCCs" : item.id === "signature-issues" ? "Signature Issues" : "Incorrect Form Version"}</p>
                            <p className="text-caption">{item.detail}</p>
                            <div className="mt-2 h-1.5 w-28 rounded-full bg-[color:var(--color-surface-subtle)]">
                              <div className="h-1.5 rounded-full bg-brand-500" style={{ width: `${Math.min(100, 30 + item.count * 10)}%` }} />
                            </div>
                          </div>
                        </div>
                        <div className="flex min-w-[118px] flex-col items-end gap-1">
                          <span className="inline-flex h-6 min-w-[1.9rem] items-center justify-center rounded-full bg-[color:var(--color-surface-subtle)] px-2 text-caption font-semibold text-[color:var(--color-text-secondary)]">
                            {item.count}
                          </span>
                          <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", severityClass)}>
                            {item.confidence}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <Button variant="primary" className="rounded-[14px] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">Run AI Review</Button>
                  <Button variant="secondary" className="rounded-[14px] shadow-[var(--shadow-xs)] transition-all duration-200 hover:-translate-y-0.5">View All Suggestions</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="xl:col-span-2 rounded-[20px] border-neutral-200/70 shadow-[var(--shadow-sm)]">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>Today's Priorities</CardTitle>
                    <CardDescription>Operational focus for your practitioner workspace.</CardDescription>
                  </div>
                  <button type="button" className="focus-ring inline-flex h-8 min-w-[84px] items-center justify-center gap-1 rounded-[12px] px-2 py-1 text-xs font-medium text-[color:var(--color-text-secondary)] transition-colors hover:bg-[color:var(--color-surface-subtle)] hover:text-[color:var(--color-text-primary)]">View All <ChevronRightIcon className="h-3.5 w-3.5" /></button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <ul className="space-y-3">
                  {priorityItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li
                        key={item.id}
                        className="flex items-start justify-between gap-3 rounded-[16px] bg-gradient-to-r from-white to-[color:var(--color-surface-subtle)]/55 px-3.5 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-xs)]"
                      >
                        <div className="flex min-w-0 items-start gap-2.5">
                          <span className={cn("inline-flex h-8 w-8 items-center justify-center rounded-full border shadow-[var(--shadow-xs)]", item.tone)}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium leading-5 text-[color:var(--color-text-primary)]">{item.title}</p>
                              <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide", item.urgency === "Critical" ? "bg-danger-50 text-danger-700" : item.urgency === "High" ? "bg-warning-50 text-warning-700" : item.urgency === "Medium" ? "bg-info-50 text-info-700" : "bg-success-50 text-success-700")}>{item.urgency}</span>
                            </div>
                            <p className="text-caption">{item.subtitle}</p>
                          </div>
                        </div>
                        <span className="inline-flex min-w-[1.75rem] items-center justify-center rounded-full bg-[color:var(--color-surface-subtle)] px-2 py-1 text-caption font-semibold text-[color:var(--color-text-secondary)]">
                          {item.count}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          </section>

          <section aria-label="Recent activity timeline" className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Live stream of consultant, client, and AI actions.</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="relative space-y-3 before:absolute before:left-[17px] before:top-5 before:h-[calc(100%-2.5rem)] before:w-px before:bg-[color:var(--color-border)]">
                  {recentActivity.map((item) => {
                    const isSystemActivity = item.actor.toLowerCase().includes("system");
                    return (
                      <li key={item.id} className="relative grid grid-cols-[auto_1fr] gap-3 rounded-[16px] border border-[color:var(--color-border)]/80 bg-white px-3.5 py-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[color:var(--color-border-strong)] hover:shadow-[var(--shadow-xs)]">
                        <span
                          className={cn(
                            "relative inline-flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold",
                            isSystemActivity ? "bg-brand-50 text-brand-700" : "bg-[color:var(--color-surface-subtle)] text-[color:var(--color-text-primary)]",
                          )}
                          aria-hidden="true"
                        >
                          <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border border-white bg-success-400" aria-hidden="true" />
                          {isSystemActivity ? <AiReviewIcon className="h-4 w-4" /> : initials(item.actor)}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-xs text-[color:var(--color-text-secondary)]">
                            <DotConnectorIcon className={cn(isSystemActivity ? "text-brand-500" : "text-success-500")} />
                            {isSystemActivity ? <AiReviewIcon className="h-3.5 w-3.5" /> : <CasesIcon className="h-3.5 w-3.5" />}
                            <span>{formatRelativeTime(item.timestamp)}</span>
                          </div>
                          <p className="mt-1 text-sm text-[color:var(--color-text-secondary)] break-words">
                            <span className="font-medium text-[color:var(--color-text-primary)]">{item.actor}</span>{" "}
                            <span>{item.action}</span>{" "}
                            <span className="inline-flex max-w-[360px] items-center truncate rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-subtle)] px-2 py-0.5 text-xs font-medium text-[color:var(--color-text-primary)] align-middle">
                              {item.target}
                            </span>
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
                <div className="pt-2">
                  <button type="button" className="focus-ring inline-flex h-8 min-w-[84px] items-center justify-center gap-1 rounded-[12px] px-2 py-1 text-xs font-medium text-[color:var(--color-text-secondary)] transition-colors hover:bg-[color:var(--color-surface-subtle)] hover:text-[color:var(--color-text-primary)]">View All <ChevronRightIcon className="h-3.5 w-3.5" /></button>
                </div>
              </CardContent>
            </Card>
          </section>

          <section aria-label="Recent cases" className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <CardTitle>Recent Cases</CardTitle>
                    <CardDescription>Enterprise case overview with AI and submission readiness context.</CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { id: "all", label: "All Cases" },
                      { id: "my", label: "My Cases" },
                      { id: "team", label: "Team Cases" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setCaseTab(tab.id as CaseTab)}
                        className={cn(
                          "focus-ring rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200",
                          caseTab === tab.id
                            ? "bg-brand-600 text-white shadow-sm"
                            : "bg-[color:var(--color-surface-subtle)] text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text-primary)]",
                        )}
                        aria-pressed={caseTab === tab.id}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
                    <SearchInput
                      aria-label="Search cases"
                      placeholder="Search by client, case type, or title"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      containerClassName="w-full sm:min-w-[280px] sm:max-w-md"
                    />
                  </div>
                  <div className="hidden items-center gap-2 md:flex">
                    <Dropdown
                      trigger={<span className="focus-ring inline-flex h-10 min-w-[126px] items-center justify-between gap-1.5 rounded-[14px] border border-[color:var(--color-border)] bg-white px-3 text-sm font-medium text-[color:var(--color-text-primary)]">{caseFilter === "all" ? "All statuses" : caseFilter === "attention" ? "Needs attention" : "Ready for submission"}<ChevronDownIcon className="h-3.5 w-3.5 text-[color:var(--color-text-secondary)]" /></span>}
                      items={[
                        { id: "filter-all", label: "All statuses", onSelect: () => setCaseFilter("all") },
                        { id: "filter-attention", label: "Needs attention", onSelect: () => setCaseFilter("attention") },
                        { id: "filter-ready", label: "Ready for submission", onSelect: () => setCaseFilter("ready") },
                      ]}
                    />
                    <button
                      type="button"
                      aria-label="Open filters"
                      className="focus-ring inline-flex h-10 min-w-[96px] items-center justify-center gap-1.5 rounded-[14px] border border-[color:var(--color-border)] bg-white px-3 text-sm font-medium text-[color:var(--color-text-secondary)] transition-colors duration-200 hover:bg-[color:var(--color-surface-subtle)] hover:text-[color:var(--color-text-primary)]"
                    >
                      <FilterIcon className="h-3.5 w-3.5" />
                      Filter
                    </button>
                    <button type="button" className="focus-ring inline-flex h-10 min-w-[88px] items-center justify-center rounded-[14px] border border-[color:var(--color-border)] bg-white px-3 text-sm font-medium text-[color:var(--color-text-secondary)] transition-colors duration-200 hover:bg-[color:var(--color-surface-subtle)] hover:text-[color:var(--color-text-primary)]">View All</button>
                  </div>
                  <div className="md:hidden">
                    <Dropdown
                      trigger={<span className="focus-ring inline-flex h-10 min-w-[108px] items-center justify-center gap-1.5 rounded-[14px] border border-[color:var(--color-border)] bg-white px-3 text-sm font-medium text-[color:var(--color-text-secondary)]">More <ChevronDownIcon className="h-3.5 w-3.5" /></span>}
                      items={[
                        { id: "mobile-filter-all", label: "All statuses", onSelect: () => setCaseFilter("all") },
                        { id: "mobile-filter-attention", label: "Needs attention", onSelect: () => setCaseFilter("attention") },
                        { id: "mobile-filter-ready", label: "Ready for submission", onSelect: () => setCaseFilter("ready") },
                        { id: "mobile-view-all", label: "View All", onSelect: () => undefined },
                      ]}
                    />
                  </div>
                </div>

                <div className="overflow-x-auto rounded-[20px] border border-[color:var(--color-border)]/80 shadow-[var(--shadow-xs)]">
                  <table className="min-w-[1080px] w-full border-separate border-spacing-0 text-left text-sm">
                    <thead className="sticky top-0 z-10 bg-[color:var(--color-surface-subtle)]/95 backdrop-blur">
                      <tr className="text-xs uppercase tracking-wide text-[color:var(--color-text-secondary)]">
                        <th scope="col" className="px-4 py-3 font-semibold">Client</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Case Type</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Progress</th>
                        <th scope="col" className="px-4 py-3 font-semibold">AI Score</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Missing Documents</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Assigned To</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Next Action</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCases.map((caseItem) => {
                        const presentation = caseStatusPresentation[caseItem.status];
                        const progress = progressForCase(caseItem.documentsComplete, caseItem.documentsTotal);
                        const aiScore = aiScoreForCase(caseItem.documentsComplete, caseItem.documentsTotal, caseItem.openFlags);
                        const missingDocuments = Math.max(caseItem.documentsTotal - caseItem.documentsComplete, 0);
                        const aiScoreClass = aiScore >= 85
                          ? "bg-success-50 text-success-700 border-success-100"
                          : aiScore >= 65
                            ? "bg-warning-50 text-warning-700 border-warning-100"
                            : "bg-danger-50 text-danger-700 border-danger-100";

                        return (
                          <tr
                            key={caseItem.id}
                            className="group border-t border-[color:var(--color-border)]/70 transition-all duration-200 hover:bg-[color:var(--color-surface-subtle)]/60"
                          >
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2.5">
                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--color-surface-subtle)] text-xs font-semibold text-[color:var(--color-text-primary)]" aria-hidden="true">
                                  {initials(caseItem.clientName)}
                                </span>
                                <div>
                                  <p className="font-medium text-[color:var(--color-text-primary)]">{caseItem.clientName}</p>
                                  <p className="text-caption">{formatRelativeTime(caseItem.updatedAt)}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-[color:var(--color-text-secondary)]"><span className="block max-w-[270px] truncate">{caseItem.streamLabel}</span></td>
                            <td className="px-4 py-4">
                              <div className="w-36 space-y-1">
                                <div className="h-2 rounded-full bg-[color:var(--color-surface-subtle)]">
                                  <div className="h-2 rounded-full bg-gradient-to-r from-brand-500 to-violet-500 transition-all" style={{ width: `${progress}%` }} />
                                </div>
                                <p className="text-caption">{progress}% complete</p>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", aiScoreClass)}>
                                {aiScore}%
                              </span>
                            </td>
                            <td className="px-4 py-4 text-[color:var(--color-text-secondary)]">
                              <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold", missingDocuments > 0 ? "bg-danger-50 text-danger-700 border-danger-100" : "bg-success-50 text-success-700 border-success-100")}>
                                <span className={cn("h-1.5 w-1.5 rounded-full", missingDocuments > 0 ? "bg-danger-500" : "bg-success-500")} aria-hidden="true" />
                                {missingDocuments}
                              </span>
                            </td>
                            <td className="px-4 py-4"><StatusChip label={presentation.label} tone={presentation.tone} className={statusChipClass(presentation.label)} /></td>
                            <td className="px-4 py-4 text-[color:var(--color-text-secondary)]">
                              <span className="inline-flex items-center gap-2">
                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--color-surface-subtle)] text-[10px] font-semibold text-[color:var(--color-text-primary)]">{initials(caseItem.assignedTo)}</span>
                                <span className="max-w-[150px] truncate">{caseItem.assignedTo}</span>
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-[color:var(--color-text-primary)]">
                                {nextActionForCase(caseItem.openFlags, progress, presentation.label)}
                                <ChevronRightIcon className="h-3.5 w-3.5 text-[color:var(--color-text-secondary)]" />
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  className="focus-ring inline-flex h-9 min-w-[54px] items-center justify-center rounded-md px-2 text-xs font-medium text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-subtle)] hover:text-[color:var(--color-text-primary)]"
                                  aria-label={`Open case ${caseItem.title}`}
                                >
                                  Open
                                </button>
                                <button
                                  type="button"
                                  className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-md text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-subtle)] hover:text-[color:var(--color-text-primary)]"
                                  aria-label={`More actions for ${caseItem.title}`}
                                >
                                  <KebabIcon />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </PageState>
    </div>
  );
}
