import "server-only";

import { isSupabaseEnabled } from "@/lib/env/supabase";
import type { AppRepository } from "@/server/repositories/contracts";
import { MockRepository } from "@/server/repositories/mock-repository";
import { SupabaseRepository } from "@/server/repositories/supabase-repository";

let mockRepo: AppRepository | null = null;
let supabaseRepo: AppRepository | null = null;

export function getAppRepository(): AppRepository {
  if (isSupabaseEnabled()) {
    if (!supabaseRepo) {
      supabaseRepo = new SupabaseRepository();
    }
    return supabaseRepo;
  }

  if (!mockRepo) {
    mockRepo = new MockRepository();
  }

  return mockRepo;
}
