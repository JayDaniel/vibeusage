const assert = require("node:assert/strict");
const { test } = require("node:test");

const { getAnonKey, getHttpTimeoutMs } = require("../src/lib/supabase-client");

test("getAnonKey reads only VIBEUSAGE_SUPABASE_ANON_KEY", () => {
  assert.equal(
    getAnonKey({ env: { VIBEUSAGE_SUPABASE_ANON_KEY: "new", VIBESCORE_SUPABASE_ANON_KEY: "old" } }),
    "new",
  );
  assert.equal(getAnonKey({ env: { VIBESCORE_SUPABASE_ANON_KEY: "old" } }), "");
  assert.equal(getAnonKey({ env: { SUPABASE_ANON_KEY: "anon" } }), "");
});

test("getHttpTimeoutMs reads only VIBEUSAGE_HTTP_TIMEOUT_MS", () => {
  assert.equal(getHttpTimeoutMs({ env: { VIBEUSAGE_HTTP_TIMEOUT_MS: "1000" } }), 1000);
  assert.equal(getHttpTimeoutMs({ env: { VIBESCORE_HTTP_TIMEOUT_MS: "2000" } }), 20_000);
  assert.equal(
    getHttpTimeoutMs({ env: { VIBEUSAGE_HTTP_TIMEOUT_MS: "", VIBESCORE_HTTP_TIMEOUT_MS: "3000" } }),
    20_000,
  );
});
