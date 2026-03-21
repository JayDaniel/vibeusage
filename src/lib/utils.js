"use strict";

const fs = require("node:fs/promises");

/**
 * Trim a string value; return null for non-strings or empty/whitespace-only strings.
 */
function normalizeString(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Return the file size in bytes, or 0 if the path is missing / not a file.
 */
async function safeStatSize(p) {
  try {
    const st = await fs.stat(p);
    return st && st.isFile() ? st.size : 0;
  } catch (_e) {
    return 0;
  }
}

/**
 * Read a file as UTF-8 text, returning null on any error.
 */
async function safeReadText(p) {
  try {
    return await fs.readFile(p, "utf8");
  } catch (_e) {
    return null;
  }
}

/**
 * Parse a numeric epoch-millisecond value to an ISO-8601 string, or null.
 */
function parseEpochMsToIso(v) {
  const ms = Number(v);
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/**
 * Return a promise that resolves after `ms` milliseconds.
 */
function sleep(ms) {
  if (!ms || ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Clamp a numeric value to [min, max], floored to an integer.
 */
function clampInt(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

/**
 * Shallow-compare two arrays for strict equality of each element.
 */
function arraysEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

/**
 * Shell-quote a single argument value.
 */
function quoteArg(value) {
  const v = typeof value === "string" ? value : "";
  if (!v) return '""';
  if (/^[A-Za-z0-9_\-./:@]+$/.test(v)) return v;
  return `"${v.replace(/"/g, '\\"')}"`;
}

/**
 * Return true if `p` is a directory, false otherwise.
 */
async function isDir(p) {
  try {
    const st = await fs.stat(p);
    return st.isDirectory();
  } catch (_e) {
    return false;
  }
}

module.exports = {
  normalizeString,
  safeStatSize,
  safeReadText,
  parseEpochMsToIso,
  sleep,
  clampInt,
  arraysEqual,
  quoteArg,
  isDir,
};
