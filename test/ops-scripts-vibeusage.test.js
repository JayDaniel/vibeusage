const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { test } = require("node:test");

const repoRoot = path.join(__dirname, "..");

async function read(relPath) {
  return fs.readFile(path.join(repoRoot, relPath), "utf8");
}

test("ops scripts reference VibeUsage defaults", async () => {
  const backfill = await read("scripts/ops/backfill-codex-unknown.cjs");
  const ingest = await read("scripts/ops/ingest-canary.cjs");

  assert.ok(backfill.includes(".vibeusage"), "expected backfill to reference .vibeusage");
  assert.ok(backfill.includes("vibeusage"), "expected backfill to reference vibeusage package");
  assert.ok(!backfill.includes(".vibescore"), "backfill should not reference .vibescore");
  assert.ok(
    !backfill.includes("@vibescore/tracker"),
    "backfill should not reference @vibescore/tracker",
  );

  assert.ok(
    ingest.includes("/functions/vibeusage-ingest"),
    "expected ingest canary to hit vibeusage endpoint",
  );
  assert.ok(
    !ingest.includes("/functions/vibescore-ingest"),
    "ingest canary should not reference vibescore endpoint",
  );
});

test("ops scripts surface supported env fallbacks in error messages", async () => {
  const ingest = await read("scripts/ops/ingest-canary.cjs");
  const billable = await read("scripts/ops/billable-total-tokens-backfill.cjs");

  const ingestMissingMatch = ingest.match(/Missing base URL:[^\n]+/);
  assert.ok(ingestMissingMatch, "expected ingest canary to include a missing base URL message");
  const ingestMissingBaseUrl = ingestMissingMatch[0];
  for (const envName of [
    "VIBEUSAGE_CANARY_BASE_URL",
    "VIBEUSAGE_SUPABASE_URL",
    "SUPABASE_URL",
  ]) {
    assert.ok(
      ingestMissingBaseUrl.includes(envName),
      `expected ingest canary missing base URL message to mention ${envName}`,
    );
  }

  const billableMissingBaseMatch = billable.match(/Missing base URL:[^\n]+/);
  assert.ok(
    billableMissingBaseMatch,
    "expected billable backfill to include a missing base URL message",
  );
  const billableMissingBaseUrl = billableMissingBaseMatch[0];
  for (const envName of ["SUPABASE_URL", "VIBEUSAGE_SUPABASE_URL"]) {
    assert.ok(
      billableMissingBaseUrl.includes(envName),
      `expected billable backfill missing base URL message to mention ${envName}`,
    );
  }

  const billableMissingRoleMatch = billable.match(/Missing service role key:[^\n]+/);
  assert.ok(
    billableMissingRoleMatch,
    "expected billable backfill to include a missing service role message",
  );
  const billableMissingServiceRole = billableMissingRoleMatch[0];
  for (const envName of ["SUPABASE_SERVICE_ROLE_KEY", "VIBEUSAGE_SERVICE_ROLE_KEY"]) {
    assert.ok(
      billableMissingServiceRole.includes(envName),
      `expected billable backfill missing service role message to mention ${envName}`,
    );
  }
});

test("rename scripts update request header helpers", async () => {
  const rename = await read("scripts/ops/rename-vibeusage-db.sql");
  assert.ok(
    rename.includes("vibeusage_request_header"),
    "expected rename script to update request header helper",
  );
  assert.ok(
    rename.includes("vibeusage_device_token_hash"),
    "expected rename script to update device token helper",
  );

  const rollback = await read("scripts/ops/rename-vibeusage-db-rollback.sql");
  assert.ok(
    rollback.includes("'vibe' || 'score_request_header'"),
    "expected rollback script to restore legacy request header helper",
  );
  assert.ok(
    rollback.includes("'vibe' || 'score_device_token_hash'"),
    "expected rollback script to restore legacy device token helper",
  );
});

test("supabase db validate scripts include legacy leak checks", async () => {
  const sql = await read("scripts/ops/supabase-db-validate.sql");
  assert.ok(
    sql.includes("vibeusage_request_headers"),
    "expected db validate SQL to check helper functions",
  );
  assert.ok(
    sql.includes("'vibe' || 'score_request_header%'"),
    "expected db validate SQL to check legacy request header references",
  );
  assert.ok(sql.includes("pg_policies"), "expected db validate SQL to check policy leaks");

  const script = await read("scripts/ops/supabase-db-validate.cjs");
  assert.ok(script.includes("supabase-db-validate.sql"), "expected validator to load SQL file");
  assert.ok(
    script.includes("VIBEUSAGE_SUPABASE_URL"),
    "expected validator to require base URL",
  );
  assert.ok(
    script.includes("VIBEUSAGE_SERVICE_ROLE_KEY"),
    "expected validator to require service role key",
  );
});

test("supabase db validate fails on non-2xx responses", async () => {
  let calls = 0;
  const server = http.createServer((req, res) => {
    if (req.method !== "POST" || req.url !== "/api/database/query") {
      res.writeHead(404);
      res.end();
      return;
    }
    calls += 1;
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      if (calls === 1) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            rows: [
              { proname: "vibeusage_request_headers" },
              { proname: "vibeusage_request_header" },
              { proname: "vibeusage_device_token_hash" },
            ],
          }),
        );
        return;
      }
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "boom" }));
    });
  });

  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const result = await new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      [path.join(repoRoot, "scripts/ops/supabase-db-validate.cjs")],
      {
        env: {
          ...process.env,
          VIBEUSAGE_SUPABASE_URL: baseUrl,
          VIBEUSAGE_SERVICE_ROLE_KEY: "test-key",
        },
      },
    );
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("close", (code) => {
      resolve({ code, stdout, stderr });
    });
  });

  await new Promise((resolve) => server.close(resolve));

  assert.notEqual(
    result.code,
    0,
    `expected non-zero exit code, got ${result.code}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
  );
});

test("supabase db validate honors VIBEUSAGE_HTTP_TIMEOUT_MS", async () => {
  let calls = 0;
  const server = http.createServer((req, res) => {
    if (req.method !== "POST" || req.url !== "/api/database/query") {
      res.writeHead(404);
      res.end();
      return;
    }
    calls += 1;
    setTimeout(() => {
      res.writeHead(200, { "Content-Type": "application/json" });
      if (calls === 1) {
        res.end(
          JSON.stringify({
            rows: [
              { proname: "vibeusage_request_headers" },
              { proname: "vibeusage_request_header" },
              { proname: "vibeusage_device_token_hash" },
            ],
          }),
        );
        return;
      }
      res.end(JSON.stringify({ rows: [] }));
    }, 200);
  });

  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const result = await new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      [path.join(repoRoot, "scripts/ops/supabase-db-validate.cjs")],
      {
        env: {
          ...process.env,
          VIBEUSAGE_SUPABASE_URL: baseUrl,
          VIBEUSAGE_SERVICE_ROLE_KEY: "test-key",
          VIBEUSAGE_HTTP_TIMEOUT_MS: "50",
        },
      },
    );
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("close", (code) => {
      resolve({ code, stdout, stderr });
    });
  });

  await new Promise((resolve) => server.close(resolve));

  assert.notEqual(
    result.code,
    0,
    `expected non-zero exit code, got ${result.code}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
  );
});
