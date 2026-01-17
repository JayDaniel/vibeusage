/**
 * Dashboard Configuration
 *
 * Supports both Supabase (new) and InsForge (legacy) backends.
 * Supabase configuration takes priority.
 */

// Default Supabase configuration
const DEFAULT_SUPABASE_URL = "https://llzgqbytjhcizqixvhwm.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_L3vp-LjqP0ajHkznn_q8PQ_RETKxR6Z";

/**
 * Get backend base URL
 * Priority: Supabase URL > InsForge URL > Default Supabase
 */
export function getInsforgeBaseUrl() {
  const env = typeof import.meta !== "undefined" ? import.meta.env : undefined;
  return (
    env?.VITE_SUPABASE_URL ||
    env?.VITE_VIBEUSAGE_SUPABASE_URL ||
    env?.VITE_VIBEUSAGE_INSFORGE_BASE_URL ||
    env?.VITE_VIBESCORE_INSFORGE_BASE_URL ||
    DEFAULT_SUPABASE_URL
  );
}

/**
 * Get Supabase URL (alias for getInsforgeBaseUrl)
 */
export function getSupabaseUrl() {
  return getInsforgeBaseUrl();
}

/**
 * Get anon key
 * Priority: Supabase anon key > InsForge anon key > Default
 */
export function getInsforgeAnonKey() {
  const env = typeof import.meta !== "undefined" ? import.meta.env : undefined;
  return (
    env?.VITE_SUPABASE_ANON_KEY ||
    env?.VITE_VIBEUSAGE_SUPABASE_ANON_KEY ||
    env?.VITE_VIBEUSAGE_INSFORGE_ANON_KEY ||
    env?.VITE_VIBESCORE_INSFORGE_ANON_KEY ||
    env?.VITE_INSFORGE_ANON_KEY ||
    DEFAULT_SUPABASE_ANON_KEY
  );
}

/**
 * Get Supabase anon key (alias for getInsforgeAnonKey)
 */
export function getSupabaseAnonKey() {
  return getInsforgeAnonKey();
}

/**
 * Check if using Supabase backend
 */
export function isSupabaseMode() {
  const url = getInsforgeBaseUrl();
  return url.includes("supabase.co") || url.includes("supabase.io");
}

/**
 * Get HTTP timeout in milliseconds
 */
export function getHttpTimeoutMs() {
  const env = typeof import.meta !== "undefined" ? import.meta.env : undefined;
  const raw = env?.VITE_VIBEUSAGE_HTTP_TIMEOUT_MS || env?.VITE_VIBESCORE_HTTP_TIMEOUT_MS;
  if (!raw) return 15000;
  const n = Number(raw);
  if (!Number.isFinite(n)) return 15000;
  if (n <= 0) return 0;
  return Math.min(120000, Math.max(1000, Math.floor(n)));
}
