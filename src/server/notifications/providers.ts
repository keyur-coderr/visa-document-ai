import "server-only";

export interface NotificationDispatchInput {
  channel: "email" | "whatsapp" | "in_app";
  recipientId: string;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationDispatchResult {
  success: boolean;
  providerName: string;
  providerVersion: string;
  externalId?: string;
  errorMessage?: string;
}

export interface NotificationProvider {
  readonly name: string;
  readonly version: string;
  send(input: NotificationDispatchInput): Promise<NotificationDispatchResult>;
}

class MockEmailProvider implements NotificationProvider {
  readonly name = "mock-email-provider";
  readonly version = "1.0.0";
  async send(input: NotificationDispatchInput): Promise<NotificationDispatchResult> {
    return { success: true, providerName: this.name, providerVersion: this.version, externalId: `email-${input.recipientId}-${Date.now()}` };
  }
}

class MockWhatsAppProvider implements NotificationProvider {
  readonly name = "mock-whatsapp-provider";
  readonly version = "1.0.0";
  async send(input: NotificationDispatchInput): Promise<NotificationDispatchResult> {
    return { success: true, providerName: this.name, providerVersion: this.version, externalId: `wa-${input.recipientId}-${Date.now()}` };
  }
}

class MockInAppProvider implements NotificationProvider {
  readonly name = "mock-inapp-provider";
  readonly version = "1.0.0";
  async send(input: NotificationDispatchInput): Promise<NotificationDispatchResult> {
    return { success: true, providerName: this.name, providerVersion: this.version, externalId: `inapp-${input.recipientId}-${Date.now()}` };
  }
}

const providerMap: Record<NotificationDispatchInput["channel"], NotificationProvider> = {
  email: new MockEmailProvider(),
  whatsapp: new MockWhatsAppProvider(),
  in_app: new MockInAppProvider(),
};

export function getNotificationProvider(channel: NotificationDispatchInput["channel"]): NotificationProvider {
  return providerMap[channel];
}
