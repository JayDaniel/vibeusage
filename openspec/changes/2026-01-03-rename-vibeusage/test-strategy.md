# Test Strategy

## Unit
- Path/env var mapping helpers (old -> new).
- Local storage migration (idempotent, partial data, permission errors).

## Integration
- Old `/functions/vibescore-*` routes proxy to `/functions/vibeusage-*` with identical responses.
- CLI old command aliases execute same logic as new commands.

## End-to-End
- Run `init` then `sync` using old command + legacy local directory.
- Run dashboard queries against new API paths.

## Verification Artifacts
- Record commands and outputs in `verification-report.md`.
