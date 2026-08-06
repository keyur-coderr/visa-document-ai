import "server-only";

import {
  getCaseById,
  mockCaseRecords,
  mockClients,
} from "@/lib/mock/case-management";
import { mockManagedDocuments } from "@/lib/mock/documents";
import type { AppRepository, AssignmentRecord, AuditEventInput, CaseRecord, ClientRecord, CurrentUserContext, DocumentRecord } from "@/server/repositories/contracts";

export class MockRepository implements AppRepository {
  readonly mode = "mock" as const;

  async getCurrentUserContext(): Promise<CurrentUserContext> {
    return {
      userId: "mock-practitioner-1",
      email: "practitioner.mock@fictional-firm.local",
      role: "practitioner",
      firmId: "firm_mock_001",
      clientId: null,
    };
  }

  async listClients(): Promise<ClientRecord[]> {
    return mockClients.map((client) => ({
      id: client.id,
      legalName: client.legalName,
      email: client.email,
      language: client.language,
      status: client.status,
    }));
  }

  async listCases(): Promise<CaseRecord[]> {
    return mockCaseRecords.map((record) => ({
      id: record.id,
      title: record.title,
      clientId: record.clientId,
      streamKey: record.streamKey,
      streamConfigVersion: 1,
      status: record.status,
    }));
  }

  async listAssignments(caseId: string): Promise<AssignmentRecord[]> {
    const caseRecord = getCaseById(caseId);
    if (!caseRecord) return [];

    const rows: AssignmentRecord[] = [
      {
        id: `${caseId}-practitioner`,
        caseId,
        userId: caseRecord.assignedPractitionerId,
        role: "practitioner",
        isPrimary: true,
      },
    ];

    if (caseRecord.assignedAssistantId) {
      rows.push({
        id: `${caseId}-assistant`,
        caseId,
        userId: caseRecord.assignedAssistantId,
        role: "assistant",
        isPrimary: false,
      });
    }

    return rows;
  }

  async listCaseDocuments(caseId: string): Promise<DocumentRecord[]> {
    return mockManagedDocuments
      .filter((document) => document.caseId === caseId)
      .map((document) => ({
        id: document.id,
        caseId: document.caseId,
        filename: document.filename,
        status: document.status,
        storagePath: `firm/firm_mock_001/case/${document.caseId}/${document.filename}`,
        uploadedAt: document.uploadedAt,
      }));
  }

  async createSignedDocumentUrl(documentId: string): Promise<string | null> {
    const document = mockManagedDocuments.find((item) => item.id === documentId);
    if (!document) return null;
    return `/mock-download/${document.id}`;
  }

  async logAuditEvent(_input: AuditEventInput): Promise<void> {
    return;
  }
}
