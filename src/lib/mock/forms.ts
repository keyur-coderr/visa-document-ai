import type { FormCode, FormStatus } from "@/server/forms/registry";

export interface MockGeneratedForm {
  id: string;
  caseId: string;
  formCode: FormCode;
  formName: string;
  formVersion: string;
  mappingVersion: number;
  status: "draft" | "generating" | "generated" | "needs_review" | "approved" | "failed" | "unsupported" | "archived";
  latestVersion: number;
  generatedFilePath: string | null;
  checksum: string | null;
  manualReviewRequired: boolean;
  approvedBy: string | null;
  approvedAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MockGeneratedFormVersion {
  id: string;
  generatedFormId: string;
  caseId: string;
  version: number;
  formCode: FormCode;
  formVersion: string;
  mappingVersion: number;
  generationStatus: MockGeneratedForm["status"];
  providerName: string;
  providerVersion: string;
  templateMode: string;
  sourceFactIds: string[];
  mappedFields: Record<string, string>;
  filledFields: string[];
  skippedFields: string[];
  unsupportedFields: string[];
  manualReviewFields: string[];
  missingRequiredFields: string[];
  warnings: string[];
  generatedFilePath: string | null;
  checksum: string | null;
  generatedBy: string;
  generatedAt: string;
}

export interface MockFormGenerationRun {
  id: string;
  generatedFormId: string;
  generatedFormVersionId: string;
  caseId: string;
  formCode: FormCode;
  formVersion: string;
  mappingVersion: number;
  providerName: string;
  providerVersion: string;
  status: MockGeneratedForm["status"];
  unsupportedReason: string | null;
  skippedFields: string[];
  warnings: string[];
  createdBy: string;
  startedAt: string;
  completedAt: string;
}

export interface MockFormValidationWarning {
  id: string;
  runId: string;
  generatedFormVersionId: string;
  caseId: string;
  warningKey: string;
  severity: "low" | "medium" | "high";
  message: string;
  fieldName: string | null;
  createdAt: string;
}

export interface MockFormApproval {
  id: string;
  generatedFormId: string;
  generatedFormVersionId: string;
  caseId: string;
  action: "approve" | "reject" | "override";
  notes: string | null;
  approvedBy: string;
  approvedAt: string;
}

export interface MockCaseFormAvailability {
  caseId: string;
  formCode: FormCode;
  status: FormStatus;
}

export const mockGeneratedForms: MockGeneratedForm[] = [];
export const mockGeneratedFormVersions: MockGeneratedFormVersion[] = [];
export const mockFormGenerationRuns: MockFormGenerationRun[] = [];
export const mockFormValidationWarnings: MockFormValidationWarning[] = [];
export const mockFormApprovals: MockFormApproval[] = [];
