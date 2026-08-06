"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

type Message = { id: string; body: string; senderName: string; senderRole: string; createdAt: string };
export function PortalMessages({ caseId, initialMessages }: { caseId: string; initialMessages: Message[] }) {
  const [messages, setMessages] = useState(initialMessages); const [message, setMessage] = useState(""); const [sending, setSending] = useState(false); const [error, setError] = useState<string | null>(null);
  async function send() { if (!message.trim() || sending) return; setSending(true); setError(null); const response = await fetch("/api/portal/messages", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ caseId, message }) }); const payload = await response.json() as { error?: string; id?: string; createdAt?: string }; if (!response.ok) setError(payload.error ?? "Unable to send your message."); else { setMessages((current) => [...current, { id: payload.id ?? crypto.randomUUID(), body: message.trim(), senderName: "You", senderRole: "client", createdAt: payload.createdAt ?? new Date().toISOString() }]); setMessage(""); } setSending(false); }
  return <section className="rounded-lg border border-neutral-200 bg-white"><div className="border-b border-neutral-200 px-5 py-4"><h2 className="text-base font-semibold">Messages</h2></div><div className="space-y-3 px-5 py-4">{messages.map((item) => <div key={item.id} className="rounded-lg bg-neutral-50 p-3"><p className="text-sm text-neutral-800">{item.body}</p><p className="mt-1 text-xs text-neutral-500">{item.senderName} · {new Date(item.createdAt).toLocaleDateString()}</p></div>)}<textarea value={message} maxLength={2000} onChange={(event) => setMessage(event.target.value)} placeholder="Write a message to your case team" className="block min-h-20 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm" /><Button disabled={!message.trim() || sending} onClick={send}>{sending ? "Sending..." : "Send message"}</Button>{error ? <p className="text-sm text-danger-700">{error}</p> : null}</div></section>;
}
