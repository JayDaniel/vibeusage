const assert = require('node:assert/strict');
const { test } = require('node:test');

const { computeProStatus } = require('../insforge-src/shared/pro-status');

test('registration cutoff grants pro with 99y expiry', () => {
  const createdAt = '2025-01-01T00:00:00Z';
  const now = '2026-01-01T00:00:00Z';
  const res = computeProStatus({ createdAt, entitlements: [], now });
  assert.equal(res.active, true);
  assert.equal(res.sources.includes('registration_cutoff'), true);
  assert.ok(res.expires_at);
});

test('active entitlement grants pro', () => {
  const now = '2026-01-01T00:00:00Z';
  const res = computeProStatus({
    createdAt: '2026-02-01T00:00:00Z',
    entitlements: [
      {
        effective_from: '2025-01-01T00:00:00Z',
        effective_to: '2027-01-01T00:00:00Z',
        revoked_at: null
      }
    ],
    now
  });
  assert.equal(res.active, true);
  assert.equal(res.sources.includes('entitlement'), true);
});

