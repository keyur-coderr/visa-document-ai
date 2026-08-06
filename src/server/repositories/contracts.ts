import type { DocumentStatus, UserRole } from "@/types/domain";

export interface CurrentUserContext {
  userId: string;
  email: string;
  role: UserRole;
  firmId: string | null;
  clientId: string | null;
}

export interface ClientRecord {
  id: string;
  legalName: string;
  email: string;
  language: string;
  status: string;
}

export interface CaseRecord {
  id: string;
  title: string;
  clientId: string;
  streamKey: string;
  streamConfigVersion: number;
  status: string;
}

export interface AssignmentRecord {
  id: string;
  caseId: string;
  userId: string;
  role: Exclude<UserRole, "client">;
  isPrimary: boolean;
}

export interface DocumentRecord {
  id: string;
  caseId: string;
  filename: string;
  status: DocumentStatus;
  storagePath: string;
  uploadedAt: string;
}

export interface AuditEventInput {
  caseId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
}

export interface AppRepository {
  mode: "supabase" | "mock";
  getCurrentUserContext(): Promise<CurrentUserContext | null>;
  listClients(): Promise<ClientRecord[]>;
  listCases(): Promise<CaseRecord[]>;
  listAssignments(caseId: string): Promise<AssignmentRecord[]>;
  listCaseDocuments(caseId: string): Promise<DocumentRecord[]>;
  createSignedDocumentUrl(documentId: string, expiresInSeconds?: number): Promise<string | null>;
  logAuditEvent(input: AuditEventInput): Promise<void>;
}
