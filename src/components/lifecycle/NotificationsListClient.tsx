"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function NotificationsListClient({ notifications }: { notifications: Array<{ id: string; title: string; body: string; status: string; createdAt: string }> }) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function markRead(notificationId: string) {
    setPendingId(notificationId);
    setStatus(null);
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, { method: "PATCH" });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setStatus(payload.error ?? "Unable to mark notification read.");
        return;
      }
      setStatus("Notification updated.");
      window.location.reload();
    } catch {
      setStatus("Unable to mark notification read.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-2">
      {notifications.map((item) => (
        <div key={item.id} className="rounded-lg border border-neutral-200 p-3 text-sm dark:border-neutral-800">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-neutral-800 dark:text-neutral-200">{item.title}</p>
            <span className="text-xs text-neutral-500">{item.status}</span>
          </div>
          <p className="mt-1 text-xs text-neutral-500">{item.body}</p>
          <p className="mt-1 text-xs text-neutral-400">{new Date(item.createdAt).toLocaleString()}</p>
          <Button size="sm" className="mt-2" variant="secondary" disabled={item.status === "read" || pendingId === item.id} onClick={() => markRead(item.id)}>
            {pendingId === item.id ? "Updating..." : "Mark read"}
          </Button>
        </div>
      ))}
      {status ? <p className="text-sm text-neutral-600">{status}</p> : null}
    </div>
  );
}
