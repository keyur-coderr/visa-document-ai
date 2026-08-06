import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/StatusChip";
import { Badge } from "@/components/ui/Badge";
import { caseStatusPresentation } from "@/lib/utilities/status";
import type { MockCaseRecord } from "@/lib/mock/case-management";
import { formatIsoDate } from "@/lib/mock/case-management";

interface CaseCardProps {
  caseRecord: MockCaseRecord;
  clientName: string;
  practitionerName: string;
  assistantName: string;
}

export function CaseCard({ caseRecord, clientName, practitionerName, assistantName }: CaseCardProps) {
  const status = caseStatusPresentation[caseRecord.status];

  return (
    <Card className="h-full">
      <CardHeader className="space-y-2 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{caseRecord.title}</CardTitle>
          <StatusChip label={status.label} tone={status.tone} />
        </div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{clientName}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-xs text-neutral-500 dark:text-neutral-400">
          <div>
            <p className="font-medium text-neutral-700 dark:text-neutral-300">Immigration Stream</p>
            <p className="mt-1 text-neutral-600 dark:text-neutral-400">{caseRecord.streamLabel}</p>
          </div>
          <div>
            <p className="font-medium text-neutral-700 dark:text-neutral-300">Current Milestone</p>
            <p className="mt-1 text-neutral-600 dark:text-neutral-400">{caseRecord.currentMilestone.replace("_", " ")}</p>
          </div>
          <div>
            <p className="font-medium text-neutral-700 dark:text-neutral-300">Documents / Exhibits</p>
            <p className="mt-1 text-neutral-600 dark:text-neutral-400">
              {caseRecord.documentCount} / {caseRecord.exhibitCount}
            </p>
          </div>
          <div>
            <p className="font-medium text-neutral-700 dark:text-neutral-300">Nearest Deadline</p>
            <p className="mt-1 text-neutral-600 dark:text-neutral-400">
              {caseRecord.nearestDeadline ? formatIsoDate(caseRecord.nearestDeadline) : "No deadline"}
            </p>
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span>Overall completion</span>
            <span>{caseRecord.progressPercent}%</span>
          </div>
          <div className="h-2 rounded-full bg-neutral-100 dark:bg-neutral-800">
            <div
              className="h-2 rounded-full bg-brand-600"
              style={{ width: `${Math.max(0, Math.min(100, caseRecord.progressPercent))}%` }}
            />
          </div>
        </div>

        <div className="space-y-1 text-xs text-neutral-600 dark:text-neutral-400">
          <p>
            <span className="font-medium text-neutral-700 dark:text-neutral-300">Practitioner:</span> {practitionerName}
          </p>
          <p>
            <span className="font-medium text-neutral-700 dark:text-neutral-300">Assistant:</span> {assistantName}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={caseRecord.unresolvedFlagCount > 0 ? "danger" : "success"}>
            {caseRecord.unresolvedFlagCount} unresolved flags
          </Badge>
          <Badge tone={caseRecord.pendingApprovals > 0 ? "warning" : "success"}>
            {caseRecord.pendingApprovals} pending approvals
          </Badge>
        </div>

        <div className="flex items-center justify-end">
          <Link
            href={`/cases/${caseRecord.id}`}
            className="focus-ring rounded-md px-2 py-1 text-sm font-medium text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20"
          >
            Open case
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
