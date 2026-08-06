import "server-only";

import { getAppRepository } from "@/server/repositories/factory";
import type { AuditEventInput } from "@/server/repositories/contracts";

export async function logAuditEvent(input: AuditEventInput) {
  await getAppRepository().logAuditEvent(input);
}
