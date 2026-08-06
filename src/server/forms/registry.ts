import type { StreamKey } from "@/config/immigration-streams/schema";

export type FormCode = "IMM 0008" | "IMM 5669" | "IMM 5406" | "IMM 5476";
export type FormStatus = "supported" | "partial" | "unsupported";
export type ParticipantApplicability = "principal_applicant" | "spouse" | "dependant_child" | "representative";
export type DateFormatRule = "YYYY-MM-DD" | "DD-MM-YYYY" | "IRCC_DATE";

export interface FormValidationRule {
  key: string;
  description: string;
  required: boolean;
}

export interface FieldMappingRule {
  targetField: string;
  sourceKey: string;
  required: boolean;
  transform?: "upper" | "date" | "boolean_yes_no" | "phone";
  multiline?: boolean;
}

export interface CheckboxMappingRule {
  targetField: string;
  sourceKey: string;
  checkedValue: string;
  uncheckedValue: string;
}

export interface RadioMappingRule {
  groupName: string;
  sourceKey: string;
  options: Array<{ sourceValue: string; targetField: string }>;
}

export interface RepeatableSectionRule {
  key: string;
  sourceCollection: "dependants" | "family_members";
  maxItems: number;
  fieldTemplates: Array<{ targetFieldPattern: string; sourceKey: string; required: boolean }>;
}

export interface FormRegistryEntry {
  code: FormCode;
  formName: string;
  version: string;
  effectiveDate: string;
  templateIdentifier: string;
  templatePath: string;
  templateMode: "acroform" | "xfa" | "protected" | "flattened" | "missing";
  supportedStreams: StreamKey[];
  applicability: ParticipantApplicability[];
  fieldMappings: FieldMappingRule[];
  checkboxMappings: CheckboxMappingRule[];
  radioMappings: RadioMappingRule[];
  dateFormatting: DateFormatRule;
  repeatableSections: RepeatableSectionRule[];
  signatureFields: string[];
  requiredManualReviewFields: string[];
  unsupportedFields: string[];
  validationRules: FormValidationRule[];
  status: FormStatus;
  mappingVersion: number;
}

export const FORM_REGISTRY: FormRegistryEntry[] = [
  {
    code: "IMM 0008",
    formName: "Generic Application Form for Canada",
    version: "2026-01",
    effectiveDate: "2026-01-01",
    templateIdentifier: "imm0008-2026-01",
    templatePath: "templates/ircc/imm0008/IMM0008_2026-01.pdf",
    templateMode: "missing",
    supportedStreams: ["express-entry-fswp", "express-entry-cec", "express-entry-fstp", "pnp", "spousal-sponsorship-inland", "spousal-sponsorship-outland"],
    applicability: ["principal_applicant", "spouse", "dependant_child"],
    fieldMappings: [
      { targetField: "PA_SURNAME", sourceKey: "person.principal.last_name", required: true, transform: "upper" },
      { targetField: "PA_GIVEN_NAMES", sourceKey: "person.principal.given_names", required: true },
      { targetField: "PA_DOB", sourceKey: "person.principal.date_of_birth", required: true, transform: "date" },
      { targetField: "PA_UCI", sourceKey: "person.principal.uci", required: false },
      { targetField: "PA_COUNTRY_OF_BIRTH", sourceKey: "person.principal.country_of_birth", required: true },
      { targetField: "PA_MARITAL_STATUS", sourceKey: "person.principal.marital_status", required: true },
    ],
    checkboxMappings: [
      { targetField: "HAS_REPRESENTATIVE", sourceKey: "representation.has_representative", checkedValue: "Yes", uncheckedValue: "No" },
    ],
    radioMappings: [
      {
        groupName: "LANGUAGE_PREF",
        sourceKey: "person.principal.language_preference",
        options: [
          { sourceValue: "english", targetField: "LANGUAGE_EN" },
          { sourceValue: "french", targetField: "LANGUAGE_FR" },
        ],
      },
    ],
    dateFormatting: "IRCC_DATE",
    repeatableSections: [
      {
        key: "dependants",
        sourceCollection: "dependants",
        maxItems: 5,
        fieldTemplates: [
          { targetFieldPattern: "DEP_{index}_NAME", sourceKey: "legal_name", required: true },
          { targetFieldPattern: "DEP_{index}_DOB", sourceKey: "date_of_birth", required: true },
          { targetFieldPattern: "DEP_{index}_REL", sourceKey: "relationship", required: true },
        ],
      },
    ],
    signatureFields: ["PA_SIGNATURE", "PA_SIGNATURE_DATE"],
    requiredManualReviewFields: ["PA_SIGNATURE", "PA_SIGNATURE_DATE"],
    unsupportedFields: ["barcode_2d", "dynamic_validation_panel"],
    validationRules: [
      { key: "principal_name", description: "Principal applicant legal name is required.", required: true },
      { key: "principal_dob", description: "Principal applicant DOB is required.", required: true },
    ],
    status: "partial",
    mappingVersion: 1,
  },
  {
    code: "IMM 5669",
    formName: "Schedule A - Background/Declaration",
    version: "2025-12",
    effectiveDate: "2025-12-01",
    templateIdentifier: "imm5669-2025-12",
    templatePath: "templates/ircc/imm5669/IMM5669_2025-12.pdf",
    templateMode: "missing",
    supportedStreams: ["express-entry-fswp", "express-entry-cec", "express-entry-fstp", "pnp", "spousal-sponsorship-inland", "spousal-sponsorship-outland"],
    applicability: ["principal_applicant", "spouse"],
    fieldMappings: [
      { targetField: "DECL_FULL_NAME", sourceKey: "person.principal.legal_name", required: true },
      { targetField: "DECL_DOB", sourceKey: "person.principal.date_of_birth", required: true, transform: "date" },
      { targetField: "DECL_BIRTH_CITY", sourceKey: "person.principal.birth_city", required: true },
      { targetField: "DECL_NATIONALITY", sourceKey: "person.principal.nationality", required: true },
    ],
    checkboxMappings: [],
    radioMappings: [],
    dateFormatting: "IRCC_DATE",
    repeatableSections: [],
    signatureFields: ["DECL_SIGNATURE", "DECL_DATE"],
    requiredManualReviewFields: ["DECL_SIGNATURE", "DECL_DATE"],
    unsupportedFields: ["history_table_row_add_remove"],
    validationRules: [
      { key: "decl_identity", description: "Identity fields must be complete.", required: true },
    ],
    status: "partial",
    mappingVersion: 1,
  },
  {
    code: "IMM 5406",
    formName: "Additional Family Information",
    version: "2025-11",
    effectiveDate: "2025-11-01",
    templateIdentifier: "imm5406-2025-11",
    templatePath: "templates/ircc/imm5406/IMM5406_2025-11.pdf",
    templateMode: "missing",
    supportedStreams: ["express-entry-fswp", "express-entry-cec", "express-entry-fstp", "pnp", "spousal-sponsorship-inland", "spousal-sponsorship-outland", "study-permit", "visitor-visa-trv"],
    applicability: ["principal_applicant", "spouse", "dependant_child"],
    fieldMappings: [
      { targetField: "PA_NAME", sourceKey: "person.principal.legal_name", required: true },
      { targetField: "PA_DOB", sourceKey: "person.principal.date_of_birth", required: true, transform: "date" },
    ],
    checkboxMappings: [],
    radioMappings: [],
    dateFormatting: "IRCC_DATE",
    repeatableSections: [
      {
        key: "family_members",
        sourceCollection: "family_members",
        maxItems: 6,
        fieldTemplates: [
          { targetFieldPattern: "FAM_{index}_NAME", sourceKey: "legal_name", required: true },
          { targetFieldPattern: "FAM_{index}_REL", sourceKey: "relationship", required: true },
          { targetFieldPattern: "FAM_{index}_DOB", sourceKey: "date_of_birth", required: false },
        ],
      },
    ],
    signatureFields: ["FAMILY_SIGNATURE", "FAMILY_DATE"],
    requiredManualReviewFields: ["FAMILY_SIGNATURE", "FAMILY_DATE"],
    unsupportedFields: [],
    validationRules: [
      { key: "family_list", description: "At least one family member section must be reviewed.", required: true },
    ],
    status: "partial",
    mappingVersion: 1,
  },
  {
    code: "IMM 5476",
    formName: "Use of a Representative",
    version: "2025-10",
    effectiveDate: "2025-10-01",
    templateIdentifier: "imm5476-2025-10",
    templatePath: "templates/ircc/imm5476/IMM5476_2025-10.pdf",
    templateMode: "missing",
    supportedStreams: ["express-entry-fswp", "express-entry-cec", "express-entry-fstp", "pnp", "spousal-sponsorship-inland", "spousal-sponsorship-outland", "study-permit", "visitor-visa-trv", "work-permit-lmia-based", "work-permit-lmia-exempt"],
    applicability: ["principal_applicant", "representative"],
    fieldMappings: [
      { targetField: "CLIENT_NAME", sourceKey: "person.principal.legal_name", required: true },
      { targetField: "CLIENT_UCI", sourceKey: "person.principal.uci", required: false },
      { targetField: "REP_NAME", sourceKey: "representation.representative_name", required: true },
      { targetField: "REP_EMAIL", sourceKey: "representation.representative_email", required: true },
    ],
    checkboxMappings: [
      { targetField: "CANCEL_PREV_REP", sourceKey: "representation.cancel_previous", checkedValue: "Yes", uncheckedValue: "No" },
    ],
    radioMappings: [],
    dateFormatting: "IRCC_DATE",
    repeatableSections: [],
    signatureFields: ["CLIENT_SIGNATURE", "CLIENT_SIGN_DATE"],
    requiredManualReviewFields: ["CLIENT_SIGNATURE", "CLIENT_SIGN_DATE", "REP_SIGNATURE"],
    unsupportedFields: ["third_party_submission_section"],
    validationRules: [
      { key: "rep_identity", description: "Representative identity/contact required when representative is used.", required: true },
    ],
    status: "partial",
    mappingVersion: 1,
  },
];

export function getFormRegistryEntry(formCode: FormCode): FormRegistryEntry | null {
  return FORM_REGISTRY.find((entry) => entry.code === formCode) ?? null;
}

export function listFormsForStream(stream: StreamKey): FormRegistryEntry[] {
  return FORM_REGISTRY.filter((entry) => entry.supportedStreams.includes(stream));
}
