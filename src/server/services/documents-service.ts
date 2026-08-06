import "server-only";

import { getAppRepository } from "@/server/repositories/factory";

export async function listCaseDocuments(caseId: string) {
  return getAppRepository().listCaseDocuments(caseId);
}

export async function createSignedDocumentUrl(documentId: string, expiresInSeconds = 120) {
  return getAppRepository().createSignedDocumentUrl(documentId, expiresInSeconds);
}
