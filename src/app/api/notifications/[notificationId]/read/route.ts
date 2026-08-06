import { NextResponse } from "next/server";
import { getAuthSession } from "@/server/auth/session";
import { markNotificationRead } from "@/server/services/lifecycle-service";

export async function PATCH(_: Request, { params }: { params: { notificationId: string } }) {
  const session = await getAuthSession();
  if (!session.userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const result = await markNotificationRead(params.notificationId);
  if (!result.ok) {
    return NextResponse.json(result, { status: result.error === "Notification not found." ? 404 : 400 });
  }

  return NextResponse.json({ ok: true });
}
