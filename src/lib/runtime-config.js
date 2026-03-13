const DEFAULT_BASE_URL = "https://5tmappuk.us-east.insforge.app /* TODO: update to Supabase URL */";
const DEFAULT_DASHBOARD_URL = "https://www.vibeusage.cc";
const DEFAULT_HTTP_TIMEOUT_MS = 20_000;

function resolveRuntimeConfig({ cli = {}, config = {}, env = process.env, defaults = {} } = {}) {
  const baseUrl = pickString(
    cli.baseUrl,
    config.baseUrl,
    env?.VIBEUSAGE_SUPABASE_URL,
    env?.VIBEUSAGE_INSFORGE_BASE_URL,
    defaults.baseUrl,
    DEFAULT_BASE_URL,
  );
  const dashboardUrl = pickString(
    cli.dashboardUrl,
    config.dashboardUrl,
    env?.VIBEUSAGE_DASHBOARD_URL,
    defaults.dashboardUrl,
    DEFAULT_DASHBOARD_URL,
  );
  const deviceToken = pickString(
    cli.deviceToken,
    config.deviceToken,
    env?.VIBEUSAGE_DEVICE_TOKEN,
    defaults.deviceToken,
    null,
  );
  const httpTimeoutMs = pickHttpTimeoutMs(
    cli.httpTimeoutMs,
    config.httpTimeoutMs,
    env?.VIBEUSAGE_HTTP_TIMEOUT_MS,
    defaults.httpTimeoutMs,
    DEFAULT_HTTP_TIMEOUT_MS,
  );
  const debug = pickBoolean(cli.debug, config.debug, env?.VIBEUSAGE_DEBUG, defaults.debug, false);
  const supabaseAnonKey = pickString(
    cli.supabaseAnonKey,
    cli.supabaseAnonKey,
    config.supabaseAnonKey,
    config.supabaseAnonKey,
    env?.VIBEUSAGE_SUPABASE_ANON_KEY,
    env?.VIBEUSAGE_INSFORGE_ANON_KEY,
    defaults.supabaseAnonKey,
    defaults.supabaseAnonKey,
    "",
  );
  if (supabaseAnonKey.value == null) supabaseAnonKey.value = "";
  const autoRetryNoSpawn = pickBoolean(
    cli.autoRetryNoSpawn,
    config.autoRetryNoSpawn,
    env?.VIBEUSAGE_AUTO_RETRY_NO_SPAWN,
    defaults.autoRetryNoSpawn,
    false,
  );

  return {
    baseUrl: baseUrl.value,
    dashboardUrl: dashboardUrl.value,
    deviceToken: deviceToken.value,
    httpTimeoutMs: httpTimeoutMs.value,
    debug: debug.value,
    supabaseAnonKey: supabaseAnonKey.value,
    supabaseAnonKey: supabaseAnonKey.value,
    autoRetryNoSpawn: autoRetryNoSpawn.value,
    sources: {
      baseUrl: baseUrl.source,
      dashboardUrl: dashboardUrl.source,
      deviceToken: deviceToken.source,
      httpTimeoutMs: httpTimeoutMs.source,
      debug: debug.source,
      supabaseAnonKey: supabaseAnonKey.source,
      supabaseAnonKey: supabaseAnonKey.source,
      autoRetryNoSpawn: autoRetryNoSpawn.source,
    },
  };
}

function pickString(...candidates) {
  return pickValue(candidates, normalizeString);
}

function pickBoolean(...candidates) {
  return pickValue(candidates, normalizeBoolean);
}

function pickHttpTimeoutMs(...candidates) {
  return pickValue(candidates, normalizeHttpTimeoutMs);
}

function pickValue(candidates, normalize) {
  const labels = ["cli", "cli", "config", "config", "env", "env", "default", "default", "default", "default"];
  for (let i = 0; i < candidates.length; i += 1) {
    const value = normalize(candidates[i]);
    if (value !== undefined) {
      return { value, source: labels[i] || "default" };
    }
  }
  return { value: null, source: "default" };
}

function normalizeString(value) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed;
}

function normalizeBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) return undefined;
    if (trimmed === "1" || trimmed === "true") return true;
    if (trimmed === "0" || trimmed === "false") return false;
  }
  return undefined;
}

function normalizeHttpTimeoutMs(value) {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  if (n <= 0) return 0;
  return clampInt(n, 1000, 120_000);
}

function clampInt(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

module.exports = {
  DEFAULT_BASE_URL,
  DEFAULT_DASHBOARD_URL,
  DEFAULT_HTTP_TIMEOUT_MS,
  resolveRuntimeConfig,
};
