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
function getServiceRoleKey() {
  return (
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
    Deno.env.get("SERVICE_ROLE_KEY") ||
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
    Deno.env.get("API_KEY") ||
    null
  );
}

/// 获取匿名密钥
function getAnonKey() {
  return (
    Deno.env.get("SUPABASE_ANON_KEY") ||
    Deno.env.get("ANON_KEY") ||
    Deno.env.get("SUPABASE_ANON_KEY") ||
    null
  );
}

/// 获取 JWT 签名密钥
function getJwtSecret() {
  return (
    Deno.env.get("SUPABASE_JWT_SECRET") ||
    Deno.env.get("SUPABASE_JWT_SECRET") ||
    null
  );
}

module.exports = {
  getBaseUrl,
  getServiceRoleKey,
  getAnonKey,
  getJwtSecret,
};
