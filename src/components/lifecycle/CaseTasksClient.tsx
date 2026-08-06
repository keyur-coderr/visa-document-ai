"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function CaseTasksClient({ caseId, tasks }: { caseId: string; tasks: Array<{ id: string; title: string; priority: string; dueAt: string | null; status: string; assignedTo: string; milestoneId: string | null }> }) {
  const [status, setStatus] = useState<string | null>(null);
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);

  async function completeTask(taskId: string) {
    setPendingTaskId(taskId);
    setStatus(null);
    try {
      const response = await fetch(`/api/tasks/${taskId}/complete`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ caseId, reason: "Completed from tasks workspace" }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setStatus(payload.error ?? "Unable to complete task.");
        return;
      }
      setStatus("Task completed.");
      window.location.reload();
    } catch {
      setStatus("Unable to complete task.");
    } finally {
      setPendingTaskId(null);
    }
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div key={task.id} className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{task.title}</p>
            <span className="rounded-full border border-neutral-200 px-2 py-0.5 text-xs">{task.status}</span>
          </div>
          <p className="mt-1 text-xs text-neutral-500">Priority: {task.priority} · Assigned: {task.assignedTo}</p>
          <p className="text-xs text-neutral-500">Due: {task.dueAt ? new Date(task.dueAt).toLocaleString() : "N/A"}</p>
          <Button className="mt-2" size="sm" variant="secondary" disabled={task.status === "completed" || pendingTaskId === task.id} onClick={() => completeTask(task.id)}>
            {pendingTaskId === task.id ? "Updating..." : "Mark completed"}
          </Button>
        </div>
      ))}
      {status ? <p className="text-sm text-neutral-600">{status}</p> : null}
    </div>
  );
}
