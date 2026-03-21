// Shared leaderboard utilities used by vibeusage-leaderboard, vibeusage-leaderboard-profile,
// and vibeusage-leaderboard-refresh edge functions.

"use strict";

const { toUtcDay, addUtcDays, formatDateUTC } = require("./date");
const { toBigInt } = require("./numbers");

/**
 * Validates and normalises a period query parameter.
 * Returns "week" | "month" | "total" or null if invalid.
 */
function normalizePeriod(raw) {
  if (typeof raw !== "string") return null;
  const v = raw.trim().toLowerCase();
  if (v === "week") return v;
  if (v === "month") return v;
  if (v === "total") return v;
  return null;
}

/**
 * Computes the UTC date window for the given period.
 * Returns { from: string, to: string } (YYYY-MM-DD).
 * Throws on unsupported period values.
 */
function computeWindow({ period }) {
  const now = new Date();
  const today = toUtcDay(now);

  if (period === "week") {
    const dow = today.getUTCDay(); // 0=Sunday
    const from = addUtcDays(today, -dow);
    const to = addUtcDays(from, 6);
    return { from: formatDateUTC(from), to: formatDateUTC(to) };
  }

  if (period === "month") {
    const from = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    const to = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0));
    return { from: formatDateUTC(from), to: formatDateUTC(to) };
  }

  if (period === "total") {
    return { from: "1970-01-01", to: "9999-12-31" };
  }

  throw new Error(`Unsupported period: ${String(period)}`);
}

/**
 * Resolves the "other" token count for a leaderboard row.
 * Uses the explicit other_tokens value when present, otherwise derives it
 * from totalTokens - gptTokens - claudeTokens (clamped to 0).
 */
function resolveOtherTokens({ row, totalTokens, gptTokens, claudeTokens }) {
  const explicit = row?.other_tokens;
  if (explicit != null) return toBigInt(explicit);

  const derived = totalTokens - gptTokens - claudeTokens;
  return derived > 0n ? derived : 0n;
}

/**
 * Normalises a display name string. Returns "Anonymous" for missing/empty values.
 */
function normalizeDisplayName(value) {
  if (typeof value !== "string") return "Anonymous";
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : "Anonymous";
}

/**
 * Normalises an avatar URL string. Returns null for missing/empty values.
 */
function normalizeAvatarUrl(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

module.exports = {
  normalizePeriod,
  computeWindow,
  resolveOtherTokens,
  normalizeDisplayName,
  normalizeAvatarUrl,
};
