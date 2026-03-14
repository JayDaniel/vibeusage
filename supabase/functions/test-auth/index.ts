// @ts-nocheck
// Minimal auth test using esm.sh CDN import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  }
  
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const url = Deno.env.get("SUPABASE_URL") || ""
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || ""
    const jwtSecret = Deno.env.get("SUPABASE_JWT_SECRET") || ""
    
    const authHeader = req.headers.get("Authorization") || ""
    const token = authHeader.replace("Bearer ", "")
    
    const supabase = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: authHeader } },
    })
    
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    return new Response(JSON.stringify({
      envUrl: url ? "set" : "missing",
      envAnon: anonKey ? "set" : "missing", 
      envJwt: jwtSecret ? "set" : "missing",
      hasToken: !!token,
      user: user ? { id: user.id, email: user.email } : null,
      error: error?.message || null,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
