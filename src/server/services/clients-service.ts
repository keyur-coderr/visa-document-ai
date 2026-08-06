import "server-only";

import { getAppRepository } from "@/server/repositories/factory";

export async function listClientsForCurrentUser() {
  return getAppRepository().listClients();
}
