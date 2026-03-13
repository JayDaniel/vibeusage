export function getSupabaseUrl() {
  const env = typeof import.meta !== "undefined" ? import.meta.env : undefined;
  return (
    env?.VITE_VIBEUSAGE_SUPABASE_URL ||
    env?.VITE_SUPABASE_URL ||
    env?.VITE_VIBEUSAGE_INSFORGE_BASE_URL ||
    env?.VITE_INSFORGE_BASE_URL ||
    "https://5tmappuk.us-east.insforge.app /* legacy fallback */"
  );
}

export function getSupabaseAnonKey() {
  const env = typeof import.meta !== "undefined" ? import.meta.env : undefined;
  return (
    env?.VITE_VIBEUSAGE_SUPABASE_ANON_KEY ||
    env?.VITE_SUPABASE_ANON_KEY ||
    env?.VITE_VIBEUSAGE_INSFORGE_ANON_KEY ||
    env?.VITE_INSFORGE_ANON_KEY ||
    ""
  );
}
