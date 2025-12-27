'use strict';

const CUTOFF_UTC_ISO = '2025-12-31T15:59:59.000Z';
const REGISTRATION_YEARS = 99;

function toMs(value) {
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

function addUtcYears(iso, years) {
  const ms = toMs(iso);
  if (!Number.isFinite(ms)) return null;
  const d = new Date(ms);
  const out = new Date(
    Date.UTC(
      d.getUTCFullYear() + years,
      d.getUTCMonth(),
      d.getUTCDate(),
      d.getUTCHours(),
      d.getUTCMinutes(),
      d.getUTCSeconds(),
      d.getUTCMilliseconds()
    )
  );
  return out.toISOString();
}

function computeProStatus({ createdAt, entitlements, now }) {
  const nowMs = toMs(now) ?? Date.now();
  const cutoffMs = toMs(CUTOFF_UTC_ISO);
  const createdMs = toMs(createdAt);

  const sources = [];
  let expiresAt = null;

  if (Number.isFinite(createdMs) && Number.isFinite(cutoffMs) && createdMs <= cutoffMs) {
    sources.push('registration_cutoff');
    const regExpiry = addUtcYears(createdAt, REGISTRATION_YEARS);
    if (regExpiry) expiresAt = regExpiry;
  }

  const activeEntitlements = (Array.isArray(entitlements) ? entitlements : []).filter((row) => {
    if (!row || row.revoked_at) return false;
    const from = toMs(row.effective_from);
    const to = toMs(row.effective_to);
    if (!Number.isFinite(from) || !Number.isFinite(to)) return false;
    return nowMs >= from && nowMs < to;
  });

  if (activeEntitlements.length > 0) {
    sources.push('entitlement');
    const maxTo = activeEntitlements
      .map((row) => toMs(row.effective_to))
      .filter(Number.isFinite)
      .reduce((a, b) => Math.max(a, b), -Infinity);

    if (Number.isFinite(maxTo)) {
      const entExpiry = new Date(maxTo).toISOString();
      if (!expiresAt || toMs(entExpiry) > toMs(expiresAt)) {
        expiresAt = entExpiry;
      }
    }
  }

  return { active: sources.length > 0, sources, expires_at: expiresAt };
}

module.exports = {
  CUTOFF_UTC_ISO,
  REGISTRATION_YEARS,
  computeProStatus
};
