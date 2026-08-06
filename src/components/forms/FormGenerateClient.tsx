"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormInput, FormLabel, FormSelect, FormTextarea } from "@/components/ui/Form";

export interface FormOptionItem {
  code: string;
  formName: string;
  version: string;
  status: "supported" | "partial" | "unsupported";
}

export function FormGenerateClient({ caseId, options }: { caseId: string; options: FormOptionItem[] }) {
  const [formCode, setFormCode] = useState(options[0]?.code ?? "");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function generate() {
    if (!formCode) return;
    setPending(true);
    setStatus(null);
    try {
      const response = await fetch("/api/forms/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ caseId, formCode, reason: reason.trim() || null }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setStatus(payload.error ?? "Generation failed.");
        return;
      }
      setStatus("Form generation run created.");
      window.location.href = `/cases/${caseId}/forms/${payload.generatedFormId}`;
    } catch {
      setStatus("Generation failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <FormLabel htmlFor="form-select">Form</FormLabel>
      <FormSelect id="form-select" value={formCode} onChange={(event) => setFormCode(event.target.value)}>
        {options.map((option) => (
          <option key={option.code} value={option.code}>
            {option.code} - {option.formName} ({option.version}) [{option.status}]
          </option>
        ))}
      </FormSelect>

      <FormLabel htmlFor="regen-reason">Generation note (optional)</FormLabel>
      <FormTextarea id="regen-reason" value={reason} onChange={(event) => setReason(event.target.value)} className="min-h-20" placeholder="Context for this run (e.g., updated approved facts)." />

      <Button onClick={generate} disabled={pending || !formCode}>
        {pending ? "Generating..." : "Generate Form"}
      </Button>

      {status ? <p className="text-sm text-neutral-600">{status}</p> : null}
    </div>
  );
}
