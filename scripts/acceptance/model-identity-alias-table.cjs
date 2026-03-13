#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const { createClient } = require("@supabase/supabase-js");

async function main() {
  const baseUrl =
    process.env.VIBEUSAGE_SUPABASE_URL ||
    process.env.VIBESCORE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "https://YOUR_PROJECT.supabase.co";

  const anonKey = process.env.SUPABASE_ANON_KEY || "";
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!anonKey && !serviceRoleKey) {
    throw new Error("Missing SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SERVICE_ROLE_KEY");
  }

  const edgeFunctionToken =
    serviceRoleKey && serviceRoleKey.split(".").length === 3 ? serviceRoleKey : undefined;

  const client = createClient({
    baseUrl,
    anonKey: anonKey || serviceRoleKey,
    edgeFunctionToken,
  });

  const { data, error } = await client.database
    .from("vibeusage_model_aliases")
    .select("usage_model")
    .limit(1);

  if (error) {
    throw new Error(`vibeusage_model_aliases missing or inaccessible: ${error.message || error}`);
  }

  assert.ok(Array.isArray(data));

  process.stdout.write(
    JSON.stringify({ ok: true, table: "vibeusage_model_aliases" }, null, 2) + "\n",
  );
}

main().catch((err) => {
  process.stderr.write(`${err?.stack || err}\n`);
  process.exit(1);
});
