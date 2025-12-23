# Change: Add auto sync retry after throttle

## Why
- Auto sync can be skipped due to throttle/backoff, and without a new notify event pending data can remain unsent for hours.

## What Changes
- Schedule a delayed auto retry when `sync --auto` is throttled/backoff and pending data exists.
- Expose auto retry state in diagnostics.

## Impact
- Affected specs: vibescore-tracker
- Affected code: `src/commands/sync.js`, `src/lib/diagnostics.js`, `src/commands/status.js`, `test/*`
- **BREAKING**: none

## Architecture / Flow
- notify -> `sync --auto` -> throttled/backoff -> write `auto.retry.json` -> delayed retry -> `sync --auto` again.

## Risks & Mitigations
- Risk: background retry may not run if the machine sleeps. Mitigation: retry state is persisted and will be rescheduled on the next auto attempt.

## Rollout / Milestones
- Land with unit tests + diagnostics coverage; monitor auto sync health for 24h.
