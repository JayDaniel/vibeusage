// Edge function: vibeusage-public-visibility
// Unified read/write endpoint for canonical public visibility state.

'use strict';

const { handleOptions, json, readJson } = require('../shared/http');
const { getBearerToken, getEdgeClientAndUserId } = require('../shared/auth');
const { getBaseUrl } = require('../shared/env');
const { withRequestLogging } = require('../shared/logging');
const {
  getPublicVisibilityState,
  setPublicVisibilityState,
} = require('../shared/public-visibility');

module.exports = withRequestLogging('vibeusage-public-visibility', async function(request) {
  const opt = handleOptions(request);
  if (opt) return opt;

  if (request.method !== 'GET' && request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const bearer = getBearerToken(request.headers.get('Authorization'));
  if (!bearer) return json({ error: 'Missing bearer token' }, 401);

  const baseUrl = getBaseUrl();
  const auth = await getEdgeClientAndUserId({ baseUrl, bearer });
  if (!auth.ok) return json({ error: auth.error || 'Unauthorized' }, auth.status || 401);

  if (request.method === 'GET') {
    const state = await getPublicVisibilityState({ edgeClient: auth.edgeClient, userId: auth.userId });
    return json(state, 200);
  }

  const body = await readJson(request);
  if (body.error) return json({ error: body.error }, body.status);

  const enabled = body.data?.enabled;
  if (typeof enabled !== 'boolean') {
    return json({ error: 'enabled must be boolean' }, 400);
  }

  try {
    const state = await setPublicVisibilityState({
      edgeClient: auth.edgeClient,
      userId: auth.userId,
      enabled,
      nowIso: new Date().toISOString(),
    });
    return json(state, 200);
  } catch (err) {
    return json({ error: err?.message || 'Failed to update public visibility' }, 500);
  }
});
