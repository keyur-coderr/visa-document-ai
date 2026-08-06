export interface SafeLogMetadata {
  [key: string]: string | number | boolean | null | undefined;
}

export function safeLog(event: string, metadata: SafeLogMetadata = {}): void {
  // Metadata-only logging by design: no payload/document content.
  console.info(`[safe-log] ${event}`, metadata);
}
