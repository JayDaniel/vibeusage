# Usage Rollup Audit Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a lightweight audit that detects rollup vs hourly mismatches with minimal query cost.

**Architecture:** Introduce a small audit helper that compares daily rollup totals against hourly totals for sampled users and recent days. A Node script runs the audit on demand (and optionally via CI schedule), exits non-zero on mismatches, and logs a concise report. Queries use aggregate sums and a small sample size to keep cost low.

**Tech Stack:** Node.js scripts, InsForge edge client/database, node:test.

---

### Task 1: Add rollup audit helper + unit test

**Files:**
- Create: `insforge-src/shared/rollup-audit.js`
- Create: `test/rollup-audit.test.js`

**Step 1: Write the failing test**

```js
const assert = require('node:assert/strict');
const { test } = require('node:test');

const { compareRollupVsHourly } = require('../insforge-src/shared/rollup-audit');

function createClient({ rollupTotal, hourlyTotal }) {
  return {
    database: {
      from() {
        return {
          select() { return this; },
          eq() { return this; },
          gte() { return this; },
          lt() { return this; },
          maybeSingle() {
            return Promise.resolve({
              data: { total_tokens: rollupTotal },
              error: null
            });
          }
        };
      }
    }
  };
}

test('compareRollupVsHourly returns mismatch when totals differ', async () => {
  const edgeClient = createClient({ rollupTotal: 5, hourlyTotal: 10 });
  const result = await compareRollupVsHourly({
    edgeClient,
    userId: 'user-1',
    day: '2025-12-02'
  });
  assert.equal(result.matched, false);
  assert.equal(result.rollupTotal, 5n);
  assert.equal(result.hourlyTotal, 10n);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test test/rollup-audit.test.js`
Expected: FAIL (module/function missing).

**Step 3: Write minimal implementation**

```js
'use strict';

const { toBigInt } = require('./numbers');
const { addUtcDays, formatDateUTC, parseDateParts, dateFromPartsUTC } = require('./date');

async function sumDailyRollup({ edgeClient, userId, day }) {
  const { data, error } = await edgeClient.database
    .from('vibescore_tracker_daily_rollup')
    .select('total_tokens')
    .eq('user_id', userId)
    .eq('day', day)
    .maybeSingle();
  if (error) return { ok: false, error };
  return { ok: true, total: toBigInt(data?.total_tokens) };
}

async function sumHourly({ edgeClient, userId, day }) {
  const parts = parseDateParts(day);
  const start = dateFromPartsUTC(parts);
  const end = addUtcDays(start, 1);
  const { data, error } = await edgeClient.database
    .from('vibescore_tracker_hourly')
    .select('total_tokens')
    .eq('user_id', userId)
    .gte('hour_start', start.toISOString())
    .lt('hour_start', end.toISOString());
  if (error) return { ok: false, error };
  const total = (Array.isArray(data) ? data : []).reduce(
    (acc, row) => acc + toBigInt(row?.total_tokens),
    0n
  );
  return { ok: true, total };
}

async function compareRollupVsHourly({ edgeClient, userId, day }) {
  const rollup = await sumDailyRollup({ edgeClient, userId, day });
  if (!rollup.ok) throw rollup.error;
  const hourly = await sumHourly({ edgeClient, userId, day });
  if (!hourly.ok) throw hourly.error;
  return {
    matched: rollup.total === hourly.total,
    rollupTotal: rollup.total,
    hourlyTotal: hourly.total
  };
}

module.exports = { compareRollupVsHourly };
```

**Step 4: Run test to verify it passes**

Run: `node --test test/rollup-audit.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add insforge-src/shared/rollup-audit.js test/rollup-audit.test.js
git commit -m "feat: add rollup audit helper"
```

---

### Task 2: Add audit script + integration test

**Files:**
- Create: `scripts/ops/usage-rollup-audit.cjs`
- Create: `test/usage-rollup-audit.test.js`

**Step 1: Write the failing test**

```js
const assert = require('node:assert/strict');
const { test } = require('node:test');

const { runAudit } = require('../scripts/ops/usage-rollup-audit.cjs');

test('runAudit reports mismatch and sets exit status', async () => {
  const result = await runAudit({
    edgeClient: { /* stubbed client with mismatch */ },
    sampleUsers: ['user-1'],
    days: ['2025-12-02']
  });
  assert.equal(result.mismatches, 1);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test test/usage-rollup-audit.test.js`
Expected: FAIL (module missing).

**Step 3: Write minimal implementation**

```js
#!/usr/bin/env node
'use strict';

const { compareRollupVsHourly } = require('../../insforge-src/shared/rollup-audit');

async function runAudit({ edgeClient, sampleUsers, days }) {
  let mismatches = 0;
  for (const userId of sampleUsers) {
    for (const day of days) {
      const result = await compareRollupVsHourly({ edgeClient, userId, day });
      if (!result.matched) mismatches += 1;
    }
  }
  return { mismatches };
}

module.exports = { runAudit };
```

**Step 4: Run test to verify it passes**

Run: `node --test test/usage-rollup-audit.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/ops/usage-rollup-audit.cjs test/usage-rollup-audit.test.js
git commit -m "feat: add usage rollup audit script"
```

---

### Task 3: Add scheduler hook (optional)

**Files:**
- Modify: `.github/workflows/usage-rollup-audit.yml`

**Step 1: Write failing test (if workflow tests exist)**

If no workflow test harness exists, skip automated test and rely on manual dry run.

**Step 2: Add workflow**

```yaml
name: Usage Rollup Audit
on:
  schedule:
    - cron: "0 3 * * *"
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: node scripts/ops/usage-rollup-audit.cjs
        env:
          INSFORGE_INTERNAL_URL: ${{ secrets.INSFORGE_INTERNAL_URL }}
          INSFORGE_SERVICE_ROLE_KEY: ${{ secrets.INSFORGE_SERVICE_ROLE_KEY }}
```

**Step 3: Manual verification**

Run: `node scripts/ops/usage-rollup-audit.cjs` (with env vars set)
Expected: exits 0 with summary report when no mismatches.

**Step 4: Commit**

```bash
git add .github/workflows/usage-rollup-audit.yml
git commit -m "chore: add rollup audit workflow"
```
