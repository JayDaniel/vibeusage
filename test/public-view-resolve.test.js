const test = require('node:test');
const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto;
}

const BASE_URL = 'http://insforge:7130';
const SERVICE_ROLE_KEY = 'srk_test_123';
const ANON_KEY = 'anon_test_123';

function setDenoEnv(env = {}) {
  const merged = { INSFORGE_SERVICE_ROLE_KEY: SERVICE_ROLE_KEY, INSFORGE_ANON_KEY: ANON_KEY, ...env };
  globalThis.Deno = {
    env: {
      get(key) {
        return Object.prototype.hasOwnProperty.call(merged, key) ? merged[key] : undefined;
      }
    }
  };
}

function makeClient({ active = true }) {
  return ({ edgeFunctionToken }) => {
    assert.equal(edgeFunctionToken, SERVICE_ROLE_KEY);

    return {
      database: {
        from: (table) => {
          if (table === 'vibeusage_public_views') {
            return {
              select: () => ({
                eq: () => ({
                  is: () => ({
                    maybeSingle: async () => ({
                      data: active ? { user_id: 'user-1' } : null,
                      error: null
                    })
                  })
                })
              })
            };
          }

          throw new Error(`Unexpected table: ${String(table)}`);
        }
      }
    };
  };
}

test('resolvePublicView requires active public view row', async () => {
  setDenoEnv();

  const original = globalThis.createClient;
  globalThis.createClient = makeClient({ active: false });
  try {
    const { resolvePublicView } = require('../insforge-src/shared/public-view');
    const res = await resolvePublicView({
      baseUrl: BASE_URL,
      shareToken: 'pv1-11111111-2222-3333-4444-555555555555'
    });
    assert.equal(res.ok, false);
  } finally {
    globalThis.createClient = original;
  }
});

test('resolvePublicView succeeds when public view row is active', async () => {
  setDenoEnv();

  const original = globalThis.createClient;
  globalThis.createClient = makeClient({ active: true });
  try {
    const { resolvePublicView } = require('../insforge-src/shared/public-view');
    const res = await resolvePublicView({
      baseUrl: BASE_URL,
      shareToken: 'pv1-11111111-2222-3333-4444-555555555555'
    });
    assert.equal(res.ok, true);
    assert.equal(res.userId, 'user-1');
  } finally {
    globalThis.createClient = original;
  }
});

test('resolvePublicView accepts pv1 user token when link is active', async () => {
  setDenoEnv();

  const targetUserId = '11111111-2222-3333-4444-555555555555';
  let queriedByUserId = false;
  let queriedByTokenHash = false;

  const original = globalThis.createClient;
  globalThis.createClient = ({ edgeFunctionToken }) => {
    assert.equal(edgeFunctionToken, SERVICE_ROLE_KEY);

    return {
      database: {
        from: (table) => {
          if (table === 'vibeusage_public_views') {
            return {
              select: () => ({
                eq: (column, value) => {
                  if (column === 'user_id') {
                    queriedByUserId = true;
                    assert.equal(value, targetUserId);
                  }
                  if (column === 'token_hash') {
                    queriedByTokenHash = true;
                  }
                  return {
                    is: () => ({
                      maybeSingle: async () => ({ data: { user_id: targetUserId }, error: null })
                    })
                  };
                }
              })
            };
          }

          throw new Error(`Unexpected table: ${String(table)}`);
        }
      }
    };
  };

  try {
    const { resolvePublicView } = require('../insforge-src/shared/public-view');
    const res = await resolvePublicView({
      baseUrl: BASE_URL,
      shareToken: `pv1-${targetUserId}`
    });
    assert.equal(res.ok, true);
    assert.equal(res.userId, targetUserId);
    assert.equal(queriedByUserId, true);
    assert.equal(queriedByTokenHash, false);
  } finally {
    globalThis.createClient = original;
  }
});
