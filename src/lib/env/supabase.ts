export interface SupabaseEnv {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

export function getSupabaseEnv(): SupabaseEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return {
    url,
    anonKey,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

export function isSupabaseEnabled(): boolean {
  return getSupabaseEnv() !== null;
}

export function getRequiredSupabaseEnv(): SupabaseEnv {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error("Supabase environment variables are missing.");
  }
  return env;
}
