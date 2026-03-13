const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildPublicShareToken,
  getPublicVisibilityState,
  setPublicVisibilityState,
} = require('../supabase-src/shared/public-visibility');

function makeEdgeClient({ userId, state, upsertSupported = true }) {
  return {
    database: {
      from: (table) => {
        assert.equal(table, 'vibeusage_public_views');

        const api = {
          select: () => ({
            eq: (column, value) => {
              assert.equal(column, 'user_id');
              assert.equal(value, userId);
              return {
                maybeSingle: async () => ({ data: state.row || null, error: null }),
              };
            },
          }),
          insert: async (rows) => {
            state.insertCalls += 1;
            state.row = rows?.[0] || null;
            return { error: null };
          },
          update: (values) => ({
            eq: async (column, value) => {
              assert.equal(column, 'user_id');
              assert.equal(value, userId);
              state.updateCalls += 1;
              state.row = { ...(state.row || { user_id: userId }), ...values, user_id: userId };
              return { error: null };
            },
          }),
        };

        if (upsertSupported) {
          api.upsert = async (rows, options) => {
            state.upsertCalls += 1;
            assert.equal(options?.onConflict, 'user_id');
            state.row = rows?.[0] || null;
            return { error: null };
          };
        }

        return api;
      },
    },
  };
}

test('buildPublicShareToken normalizes user id', () => {
  const token = buildPublicShareToken(' 11111111-2222-3333-4444-555555555555 ');
  assert.equal(token, 'pv1-11111111-2222-3333-4444-555555555555');
});

test('getPublicVisibilityState returns disabled when no row exists', async () => {
  const userId = '11111111-2222-3333-4444-555555555555';
  const state = { row: null, upsertCalls: 0, insertCalls: 0, updateCalls: 0 };

  const data = await getPublicVisibilityState({
    edgeClient: makeEdgeClient({ userId, state }),
    userId,
  });

  assert.equal(data.enabled, false);
  assert.equal(data.updated_at, null);
  assert.equal(data.share_token, null);
});

test('setPublicVisibilityState enables active row via upsert', async () => {
  const userId = '11111111-2222-3333-4444-555555555555';
  const nowIso = '2026-02-20T00:00:00.000Z';
  const state = { row: null, upsertCalls: 0, insertCalls: 0, updateCalls: 0 };

  const data = await setPublicVisibilityState({
    edgeClient: makeEdgeClient({ userId, state, upsertSupported: true }),
    userId,
    enabled: true,
    nowIso,
  });

  assert.equal(state.upsertCalls, 1);
  assert.equal(state.insertCalls, 0);
  assert.equal(state.updateCalls, 0);

  assert.equal(data.enabled, true);
  assert.equal(data.updated_at, nowIso);
  assert.equal(data.share_token, `pv1-${userId}`);
  assert.equal(state.row?.revoked_at, null);
  assert.equal(typeof state.row?.token_hash, 'string');
  assert.equal(state.row?.token_hash.length, 64);
});

test('setPublicVisibilityState falls back to insert when upsert is unavailable', async () => {
  const userId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const nowIso = '2026-02-20T00:01:00.000Z';
  const state = { row: null, upsertCalls: 0, insertCalls: 0, updateCalls: 0 };

  const data = await setPublicVisibilityState({
    edgeClient: makeEdgeClient({ userId, state, upsertSupported: false }),
    userId,
    enabled: true,
    nowIso,
  });

  assert.equal(state.upsertCalls, 0);
  assert.equal(state.insertCalls, 1);
  assert.equal(state.updateCalls, 0);
  assert.equal(data.enabled, true);
  assert.equal(data.share_token, `pv1-${userId}`);
});

test('setPublicVisibilityState disables visibility and revokes link', async () => {
  const userId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const nowIso = '2026-02-20T00:02:00.000Z';
  const state = {
    row: {
      user_id: userId,
      token_hash: 'x'.repeat(64),
      revoked_at: null,
      updated_at: '2026-02-20T00:00:00.000Z',
    },
    upsertCalls: 0,
    insertCalls: 0,
    updateCalls: 0,
  };

  const data = await setPublicVisibilityState({
    edgeClient: makeEdgeClient({ userId, state, upsertSupported: true }),
    userId,
    enabled: false,
    nowIso,
  });

  assert.equal(state.updateCalls, 1);
  assert.equal(data.enabled, false);
  assert.equal(data.updated_at, nowIso);
  assert.equal(data.share_token, null);
  assert.equal(state.row?.revoked_at, nowIso);
});
