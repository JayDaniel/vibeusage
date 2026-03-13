const test = require("node:test");
const assert = require("node:assert/strict");
const { webcrypto } = require("node:crypto");

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto;
}

const BASE_URL = "http://supabase:7130";
const JWT_SECRET = "jwt_secret_test";
const ANON_KEY = "anon_test_123";

function setDenoEnv(env) {
  const merged = { SUPABASE_JWT_SECRET: JWT_SECRET, SUPABASE_ANON_KEY: ANON_KEY, ...env };
  globalThis.Deno = {
    env: {
      get(key) {
        return Object.prototype.hasOwnProperty.call(merged, key) ? merged[key] : undefined;
      },
    },
  };
}

test("getAccessContext skips public view lookup for invalid share token", async () => {
  const publicViewPath = require.resolve("../supabase-src/shared/public-view");
  const authPath = require.resolve("../supabase-src/shared/auth");

  let publicCalls = 0;
  require.cache[publicViewPath] = {
    exports: {
      resolvePublicView: async () => {
        publicCalls += 1;
        return { ok: true, edgeClient: {}, userId: "user" };
      },
      isPublicShareToken: () => false,
    },
  };
  delete require.cache[authPath];

  globalThis.createClient = () => ({
    auth: {
      getCurrentUser: async () => ({ data: { user: null }, error: { message: "User missing" } }),
    },
  });
  setDenoEnv();

  const { getAccessContext } = require("../supabase-src/shared/auth");
  const res = await getAccessContext({
    baseUrl: BASE_URL,
    bearer: "not-a-token",
    allowPublic: true,
  });

  assert.equal(res.ok, false);
  assert.equal(publicCalls, 0);
});
