## 1. Implementation
- [ ] 1.1 Add shared usage aggregation module (single-pass totals + billable).
- [ ] 1.2 Migrate usage endpoints to shared aggregator (daily/hourly/heatmap/monthly/summary/model-breakdown).
- [ ] 1.3 Keep query shapes and response schemas unchanged.
- [ ] 1.4 Regenerate InsForge functions (`npm run build:insforge`).

## 2. Tests
- [ ] 2.1 Add unit tests for shared aggregator.
- [ ] 2.2 Update/extend endpoint tests for consistency across endpoints.
- [ ] 2.3 Run full suite (`node --test test/*.test.js`).

## 3. Docs
- [ ] 3.1 Update any relevant docs if behavior notes change.
- [ ] 3.2 Record verification commands/results.

## Verification
- [ ] `node --test test/*.test.js` (PASS)
