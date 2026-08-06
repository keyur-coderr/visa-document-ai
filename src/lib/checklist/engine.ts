import type {
  ChecklistItemStatus,
  StreamChecklistGroup,
  StreamChecklistItem,
  StreamWorkflowConfig,
} from "@/config/streams/types";

export interface CaseChecklistStatusMap {
  [itemKey: string]: Exclude<ChecklistItemStatus, "required" | "optional">;
}

export interface ChecklistItemView {
  key: string;
  label: string;
  appliesTo: StreamChecklistItem["appliesTo"];
  requirement: StreamChecklistItem["kind"];
  status: ChecklistItemStatus;
}

export interface ChecklistGroupView {
  key: string;
  title: string;
  items: ChecklistItemView[];
}

export interface ChecklistMetrics {
  completionPercent: number;
  requiredRemaining: number;
  optionalRemaining: number;
  uploadedCount: number;
  approvedCount: number;
  needsReviewCount: number;
  rejectedCount: number;
  missingCount: number;
  pendingCount: number;
}

export interface CaseChecklistSummary {
  groups: ChecklistGroupView[];
  metrics: ChecklistMetrics;
}

const COMPLETE_STATUSES: ChecklistItemStatus[] = ["uploaded", "approved"];

function resolveItemStatus(
  item: StreamChecklistItem,
  statusMap: CaseChecklistStatusMap | undefined,
): ChecklistItemStatus {
  const rawStatus = statusMap?.[item.key];

  if (rawStatus) {
    return rawStatus;
  }

  return item.kind === "required" ? "missing" : "optional";
}

function mapGroup(
  group: StreamChecklistGroup,
  statusMap: CaseChecklistStatusMap | undefined,
): ChecklistGroupView {
  return {
    key: group.key,
    title: group.title,
    items: group.items.map((item) => ({
      key: item.key,
      label: item.label,
      appliesTo: item.appliesTo,
      requirement: item.kind,
      status: resolveItemStatus(item, statusMap),
    })),
  };
}

function computeMetrics(groups: ChecklistGroupView[]): ChecklistMetrics {
  const allItems = groups.flatMap((group) => group.items);
  const requiredItems = allItems.filter((item) => item.requirement === "required");
  const optionalItems = allItems.filter((item) => item.requirement === "optional");

  const requiredComplete = requiredItems.filter((item) => COMPLETE_STATUSES.includes(item.status)).length;
  const optionalComplete = optionalItems.filter((item) => COMPLETE_STATUSES.includes(item.status)).length;

  const completionDenominator = allItems.length || 1;
  const completionNumerator = requiredComplete + optionalComplete;

  return {
    completionPercent: Math.round((completionNumerator / completionDenominator) * 100),
    requiredRemaining: requiredItems.length - requiredComplete,
    optionalRemaining: optionalItems.length - optionalComplete,
    uploadedCount: allItems.filter((item) => item.status === "uploaded").length,
    approvedCount: allItems.filter((item) => item.status === "approved").length,
    needsReviewCount: allItems.filter((item) => item.status === "needs_review").length,
    rejectedCount: allItems.filter((item) => item.status === "rejected").length,
    missingCount: allItems.filter((item) => item.status === "missing").length,
    pendingCount: allItems.filter((item) => item.status === "pending").length,
  };
}

export function buildCaseChecklistSummary(
  streamConfig: StreamWorkflowConfig,
  statusMap?: CaseChecklistStatusMap,
): CaseChecklistSummary {
  const groups = streamConfig.checklistGroups.map((group) => mapGroup(group, statusMap));

  return {
    groups,
    metrics: computeMetrics(groups),
  };
}
