import type { MilestoneKey } from "@/types/domain";
import { cn } from "@/lib/utilities/cn";

const milestoneLabels: Record<MilestoneKey, string> = {
  intake: "Intake",
  documents_complete: "Documents",
  forms_ready: "Forms",
  submitted: "Submitted",
  awaiting_decision: "Decision Pending",
  decision_received: "Decision",
};

export interface MilestoneStepperProps {
  milestones: MilestoneKey[];
  current: MilestoneKey;
}

export function MilestoneStepper({ milestones, current }: MilestoneStepperProps) {
  const activeIndex = Math.max(milestones.indexOf(current), 0);

  return (
    <ol className="grid grid-cols-2 gap-2 md:grid-cols-6" aria-label="Case milestones">
      {milestones.map((milestone, index) => {
        const complete = index <= activeIndex;
        return (
          <li
            key={milestone}
            className={cn(
              "rounded-lg border px-3 py-2 text-xs font-medium",
              complete
                ? "border-success-200 bg-success-50 text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-500"
                : "border-neutral-200 bg-neutral-50 text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400",
            )}
          >
            {milestoneLabels[milestone]}
          </li>
        );
      })}
    </ol>
  );
}
