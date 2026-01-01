## 1. Implementation
- [x] 1.1 Add generator entrypoint `scripts/ops/interaction-sequence-canvas.cjs` with non-interactive summary output.
- [x] 1.2 Implement config loader for `interaction_sequence.config.json` (defaults + pin/exclude + max_scenarios).
- [x] 1.3 Implement scenario discovery + scoring + selection (mixed strategy).
- [x] 1.4 Build Canvas model (groups, lifelines, messages, label nodes) and write `interaction_sequence.canvas`.
- [x] 1.5 Add tests (`test/interaction-sequence-canvas.test.js`) for output presence and pin behavior.
- [x] 1.6 Add documentation `docs/interaction-sequence-canvas.md` and (optional) npm script alias.

## 2. Verification
- [x] 2.1 Run `node --test test/interaction-sequence-canvas.test.js`.
- [x] 2.2 Run `npm test`.
- [x] 2.3 Run `node scripts/ops/interaction-sequence-canvas.cjs` and inspect output.

## 3. Canvas Sync
- [x] 3.1 Refresh `architecture.canvas` after implementation.
