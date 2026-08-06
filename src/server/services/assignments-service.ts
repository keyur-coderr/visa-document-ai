import "server-only";

import { getAppRepository } from "@/server/repositories/factory";

export async function listCaseAssignments(caseId: string) {
  return getAppRepository().listAssignments(caseId);
}
