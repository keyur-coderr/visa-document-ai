"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

type Requirement = { id: string; key: string; label: string; required: boolean; status: string; reason: string | null };
type Document = { id: string; filename: string; status: string; requirementKey: string | null; uploadedAt: string; reuploadReason: string | null };

export function PortalDocuments({ caseId, requirements, documents }: { caseId: string; requirements: Requirement[]; documents: Document[] }) {
  const [selectedRequirement, setSelectedRequirement] = useState(requirements[0]?.id ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const selected = requirements.find((item) => item.id === selectedRequirement);
  const replacement = selected ? documents.find((item) => item.requirementKey === selected.key && item.status === "needs_reupload") : undefined;

  async function upload() {
    if (!file || !selected || submitting) return;
    setSubmitting(true); setStatus(null);
    const formData = new FormData();
    formData.set("caseId", caseId); formData.set("requirementId", selected.id); formData.set("file", file); formData.set("uploadNote", note);
    if (replacement) formData.set("documentId", replacement.id);
    try {
      const response = await fetch("/api/client-documents/upload", { method: "POST", body: formData });
      const payload = await response.json() as { error?: string };
      setStatus(response.ok ? "Upload received. Your case team will review it." : payload.error ?? "Upload failed.");
      if (response.ok) { setFile(null); setNote(""); }
    } catch { setStatus("Upload failed. Please try again."); } finally { setSubmitting(false); }
  }

  return <div className="space-y-6"><section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-panel"><h2 className="text-base font-semibold">Upload a document</h2><p className="mt-1 text-sm text-neutral-600">PDF, JPG, or PNG up to 10 MB. Files are stored privately for your case.</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium">Checklist item<select value={selectedRequirement} onChange={(event) => setSelectedRequirement(event.target.value)} className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm">{requirements.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label className="text-sm font-medium">File<input type="file" accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png" capture="environment" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="mt-1 block w-full text-sm" /></label></div>{replacement?.reuploadReason ? <p className="mt-3 rounded-lg bg-warning-50 px-3 py-2 text-sm text-warning-700">Re-upload requested: {replacement.reuploadReason}</p> : null}<label className="mt-3 block text-sm font-medium">Note for your case team<textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} className="mt-1 block min-h-20 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm" /></label><Button className="mt-4" disabled={!file || !selected || submitting} onClick={upload}>{submitting ? "Uploading..." : replacement ? "Replace document" : "Upload document"}</Button>{status ? <p className="mt-3 text-sm text-neutral-700">{status}</p> : null}</section><section className="rounded-lg border border-neutral-200 bg-white"><div className="border-b border-neutral-200 px-5 py-4"><h2 className="text-base font-semibold">Checklist documents</h2></div><ul className="divide-y divide-neutral-200">{requirements.map((item) => { const document = documents.find((entry) => entry.requirementKey === item.key); return <li key={item.id} className="px-5 py-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-medium">{item.label}{item.required ? " (required)" : ""}</p><p className="mt-1 text-xs text-neutral-500">{document ? `${document.filename} · ${document.status.replaceAll("_", " ")}` : "Not uploaded"}</p></div><span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">{document?.status ?? "missing"}</span></div>{document?.reuploadReason ? <p className="mt-2 text-sm text-warning-700">{document.reuploadReason}</p> : null}</li>; })}</ul></section></div>;
}
