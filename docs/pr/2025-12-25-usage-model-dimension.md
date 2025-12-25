# PR Template (Minimal)

## PR Goal (one sentence)
Add model dimension to usage tracking and expose a usage model breakdown endpoint.

## Commit Narrative
- Commit 1: Add model dimension to ingest keys + parser updates + schema migration.
- Commit 2: Add usage model breakdown endpoint + API docs.

## Rollback Semantics
- Reverting this PR restores the previous usage schema without model dimension and removes the breakdown endpoint.

## Hidden Context
- Missing `model` values are normalized to `unknown`.

## Regression Test Gate
### Most likely regression surface
- Ingest idempotency keys, usage endpoint filters, and parser model extraction.

### Verification method (choose at least one)
- [x] Existing automated tests did not fail (commands: `node --test test/rollout-parser.test.js test/uploader.test.js test/edge-functions.test.js` => PASS (30 tests), `node scripts/acceptance/usage-model-breakdown.cjs` => PASS, `node scripts/acceptance/ingest-duplicate-replay.cjs` => PASS)
- [ ] New minimal test added (link or describe)
- [ ] Manual regression path executed (steps + expected result)

### Uncovered scope
- Migration runtime on large tables and live query latency under high cardinality.
- Live data validation for model filter usage.

## Fast-Track (only if applicable)
- Statement: I manually verified **X** behavior on **Y** path did not regress.

## Notes
- High-risk modules touched: schema migrations, ingest/queue pipeline, data writes.
