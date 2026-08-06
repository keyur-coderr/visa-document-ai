import type { CaseWorkflowStageView } from "@/server/services/lifecycle-service";

export function CaseProgressTracker({ stages, currentStage, completionPercent, estimatedCompletionDate }: {
  stages: CaseWorkflowStageView[];
  currentStage: string;
  completionPercent: number;
  estimatedCompletionDate: string | null;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Case progress</p>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">{completionPercent}%</p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
        <div className="h-full bg-brand-600" style={{ width: `${completionPercent}%` }} />
      </div>
      <p className="text-xs text-neutral-500">Current stage: {currentStage.replaceAll("_", " ")}</p>
      <p className="text-xs text-neutral-500">Estimated completion: {estimatedCompletionDate ? new Date(estimatedCompletionDate).toLocaleDateString() : "N/A"}</p>
      <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {stages.map((stage) => (
          <li key={stage.key} className="rounded border border-neutral-200 px-2.5 py-2 text-xs dark:border-neutral-700">
            <p className="font-medium text-neutral-800 dark:text-neutral-200">{stage.name}</p>
            <p className="text-neutral-500">{stage.status.replaceAll("_", " ")}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
