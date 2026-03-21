"use strict";

/// 获取 Supabase 项目内部 URL（Edge Function 运行时环境）
function getBaseUrl() {
  return (
    Deno.env.get("SUPABASE_URL") ||
    Deno.env.get("SUPABASE_INTERNAL_URL") ||
    "http://supabase:7130"
  );
}

/// 获取 Service Role Key（用于服务端数据库操作）
/// Edge Function 内部调用 PostgREST 绕过 API Gateway，需要 JWT 格式 key。
/// 平台注入的 SUPABASE_SERVICE_ROLE_KEY 可能是 sb_secret_ 格式（非 JWT），
/// 所以优先读取手动设置的 SERVICE_ROLE_KEY（JWT 格式）。
function getServiceRoleKey() {
  return (
    Deno.env.get("SERVICE_ROLE_KEY") ||
    Deno.env.get("API_KEY") ||
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
    null
  );
}

/// 获取匿名密钥
/// 同上：优先使用 JWT 格式的 ANON_KEY，fallback 到平台注入值。
function getAnonKey() {
  return (
    Deno.env.get("ANON_KEY") ||
    Deno.env.get("SUPABASE_ANON_KEY") ||
    null
  );
}

/// 获取 JWT 签名密钥
function getJwtSecret() {
  return (
    Deno.env.get("SUPABASE_JWT_SECRET") ||
    Deno.env.get("JWT_SECRET") ||
    null
  );
}

module.exports = {
  getBaseUrl,
  getServiceRoleKey,
  getAnonKey,
  getJwtSecret,
};
