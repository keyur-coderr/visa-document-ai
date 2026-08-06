import "server-only";

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { getFormEngineEnv } from "@/lib/env/forms";
import type { FormRegistryEntry } from "@/server/forms/registry";

export interface PdfSafetyInspection {
  mode: "acroform" | "xfa" | "protected" | "flattened" | "missing" | "unsupported";
  safeToModify: boolean;
  reason: string | null;
}

export interface PdfFillRequest {
  entry: FormRegistryEntry;
  mappedValues: Record<string, string>;
}

export interface PdfFillResult {
  bytes: Uint8Array | null;
  storageReference: string | null;
  filledFields: string[];
  skippedFields: string[];
  warnings: string[];
  unsupportedFormReason: string | null;
  checksum: string | null;
  provider: {
    name: string;
    version: string;
    mode: "mock" | "local";
  };
  templateInspection: PdfSafetyInspection;
}

export interface PdfFillProvider {
  fill(request: PdfFillRequest): Promise<PdfFillResult>;
}

function checksumForBytes(bytes: Uint8Array): string {
  return `sha256:${createHash("sha256").update(Buffer.from(bytes)).digest("hex")}`;
}

function inspectTemplateBuffer(bytes: Uint8Array): PdfSafetyInspection {
  const text = Buffer.from(bytes).toString("latin1");
  const hasPdfHeader = text.includes("%PDF");
  const hasXfa = /\/XFA\b/.test(text);
  const hasEncrypt = /\/Encrypt\b/.test(text);
  const hasAcroForm = /\/AcroForm\b/.test(text);
  const hasFields = /\/Fields\b/.test(text);

  if (!hasPdfHeader) {
    return { mode: "unsupported", safeToModify: false, reason: "Template is not a valid PDF binary." };
  }
  if (hasEncrypt) {
    return { mode: "protected", safeToModify: false, reason: "Template is password-protected or encrypted." };
  }
  if (hasXfa) {
    return { mode: "xfa", safeToModify: false, reason: "XFA-based PDF is unsupported for safe programmatic filling." };
  }
  if (!hasAcroForm || !hasFields) {
    return { mode: "flattened", safeToModify: false, reason: "Template is flattened or lacks AcroForm fields." };
  }

  return { mode: "acroform", safeToModify: true, reason: null };
}

class MockPdfFillProvider implements PdfFillProvider {
  async fill(request: PdfFillRequest): Promise<PdfFillResult> {
    const unsupportedByRegistry = request.entry.templateMode !== "acroform";
    const warnings: string[] = [];

    if (unsupportedByRegistry) {
      warnings.push(`Template mode ${request.entry.templateMode} is not fillable in mock provider.`);
    }

    return {
      bytes: null,
      storageReference: null,
      filledFields: Object.keys(request.mappedValues),
      skippedFields: [],
      warnings,
      unsupportedFormReason: unsupportedByRegistry ? `Unsupported template mode: ${request.entry.templateMode}` : null,
      checksum: null,
      provider: {
        name: "mock-pdf-provider",
        version: "1.0.0",
        mode: "mock",
      },
      templateInspection: {
        mode: request.entry.templateMode,
        safeToModify: request.entry.templateMode === "acroform",
        reason: request.entry.templateMode === "acroform" ? null : `Template mode ${request.entry.templateMode} is not safely modifiable.`,
      },
    };
  }
}

class LocalPdfFillProvider implements PdfFillProvider {
  async fill(request: PdfFillRequest): Promise<PdfFillResult> {
    try {
      const bytes = new Uint8Array(await readFile(request.entry.templatePath));
      const inspection = inspectTemplateBuffer(bytes);
      if (!inspection.safeToModify) {
        return {
          bytes: null,
          storageReference: null,
          filledFields: [],
          skippedFields: Object.keys(request.mappedValues),
          warnings: [inspection.reason ?? "Template is not safely modifiable."],
          unsupportedFormReason: inspection.reason,
          checksum: null,
          provider: {
            name: "local-pdf-provider",
            version: "1.0.0",
            mode: "local",
          },
          templateInspection: inspection,
        };
      }

      // This provider intentionally does not rewrite the official PDF template without a vetted field-level writer.
      // It returns a safe, review-only payload until a validated AcroForm writer is integrated.
      const summaryPayload = Buffer.from(
        JSON.stringify({
          templateIdentifier: request.entry.templateIdentifier,
          fieldCount: Object.keys(request.mappedValues).length,
          mappedValues: request.mappedValues,
        }, null, 2),
      );

      return {
        bytes: summaryPayload,
        storageReference: null,
        filledFields: Object.keys(request.mappedValues),
        skippedFields: [],
        warnings: ["Local provider generated a review payload. Official PDF field-writing is not enabled yet."],
        unsupportedFormReason: null,
        checksum: checksumForBytes(summaryPayload),
        provider: {
          name: "local-pdf-provider",
          version: "1.0.0",
          mode: "local",
        },
        templateInspection: inspection,
      };
    } catch {
      return {
        bytes: null,
        storageReference: null,
        filledFields: [],
        skippedFields: Object.keys(request.mappedValues),
        warnings: ["Template file could not be loaded."],
        unsupportedFormReason: "Template file missing or unreadable.",
        checksum: null,
        provider: {
          name: "local-pdf-provider",
          version: "1.0.0",
          mode: "local",
        },
        templateInspection: {
          mode: "missing",
          safeToModify: false,
          reason: "Template file missing or unreadable.",
        },
      };
    }
  }
}

export function getPdfFillProvider(): PdfFillProvider {
  const env = getFormEngineEnv();
  if (env.provider === "local") return new LocalPdfFillProvider();
  return new MockPdfFillProvider();
}
