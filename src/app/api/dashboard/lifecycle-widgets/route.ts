import { NextResponse } from "next/server";
import { getAuthSession } from "@/server/auth/session";
import { listDashboardLifecycleWidgets } from "@/server/services/lifecycle-service";

export async function GET() {
  const session = await getAuthSession();
  if (!session.userId || (session.role !== "practitioner" && session.role !== "assistant")) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  try {
    const widgets = await listDashboardLifecycleWidgets();
    return NextResponse.json({ ok: true, widgets });
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to load lifecycle widgets." }, { status: 500 });
  }
}
