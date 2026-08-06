import "server-only";

import type { CanonicalFormData } from "@/server/forms/canonical-data-service";
import type { FormRegistryEntry } from "@/server/forms/registry";

export interface MappedFormOutput {
  fieldValues: Record<string, string>;
  filledFields: string[];
  skippedFields: string[];
  missingRequiredFields: string[];
  unsupportedFields: string[];
  manualReviewFields: string[];
  warnings: string[];
}

function formatDate(value: string, rule: FormRegistryEntry["dateFormatting"]): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  if (rule === "YYYY-MM-DD") return `${y}-${m}-${d}`;
  if (rule === "DD-MM-YYYY") return `${d}-${m}-${y}`;
  return `${y}-${m}-${d}`;
}

function normalizeValue(raw: string, transform: FormRegistryEntry["fieldMappings"][number]["transform"], dateRule: FormRegistryEntry["dateFormatting"]): string {
  if (!transform) return raw;
  if (transform === "upper") return raw.toUpperCase();
  if (transform === "date") return formatDate(raw, dateRule);
  if (transform === "boolean_yes_no") return raw.toLowerCase() === "true" ? "Yes" : "No";
  if (transform === "phone") return raw.replace(/[^+0-9]/g, "");
  return raw;
}

function getCanonicalValue(canonical: CanonicalFormData, sourceKey: string): string | null {
  const direct = canonical.values[sourceKey];
  if (direct !== undefined) return direct;
  if (sourceKey.startsWith("fact.")) {
    const factKey = sourceKey.replace("fact.", "");
    const fact = canonical.approvedFacts.find((item) => item.key === factKey);
    return fact?.value ?? null;
  }
  return null;
}

export function mapCanonicalDataToForm(entry: FormRegistryEntry, canonical: CanonicalFormData): MappedFormOutput {
  const fieldValues: Record<string, string> = {};
  const filledFields: string[] = [];
  const skippedFields: string[] = [];
  const missingRequiredFields: string[] = [];
  const warnings: string[] = [];

  for (const mapping of entry.fieldMappings) {
    const raw = getCanonicalValue(canonical, mapping.sourceKey);
    if (!raw) {
      if (mapping.required) missingRequiredFields.push(mapping.targetField);
      skippedFields.push(mapping.targetField);
      continue;
    }

    let value = normalizeValue(raw, mapping.transform, entry.dateFormatting);
    if (mapping.multiline) value = value.replace(/\r?\n/g, "\n");
    fieldValues[mapping.targetField] = value;
    filledFields.push(mapping.targetField);
  }

  for (const mapping of entry.checkboxMappings) {
    const raw = getCanonicalValue(canonical, mapping.sourceKey);
    if (raw === null) {
      skippedFields.push(mapping.targetField);
      continue;
    }
    const isChecked = ["1", "true", "yes", "y"].includes(raw.toLowerCase());
    fieldValues[mapping.targetField] = isChecked ? mapping.checkedValue : mapping.uncheckedValue;
    filledFields.push(mapping.targetField);
  }

  for (const mapping of entry.radioMappings) {
    const raw = getCanonicalValue(canonical, mapping.sourceKey);
    if (!raw) {
      skippedFields.push(mapping.groupName);
      continue;
    }
    const option = mapping.options.find((item) => item.sourceValue.toLowerCase() === raw.toLowerCase());
    if (!option) {
      warnings.push(`No radio option matched ${mapping.groupName} for value '${raw}'.`);
      skippedFields.push(mapping.groupName);
      continue;
    }
    fieldValues[option.targetField] = "Yes";
    filledFields.push(option.targetField);
  }

  for (const section of entry.repeatableSections) {
    const candidates = canonical.participants.filter((item) => {
      if (section.sourceCollection === "dependants") {
        return item.relationship.includes("dependant");
      }
      return item.relationship === "spouse" || item.relationship === "common_law_partner" || item.relationship.includes("dependant") || item.relationship === "other_family_member";
    });

    const selected = candidates.slice(0, section.maxItems);
    if (candidates.length > section.maxItems) {
      warnings.push(`${section.key} exceeds supported repeat count (${section.maxItems}).`);
    }

    selected.forEach((participant, index) => {
      const slot = index + 1;
      for (const template of section.fieldTemplates) {
        const fieldName = template.targetFieldPattern.replace("{index}", String(slot));
        const lowerSource = template.sourceKey.toLowerCase();
        let value: string | null = null;
        if (lowerSource === "legal_name") value = participant.legalName;
        if (lowerSource === "relationship") value = participant.relationship;
        if (lowerSource === "date_of_birth") value = participant.dateOfBirth;

        if (!value) {
          if (template.required) missingRequiredFields.push(fieldName);
          skippedFields.push(fieldName);
          continue;
        }

        if (lowerSource === "date_of_birth") {
          value = formatDate(value, entry.dateFormatting);
        }

        fieldValues[fieldName] = value;
        filledFields.push(fieldName);
      }
    });
  }

  const unsupportedFields = [...entry.unsupportedFields];
  const manualReviewFields = [...entry.requiredManualReviewFields];
  for (const rule of entry.validationRules) {
    if (!rule.required) continue;
    if (rule.key === "principal_name" && !fieldValues.PA_SURNAME && !fieldValues.PA_GIVEN_NAMES) {
      warnings.push(rule.description);
    }
    if (rule.key === "principal_dob" && !fieldValues.PA_DOB) {
      warnings.push(rule.description);
    }
    if (rule.key === "decl_identity" && !fieldValues.DECL_FULL_NAME) {
      warnings.push(rule.description);
    }
    if (rule.key === "family_list" && !Object.keys(fieldValues).some((key) => key.startsWith("FAM_"))) {
      warnings.push(rule.description);
    }
    if (rule.key === "rep_identity" && !fieldValues.REP_NAME) {
      warnings.push(rule.description);
    }
  }

  return {
    fieldValues,
    filledFields,
    skippedFields,
    missingRequiredFields,
    unsupportedFields,
    manualReviewFields,
    warnings,
  };
}
