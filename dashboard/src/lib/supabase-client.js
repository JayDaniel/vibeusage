import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl, getSupabaseAnonKey } from "./config.js";

let supabaseInstance = null;

/**
 * Get Supabase client singleton
 * @returns {import("@supabase/supabase-js").SupabaseClient}
 */
export function getSupabase() {
  if (supabaseInstance) return supabaseInstance;

  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();

  if (!url || !key) {
    console.error("VibeUsage: Supabase URL or Anon Key is missing.");
    // Return a placeholder object to prevent crashes
    return {
      auth: {
        signInWithPassword: () => Promise.reject(new Error("Supabase not configured")),
        signUp: () => Promise.reject(new Error("Supabase not configured")),
        getUser: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
        getSession: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signOut: () => Promise.resolve(),
      },
      functions: {
        invoke: () => Promise.reject(new Error("Supabase not configured")),
      },
      _isPlaceholder: true,
    };
  }

  supabaseInstance = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return supabaseInstance;
}

/**
 * Create Supabase client (for custom configuration scenarios)
 */
export function createSupabaseClient(options = {}) {
  const url = options.url || getSupabaseUrl();
  const key = options.key || getSupabaseAnonKey();

  if (!url || !key) {
    throw new Error("Supabase URL and Anon Key are required");
  }

  return createClient(url, key, {
    auth: {
      persistSession: options.persistSession ?? true,
      autoRefreshToken: options.autoRefreshToken ?? true,
      detectSessionInUrl: options.detectSessionInUrl ?? true,
    },
  });
}
