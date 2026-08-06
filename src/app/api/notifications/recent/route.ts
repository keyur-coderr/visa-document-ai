import { NextResponse } from "next/server";
import { getAuthSession } from "@/server/auth/session";
import { listDashboardLifecycleWidgets } from "@/server/services/lifecycle-service";

function relativeTimeLabel(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.round(diffHours / 24)}d ago`;
}

export async function GET() {
  const session = await getAuthSession();
  if (!session.userId || (session.role !== "practitioner" && session.role !== "assistant")) {
    return NextResponse.json({ ok: true, notifications: [] });
  }

  try {
    const widgets = await listDashboardLifecycleWidgets();
    const notifications = widgets.recentNotifications.map((item) => ({
      id: item.id,
      title: item.title,
      status: item.status,
      time: relativeTimeLabel(item.createdAt),
    }));

    return NextResponse.json({ ok: true, notifications });
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to load notifications." }, { status: 500 });
  }
}
