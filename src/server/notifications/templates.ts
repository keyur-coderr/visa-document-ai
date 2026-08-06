import "server-only";

export interface NotificationTemplate {
  key:
    | "documents_requested"
    | "reminder"
    | "documents_missing"
    | "review_complete"
    | "forms_ready"
    | "application_submitted"
    | "aor"
    | "biometrics"
    | "medical"
    | "adr"
    | "passport_request"
    | "congratulations";
  displayName: string;
  channel: "email" | "whatsapp" | "in_app";
  subject: string;
  body: string;
  variables: string[];
}

export const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  { key: "documents_requested", displayName: "Documents Requested", channel: "in_app", subject: "Documents requested", body: "Your team requested additional documents for {{caseTitle}}.", variables: ["caseTitle"] },
  { key: "reminder", displayName: "Reminder", channel: "in_app", subject: "Reminder", body: "Reminder: {{message}}", variables: ["message"] },
  { key: "documents_missing", displayName: "Documents Missing", channel: "in_app", subject: "Missing documents", body: "Some required documents are still missing for {{caseTitle}}.", variables: ["caseTitle"] },
  { key: "review_complete", displayName: "Review Complete", channel: "in_app", subject: "Review complete", body: "Consultant review has been completed for {{caseTitle}}.", variables: ["caseTitle"] },
  { key: "forms_ready", displayName: "Forms Ready", channel: "in_app", subject: "Forms ready", body: "Forms are ready for review for {{caseTitle}}.", variables: ["caseTitle"] },
  { key: "application_submitted", displayName: "Application Submitted", channel: "in_app", subject: "Application submitted", body: "Application has been submitted for {{caseTitle}}.", variables: ["caseTitle"] },
  { key: "aor", displayName: "AOR", channel: "in_app", subject: "AOR update", body: "AOR received for {{caseTitle}}.", variables: ["caseTitle"] },
  { key: "biometrics", displayName: "Biometrics", channel: "in_app", subject: "Biometrics update", body: "Biometrics stage updated for {{caseTitle}}.", variables: ["caseTitle"] },
  { key: "medical", displayName: "Medical", channel: "in_app", subject: "Medical update", body: "Medical stage updated for {{caseTitle}}.", variables: ["caseTitle"] },
  { key: "adr", displayName: "ADR", channel: "in_app", subject: "ADR update", body: "Additional document request requires attention for {{caseTitle}}.", variables: ["caseTitle"] },
  { key: "passport_request", displayName: "Passport Request", channel: "in_app", subject: "Passport request", body: "Passport request stage has started for {{caseTitle}}.", variables: ["caseTitle"] },
  { key: "congratulations", displayName: "Congratulations", channel: "in_app", subject: "Congratulations", body: "Congratulations. {{caseTitle}} reached COPR.", variables: ["caseTitle"] },
];

export function renderTemplate(template: NotificationTemplate, variables: Record<string, string>): { subject: string; body: string } {
  let subject = template.subject;
  let body = template.body;
  for (const [key, value] of Object.entries(variables)) {
    subject = subject.replaceAll(`{{${key}}}`, value);
    body = body.replaceAll(`{{${key}}}`, value);
  }
  return { subject, body };
}

export function getNotificationTemplate(key: NotificationTemplate["key"]): NotificationTemplate | null {
  return NOTIFICATION_TEMPLATES.find((item) => item.key === key) ?? null;
}
