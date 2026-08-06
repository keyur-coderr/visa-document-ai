"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormInput, FormLabel, FormSelect, FormTextarea } from "@/components/ui/Form";
import type { CaseWorkflowStageView } from "@/server/services/lifecycle-service";

export function CaseWorkflowActionsClient({ caseId, stages }: { caseId: string; stages: CaseWorkflowStageView[] }) {
  const [stageKey, setStageKey] = useState(stages[0]?.key ?? "lead");
  const [reason, setReason] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [taskDueAt, setTaskDueAt] = useState("");
  const [taskNote, setTaskNote] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function transition() {
    setPending(true);
    setStatus(null);
    try {
      const response = await fetch(`/api/cases/${caseId}/workflow/transition`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ stageKey, reason: reason.trim() || null }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setStatus(payload.error ?? "Unable to transition workflow stage.");
        return;
      }
      setStatus("Workflow stage updated.");
      window.location.reload();
    } catch {
      setStatus("Unable to transition workflow stage.");
    } finally {
      setPending(false);
    }
  }

  async function createTask() {
    setPending(true);
    setStatus(null);
    try {
      const response = await fetch(`/api/cases/${caseId}/tasks`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: taskTitle,
          priority: taskPriority,
          dueAt: taskDueAt ? new Date(taskDueAt).toISOString() : null,
          note: taskNote.trim() || null,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setStatus(payload.error ?? "Unable to create task.");
        return;
      }
      setStatus("Task created.");
      window.location.reload();
    } catch {
      setStatus("Unable to create task.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
        <p className="text-sm font-medium">Transition stage</p>
        <FormLabel className="mt-2 block" htmlFor="stage-select">Target stage</FormLabel>
        <FormSelect id="stage-select" value={stageKey} onChange={(event) => setStageKey(event.target.value)}>
          {stages.map((stage) => (
            <option key={stage.key} value={stage.key}>{stage.name}</option>
          ))}
        </FormSelect>
        <FormLabel className="mt-2 block" htmlFor="stage-reason">Reason</FormLabel>
        <FormTextarea id="stage-reason" value={reason} onChange={(event) => setReason(event.target.value)} className="min-h-16" />
        <Button className="mt-2" variant="secondary" disabled={pending} onClick={transition}>Update stage</Button>
      </div>

      <div className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
        <p className="text-sm font-medium">Create internal task</p>
        <FormLabel className="mt-2 block" htmlFor="task-title">Task title</FormLabel>
        <FormInput id="task-title" value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} />
        <FormLabel className="mt-2 block" htmlFor="task-priority">Priority</FormLabel>
        <FormSelect id="task-priority" value={taskPriority} onChange={(event) => setTaskPriority(event.target.value as "low" | "medium" | "high" | "urgent")}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </FormSelect>
        <FormLabel className="mt-2 block" htmlFor="task-due">Due date/time</FormLabel>
        <FormInput id="task-due" type="datetime-local" value={taskDueAt} onChange={(event) => setTaskDueAt(event.target.value)} />
        <FormLabel className="mt-2 block" htmlFor="task-note">Notes</FormLabel>
        <FormTextarea id="task-note" value={taskNote} onChange={(event) => setTaskNote(event.target.value)} className="min-h-16" />
        <Button className="mt-2" variant="secondary" disabled={pending || !taskTitle.trim()} onClick={createTask}>Create task</Button>
      </div>

      {status ? <p className="text-sm text-neutral-600">{status}</p> : null}
    </div>
  );
}
