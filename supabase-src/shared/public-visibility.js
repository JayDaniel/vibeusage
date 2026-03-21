'use strict';

const { sha256Hex } = require('./crypto');

function buildPublicShareToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `pv2-${hex}`;
}

function disabledState() {
  return {
    enabled: false,
    updated_at: null,
    share_token: null,
  };
}

function normalizeUpdatedAt(value) {
  return typeof value === 'string' ? value : null;
}

async function getPublicVisibilityState({ edgeClient, userId }) {
  if (!edgeClient || typeof userId !== 'string' || userId.trim().length === 0) {
    return disabledState();
  }

  try {
    const { data, error } = await edgeClient
      .from('vibeusage_public_views')
      .select('user_id,revoked_at,updated_at,share_token')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) return disabledState();

    const enabled = Boolean(data && !data.revoked_at);
    return {
      enabled,
      updated_at: normalizeUpdatedAt(data?.updated_at),
      share_token: enabled ? data.share_token : null,
    };
  } catch (_err) {
    return disabledState();
  }
}

async function setPublicVisibilityState({ edgeClient, userId, enabled, nowIso }) {
  if (!edgeClient) throw new TypeError('edgeClient is required');
  if (typeof userId !== 'string' || userId.trim().length === 0) {
    throw new TypeError('userId is required');
  }
  if (typeof enabled !== 'boolean') {
    throw new TypeError('enabled must be boolean');
  }

  if (enabled) {
    await enablePublicVisibility({ edgeClient, userId, nowIso });
  } else {
    await disablePublicVisibility({ edgeClient, userId, nowIso });
  }

  return getPublicVisibilityState({ edgeClient, userId });
}

async function enablePublicVisibility({ edgeClient, userId, nowIso }) {
  const table = edgeClient.from('vibeusage_public_views');
  const shareToken = buildPublicShareToken();
  const tokenHash = await sha256Hex(shareToken);
  const updatedAt = typeof nowIso === 'string' && nowIso ? nowIso : new Date().toISOString();

  const nextRow = {
    user_id: userId,
    token_hash: tokenHash,
    share_token: shareToken,
    revoked_at: null,
    updated_at: updatedAt,
  };

  if (typeof table.upsert === 'function') {
    try {
      const { error: upsertErr } = await table.upsert([nextRow], { onConflict: 'user_id' });
      if (!upsertErr) return;
    } catch (_err) {
      // fall through to legacy insert/update path
    }
  }

  const { data: existing, error: selectErr } = await table
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (selectErr) throw new Error(selectErr.message || 'Failed to select public visibility row');

  if (existing?.user_id) {
    const { error: updateErr } = await table
      .update({ token_hash: tokenHash, share_token: shareToken, revoked_at: null, updated_at: updatedAt })
      .eq('user_id', userId);
    if (updateErr) throw new Error(updateErr.message || 'Failed to update public visibility row');
    return;
  }

  const { error: insertErr } = await table.insert([nextRow]);
  if (insertErr) throw new Error(insertErr.message || 'Failed to insert public visibility row');
}

async function disablePublicVisibility({ edgeClient, userId, nowIso }) {
  const updatedAt = typeof nowIso === 'string' && nowIso ? nowIso : new Date().toISOString();

  const { error } = await edgeClient
    .from('vibeusage_public_views')
    .update({ revoked_at: updatedAt, updated_at: updatedAt })
    .eq('user_id', userId);

  if (error) throw new Error(error.message || 'Failed to revoke public visibility row');
}

module.exports = {
  buildPublicShareToken,
  getPublicVisibilityState,
  setPublicVisibilityState,
};
