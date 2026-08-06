import "server-only";

import { getAppRepository } from "@/server/repositories/factory";

export async function getCurrentUserContext() {
  return getAppRepository().getCurrentUserContext();
}
