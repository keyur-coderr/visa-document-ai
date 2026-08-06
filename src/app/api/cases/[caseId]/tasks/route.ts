import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthSession } from "@/server/auth/session";
import { createCaseTask } from "@/server/services/lifecycle-service";

const payloadSchema = z.object({
  milestoneId: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(1).max(200),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  dueAt: z.string().datetime().nullable().optional(),
  note: z.string().trim().max(2000).nullable().optional(),
});

export async function POST(request: Request, { params }: { params: { caseId: string } }) {
  const session = await getAuthSession();
  if (!session.userId || (session.role !== "practitioner" && session.role !== "assistant")) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  try {
    const parsed = payloadSchema.parse(await request.json());
    const result = await createCaseTask({
      caseId: params.caseId,
      milestoneId: parsed.milestoneId ?? null,
      title: parsed.title,
      priority: parsed.priority,
      dueAt: parsed.dueAt ?? null,
      note: parsed.note ?? null,
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: result.error === "Case unavailable." ? 404 : 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid payload." }, { status: 400 });
  }
}
