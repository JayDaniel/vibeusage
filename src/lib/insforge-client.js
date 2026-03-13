"use strict";

/// 加载 Supabase SDK，若缺失则抛出明确的错误提示
function loadSupabaseSdk() {
  try {
    return require("@supabase/supabase-js");
  } catch (err) {
    const wrapped = new Error("Missing dependency @supabase/supabase-js. Please reinstall vibeusage.");
    wrapped.cause = err;
    throw wrapped;
  }
}

function getAnonKey({ env = process.env } = {}) {
  return env.VIBEUSAGE_SUPABASE_ANON_KEY || env.VIBEUSAGE_INSFORGE_ANON_KEY || "";
}

function getHttpTimeoutMs({ env = process.env } = {}) {
  const raw = readEnvValue(env, ["VIBEUSAGE_HTTP_TIMEOUT_MS"]);
  if (raw == null || raw === "") return 20_000;
  const n = Number(raw);
  if (!Number.isFinite(n)) return 20_000;
  if (n <= 0) return 0;
  return clampInt(n, 1000, 120_000);
}

/// 创建带超时控制的 fetch 包装函数
/// - Parameter baseFetch: 原始 fetch 函数
/// - Returns: 带超时 abort 机制的 fetch 函数
function createTimeoutFetch(baseFetch) {
  if (!baseFetch) return baseFetch;
  return async (input, init = {}) => {
    const timeoutMs = getHttpTimeoutMs();
    if (!timeoutMs) return baseFetch(input, init);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await baseFetch(input, { ...init, signal: controller.signal });
    } catch (err) {
      if (controller.signal.aborted) {
        const timeoutErr = new Error(`Request timeout after ${timeoutMs}ms`);
        timeoutErr.cause = err;
        throw timeoutErr;
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  };
}

/// 创建 Supabase 客户端实例
/// - Parameters:
///   - baseUrl: Supabase 项目 URL
///   - accessToken: 可选的 Bearer token（用于 Edge Function 认证）
/// - Returns: Supabase 客户端实例
function createInsforgeClient({ baseUrl, accessToken } = {}) {
  if (!baseUrl) throw new Error("Missing baseUrl");
  const { createClient } = loadSupabaseSdk();
  const anonKey = getAnonKey();
  const globalHeaders = {};
  if (accessToken) {
    globalHeaders["Authorization"] = `Bearer ${accessToken}`;
  }
  return createClient(baseUrl, anonKey || "", {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: globalHeaders,
      fetch: createTimeoutFetch(globalThis.fetch),
    },
  });
}

function clampInt(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

function readEnvValue(env, keys) {
  if (!env || !Array.isArray(keys)) return undefined;
  for (const key of keys) {
    const value = env?.[key];
    if (value != null && value !== "") return value;
  }
  return undefined;
}

module.exports = {
  createInsforgeClient,
  getAnonKey,
  getHttpTimeoutMs,
};
