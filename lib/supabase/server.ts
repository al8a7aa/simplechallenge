import "server-only";

import { auth } from "@clerk/nextjs/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers,
 * acting as the signed-in user.
 *
 * Clerk is Supabase's third-party auth provider: every request carries the
 * user's Clerk session token, and Row Level Security checks
 * `auth.jwt()->>'sub'` against each row's user_id.
 */
export async function createServerSupabase(): Promise<SupabaseClient> {
  const { getToken } = await auth();
  return createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
    accessToken: async () => (await getToken()) ?? null,
  });
}

/**
 * Service-role client that bypasses RLS. Only for writes to the shared
 * `products` table. Never pass data from it to the browser unfiltered.
 */
export function createAdminSupabase(): SupabaseClient {
  return createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}. See .env.example.`);
  return value;
}
