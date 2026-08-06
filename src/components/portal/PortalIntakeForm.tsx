"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function PortalIntakeForm({ caseId, fields }: { caseId: string; fields: Array<{ key: string; label: string; required: boolean }> }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  async function save(submit: boolean) { setSaving(true); setMessage(null); const response = await fetch("/api/portal/intake", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ caseId, answers, submit }) }); const payload = await response.json() as { error?: string }; setMessage(response.ok ? (submit ? "Intake submitted to your case team." : "Draft saved.") : payload.error ?? "Unable to save your intake."); setSaving(false); }
  return <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-panel"><div className="space-y-4">{fields.map((field) => <label key={field.key} className="block text-sm font-medium">{field.label}{field.required ? " *" : ""}<textarea required={field.required} value={answers[field.key] ?? ""} onChange={(event) => setAnswers((current) => ({ ...current, [field.key]: event.target.value }))} className="mt-1 block min-h-20 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm" /></label>)}</div><div className="mt-5 flex flex-wrap gap-3"><Button variant="secondary" disabled={saving} onClick={() => save(false)}>Save draft</Button><Button disabled={saving || fields.some((field) => field.required && !answers[field.key]?.trim())} onClick={() => save(true)}>Submit intake</Button></div>{message ? <p className="mt-3 text-sm text-neutral-700">{message}</p> : null}</div>;
}
