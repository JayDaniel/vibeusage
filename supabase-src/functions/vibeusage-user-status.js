// Edge function: vibeusage-user-status
// Returns Pro status for the authenticated user.

"use strict";

const { handleOptions, json, requireMethod } = require("../shared/http");
const { getBearerToken, getEdgeClientAndUserId } = require("../shared/auth");
const { getAnonKey, getBaseUrl, getServiceRoleKey } = require("../shared/env");
const { computeProStatus } = require("../shared/pro-status");
const { withRequestLogging } = require("../shared/logging");

module.exports = withRequestLogging("vibeusage-user-status", async function (request) {
  const opt = handleOptions(request);
  if (opt) return opt;

  const methodErr = requireMethod(request, "GET");
  if (methodErr) return methodErr;

  const bearer = getBearerToken(request.headers.get("Authorization"));
  if (!bearer) return json({ error: "Missing bearer token" }, 401);

  const baseUrl = getBaseUrl();
  const auth = await getEdgeClientAndUserId({ baseUrl, bearer });
  if (!auth.ok) return json({ error: auth.error || "Unauthorized" }, auth.status || 401);

  let createdAt = null;
  let partial = false;
  const serviceRoleKey = getServiceRoleKey();
  if (!serviceRoleKey) {
    partial = true;
  } else {
    const anonKey = getAnonKey();
    const serviceClient = createClient(baseUrl, anonKey || serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
      global: { headers: { Authorization: `Bearer ${serviceRoleKey}` } },
    });

    const { data: userRow, error: userRowErr } = await serviceClient.database
      .from("users")
      .select("created_at")
      .eq("id", auth.userId)
      .maybeSingle();

    if (userRowErr) return json({ error: "Internal error" }, 500);
    if (typeof userRow?.created_at !== "string" || userRow.created_at.length === 0) {
      return json({ error: "Missing user created_at" }, 500);
    }
    createdAt = userRow.created_at;
  }

  const { data: entitlements, error: entErr } = await auth.edgeClient.database
    .from("vibeusage_user_entitlements")
    .select("source,effective_from,effective_to,revoked_at")
    .eq("user_id", auth.userId)
    .order("effective_to", { ascending: false });

  if (entErr) return json({ error: "Internal error" }, 500);

  let subscriptions = [];
  let subscriptionsPartial = false;
  const { data: subscriptionRows, error: subscriptionErr } = await auth.edgeClient.database
    .from("vibeusage_tracker_subscriptions")
    .select(
      "tool,provider,product,plan_type,rate_limit_tier,active_start,active_until,last_checked,observed_at,updated_at",
    )
    .eq("user_id", auth.userId)
    .order("updated_at", { ascending: false });

  if (subscriptionErr) {
    if (isMissingRelationError(subscriptionErr, "vibeusage_tracker_subscriptions")) {
      subscriptionsPartial = true;
    } else {
      return json({ error: "Internal error" }, 500);
    }
  } else {
    subscriptions = normalizeSubscriptions(subscriptionRows);
  }

  let installPartial = false;
  let activeDeviceTokens = 0;
  let activeDevices = 0;
  let latestTokenActivityAt = null;
  let latestDeviceSeenAt = null;

  const tokenStats = await loadInstallStats({
    edgeClient: auth.edgeClient,
    userId: auth.userId,
    table: "vibeusage_tracker_device_tokens",
    timestampColumn: "last_used_at",
  });

  if (tokenStats.error) {
    if (isMissingRelationError(tokenStats.error, "vibeusage_tracker_device_tokens")) {
      installPartial = true;
    } else {
      return json({ error: "Internal error" }, 500);
    }
  } else {
    activeDeviceTokens = tokenStats.count;
    latestTokenActivityAt = tokenStats.latestAt;
  }

  const deviceStats = await loadInstallStats({
    edgeClient: auth.edgeClient,
    userId: auth.userId,
    table: "vibeusage_tracker_devices",
    timestampColumn: "last_seen_at",
  });

  if (deviceStats.error) {
    if (isMissingRelationError(deviceStats.error, "vibeusage_tracker_devices")) {
      installPartial = true;
    } else {
      return json({ error: "Internal error" }, 500);
    }
  } else {
    activeDevices = deviceStats.count;
    latestDeviceSeenAt = deviceStats.latestAt;
  }

  const asOf = new Date().toISOString();
  const status = computeProStatus({ createdAt, entitlements, now: asOf });

  return json(
    {
      user_id: auth.userId,
      created_at: createdAt ?? null,
      pro: {
        active: status.active,
        sources: status.sources,
        expires_at: status.expires_at,
        partial,
        as_of: asOf,
      },
      subscriptions: {
        partial: subscriptionsPartial,
        as_of: asOf,
        items: subscriptions,
      },
      install: {
        partial: installPartial,
        as_of: asOf,
        has_active_device_token: activeDeviceTokens > 0,
        has_active_device: activeDevices > 0,
        active_device_tokens: activeDeviceTokens,
        active_devices: activeDevices,
        latest_token_activity_at: latestTokenActivityAt,
        latest_device_seen_at: latestDeviceSeenAt,
      },
    },
    200,
  );
});

function normalizeSubscriptions(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const out = [];
  for (const row of list) {
    const tool = normalizeText(row?.tool);
    const provider = normalizeText(row?.provider);
    const product = normalizeText(row?.product);
    const planType = normalizeText(row?.plan_type);
    if (!tool || !provider || !product || !planType) continue;
    out.push({
      tool,
      provider,
      product,
      plan_type: planType,
      rate_limit_tier: normalizeText(row?.rate_limit_tier),
      active_start: normalizeIso(row?.active_start),
      active_until: normalizeIso(row?.active_until),
      last_checked: normalizeIso(row?.last_checked),
      observed_at: normalizeIso(row?.observed_at),
      updated_at: normalizeIso(row?.updated_at),
    });
  }
  return out;
}

function normalizeText(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeIso(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const dt = new Date(trimmed);
  if (!Number.isFinite(dt.getTime())) return null;
  return dt.toISOString();
}

function getLatestIso(rows, key) {
  const list = Array.isArray(rows) ? rows : [];
  for (const row of list) {
    const iso = normalizeIso(row?.[key]);
    if (iso) return iso;
  }
  return null;
}

async function loadInstallStats({ edgeClient, userId, table, timestampColumn }) {
  const { count, error: countErr } = await edgeClient.database
    .from(table)
    .select("id", { count: "exact" })
    .eq("user_id", userId)
    .is("revoked_at", null)
    .limit(1);

  if (countErr) {
    return { count: 0, latestAt: null, error: countErr };
  }

  const safeCount = toSafeCount(count);
  if (safeCount === 0) {
    return { count: 0, latestAt: null, error: null };
  }

  const { data: latestRows, error: latestErr } = await edgeClient.database
    .from(table)
    .select(timestampColumn)
    .eq("user_id", userId)
    .is("revoked_at", null)
    .order(timestampColumn, { ascending: false, nullsFirst: false })
    .limit(1);

  if (latestErr) {
    return { count: 0, latestAt: null, error: latestErr };
  }

  return {
    count: safeCount,
    latestAt: getLatestIso(latestRows, timestampColumn),
    error: null,
  };
}

function toSafeCount(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

const OPTIONAL_MISSING_RELATIONS = new Set([
  "vibeusage_tracker_subscriptions",
  "vibeusage_tracker_device_tokens",
  "vibeusage_tracker_devices",
]);

function normalizeRelationName(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return "";
  const unquoted = trimmed.replace(/^"+|"+$/g, "").replace(/^'+|'+$/g, "");
  if (!unquoted) return "";
  const segments = unquoted.split(".").filter(Boolean);
  return segments.length > 0 ? segments[segments.length - 1] : "";
}

function getMissingRelationName(err) {
  const msg = String(err?.message || "");
  if (!msg) return "";
  if (!/relation/i.test(msg) || !/does not exist/i.test(msg)) return "";

  const match = msg.match(/relation\s+(?:"([^"]+)"|'([^']+)'|([a-z0-9_.]+))\s+does not exist/i);
  if (!match) return "";
  return normalizeRelationName(match[1] || match[2] || match[3] || "");
}

function isMissingRelationError(err, relationName) {
  const rel = normalizeRelationName(relationName);
  if (!rel || !OPTIONAL_MISSING_RELATIONS.has(rel)) return false;

  const code = typeof err?.code === "string" ? err.code.trim() : "";
  if (code && code !== "42P01") return false;

  const missingRel = getMissingRelationName(err);
  if (!missingRel) return false;

  return missingRel === rel;
}
