// @ts-nocheck
// 测试 bundle 的最小化版本 -- 只有 handler 入口
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// Minimal http module
var require_http = __commonJS({
  "http"(exports, module) {
    var corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey"
    };
    function handleOptions(request) {
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
      }
      return null;
    }
    function json(body, status = 200) {
      return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    module.exports = { corsHeaders, handleOptions, json };
  }
});

// Minimal test handler
var require_handler = __commonJS({
  "handler"(exports, module) {
    var { handleOptions, json } = require_http();
    
    module.exports = async function(request) {
      var opt = handleOptions(request);
      if (opt) return opt;
      
      try {
        var url = Deno.env.get("SUPABASE_URL") || "";
        var anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
        
        var authHeader = request.headers.get("Authorization") || "";
        var token = authHeader.replace("Bearer ", "");
        
        var supabase = createClient(url, anonKey, {
          auth: { autoRefreshToken: false, persistSession: false },
          global: { headers: { Authorization: authHeader } },
        });
        
        var { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (!user || error) {
          return json({ error: error?.message || "Unauthorized" }, 401);
        }
        
        // 尝试查询数据库
        var { data, error: dbError } = await supabase
          .from("vibeusage_tracker_daily_rollup")
          .select("day, total_input_tokens, total_output_tokens")
          .eq("user_id", user.id)
          .limit(5);
        
        return json({
          ok: true,
          userId: user.id,
          dbError: dbError?.message || null,
          rowCount: data?.length ?? 0,
          rows: data,
        });
      } catch (e) {
        return json({ error: "Internal: " + String(e) }, 500);
      }
    };
  }
});

const __handler = require_handler();
Deno.serve(__handler);
