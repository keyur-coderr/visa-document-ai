"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormInput, FormLabel, FormTextarea } from "@/components/ui/Form";
import type { GeneratedFormDetail } from "@/server/services/forms-service";

export function GeneratedFormDetailClient({ detail, role }: { detail: GeneratedFormDetail; role: "practitioner" | "assistant" }) {
  const [regenReason, setRegenReason] = useState("");
  const [approvalNote, setApprovalNote] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const mappedEntries = useMemo(() => Object.entries(detail.currentVersion?.mappedFields ?? {}), [detail.currentVersion?.mappedFields]);

  async function callAction(path: string, method: "POST" | "PATCH", body: Record<string, unknown>) {
    setPending(true);
    setStatus(null);
    try {
      const response = await fetch(path, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setStatus(payload.error ?? "Action failed.");
        return false;
      }
      setStatus("Action completed.");
      window.location.reload();
      return true;
    } catch {
      setStatus("Action failed.");
      return false;
    } finally {
      setPending(false);
    }
  }

  async function approve() {
    await callAction(`/api/forms/${detail.form.id}/approve`, "PATCH", {
      caseId: detail.caseId,
      note: approvalNote.trim() || null,
    });
  }

  async function regenerate() {
    await callAction(`/api/forms/${detail.form.id}/regenerate`, "POST", {
      caseId: detail.caseId,
      reason: regenReason.trim(),
    });
  }

  async function archive() {
    await callAction(`/api/forms/${detail.form.id}/archive`, "PATCH", {
      caseId: detail.caseId,
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
        <p className="text-sm font-medium">Current version mapped fields</p>
        {mappedEntries.length === 0 ? (
          <p className="mt-2 text-xs text-neutral-500">No mapped fields in this version.</p>
        ) : (
          <ul className="mt-2 max-h-64 space-y-1 overflow-auto rounded border border-neutral-200 p-2 text-xs dark:border-neutral-700">
            {mappedEntries.map(([key, value]) => (
              <li key={key} className="grid grid-cols-[minmax(0,1fr),minmax(0,1fr)] gap-2">
                <span className="font-medium text-neutral-700 dark:text-neutral-300">{key}</span>
                <span className="text-neutral-600 dark:text-neutral-400">{String(value)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
        <FormLabel htmlFor="regen-reason">Regeneration reason</FormLabel>
        <FormTextarea id="regen-reason" value={regenReason} onChange={(event) => setRegenReason(event.target.value)} className="mt-1 min-h-20" />
        <Button className="mt-2" variant="secondary" disabled={pending || !regenReason.trim()} onClick={regenerate}>
          Regenerate
        </Button>
      </div>

      <div className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
        <FormLabel htmlFor="approval-note">Approval note</FormLabel>
        <FormInput id="approval-note" value={approvalNote} onChange={(event) => setApprovalNote(event.target.value)} />
        <div className="mt-2 flex flex-wrap gap-2">
          <Button variant="secondary" disabled={pending || role !== "practitioner"} onClick={approve}>
            Approve
          </Button>
          <Button variant="secondary" disabled={pending} onClick={archive}>
            Archive
          </Button>
        </div>
      </div>

      {status ? <p className="text-sm text-neutral-600">{status}</p> : null}
    </div>
  );
}
