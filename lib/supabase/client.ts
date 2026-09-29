import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True when NEXT_PUBLIC_SUPABASE_URL + ANON_KEY are present. */
export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey);
}

let warned = false;

/**
 * Browser Supabase client (session stored in httpOnly cookies via @supabase/ssr).
 * Throws a clear error when env vars are missing — pages that can run without
 * a database (e.g. menu browsing with the seed catalog) check
 * isSupabaseConfigured() first.
 */
export function getSupabase() {
  if (!url || !anonKey) {
    if (!warned) {
      warned = true;
      console.warn(
        "Supabase is not configured — add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local",
      );
    }
    throw new Error(
      "Supabase is not configured yet. Add the keys to .env.local and restart the dev server.",
    );
  }
  return createBrowserClient(url, anonKey);
}
