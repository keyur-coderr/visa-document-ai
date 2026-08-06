import "server-only";

import { getAppRepository } from "@/server/repositories/factory";

export async function listCasesForCurrentUser() {
  return getAppRepository().listCases();
}
