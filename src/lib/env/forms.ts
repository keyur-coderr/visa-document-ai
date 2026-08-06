export interface FormEngineEnv {
  provider: "mock" | "local";
}

export function getFormEngineEnv(): FormEngineEnv {
  const configured = (process.env.FORM_PDF_PROVIDER ?? "").trim().toLowerCase();
  if (configured === "local") {
    return { provider: "local" };
  }
  return { provider: "mock" };
}
