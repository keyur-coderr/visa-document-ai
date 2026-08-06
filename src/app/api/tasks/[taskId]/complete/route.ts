import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthSession } from "@/server/auth/session";
import { completeCaseTask } from "@/server/services/lifecycle-service";

const payloadSchema = z.object({
  caseId: z.string().min(1),
  reason: z.string().trim().max(1200).nullable().optional(),
});

export async function PATCH(request: Request, { params }: { params: { taskId: string } }) {
  const session = await getAuthSession();
  if (!session.userId || (session.role !== "practitioner" && session.role !== "assistant")) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  try {
    const parsed = payloadSchema.parse(await request.json());
    const result = await completeCaseTask({
      caseId: parsed.caseId,
      taskId: params.taskId,
      reason: parsed.reason ?? null,
    });
    if (!result.ok) {
      return NextResponse.json(result, { status: result.error === "Task not found." ? 404 : 400 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid payload." }, { status: 400 });
  }
}
