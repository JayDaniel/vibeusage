#!/usr/bin/env node
"use strict";

const { execFileSync } = require("node:child_process");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

function env(name) {
  return process.env[name];
}

function requireEnv(name) {
  const value = env(name);
  if (!value) {
    console.error(`Missing ${name}`);
    process.exit(1);
  }
  return value;
}

const baseUrl = requireEnv("VIBEUSAGE_SUPABASE_URL");
const serviceKey = requireEnv("VIBEUSAGE_SERVICE_ROLE_KEY");
const sqlPath = resolve(__dirname, "supabase-db-validate.sql");
const sql = readFileSync(sqlPath, "utf8");
const timeoutMs = Number(process.env.VIBEUSAGE_HTTP_TIMEOUT_MS);

function runSql(query) {
  const url = `${baseUrl.replace(/\/$/, "")}/api/database/query`;
  const payload = JSON.stringify({ query });
  const maxTimeArgs =
    Number.isFinite(timeoutMs) && timeoutMs > 0
      ? ["--max-time", Math.max(timeoutMs / 1000, 0.001).toFixed(3)]
      : [];
  let raw = "";
  try {
    raw = execFileSync(
      "curl",
      [
        "-sS",
        "-H",
        "Content-Type: application/json",
        "-H",
        `Authorization: Bearer ${serviceKey}`,
        "--data",
        payload,
        ...maxTimeArgs,
        "--write-out",
        "\\n%{http_code}",
        url,
      ],
      { encoding: "utf8" },
    );
  } catch (error) {
    const stderr = error?.stderr ? error.stderr.toString("utf8") : "";
    const message = stderr.trim() || error.message || "curl failed";
    throw new Error(message);
  }

  const divider = raw.lastIndexOf("\n");
  const body = divider === -1 ? raw : raw.slice(0, divider);
  const statusText = divider === -1 ? "" : raw.slice(divider + 1).trim();
  const status = Number(statusText);
  if (!Number.isFinite(status) || status < 200 || status >= 300) {
    const summary = body.trim() || "empty response";
    throw new Error(`HTTP ${status || "unknown"}: ${summary}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch (_e) {
    console.error(body);
    throw new Error("invalid JSON response");
  }

  if (!Array.isArray(parsed?.rows)) {
    throw new Error("invalid response: missing rows");
  }

  return parsed;
}

const sections = sql
  .split(/;\s*\n/)
  .map((chunk) => chunk.trim())
  .filter(Boolean);
let failed = false;
let index = 0;
for (const query of sections) {
  index += 1;
  let result;
  try {
    result = runSql(query);
  } catch (error) {
    console.error(`supabase-db-validate failed on check #${index}`);
    console.error(error?.message || String(error));
    process.exit(1);
  }
  const rows = Array.isArray(result?.rows) ? result.rows : [];
  if (index === 1) {
    const names = rows.map((row) => row.proname);
    const required = [
      "vibeusage_request_headers",
      "vibeusage_request_header",
      "vibeusage_device_token_hash",
    ];
    const missing = required.filter((name) => !names.includes(name));
    if (missing.length) {
      failed = true;
      console.error(`Missing helper functions: ${missing.join(", ")}`);
    }
  } else {
    if (rows.length) {
      failed = true;
      console.error(`Legacy leak in check #${index}:`);
      console.error(JSON.stringify(rows, null, 2));
    }
  }
}

if (failed) {
  process.exit(1);
}

console.log("supabase-db-validate: OK");
