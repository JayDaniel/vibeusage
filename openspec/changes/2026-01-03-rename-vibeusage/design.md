## Context
We are renaming the product from VibeScore to VibeUsage and must update all public-facing identifiers while preserving compatibility for existing users for 90 days. This is a cross-cutting change across CLI, dashboard, edge functions, docs, and operational assets.

## Goals / Non-Goals
- Goals:
  - Public brand and identifiers use **VibeUsage** consistently.
  - Old commands, API paths, and local storage remain functional for 90 days via transparent compatibility.
  - No data loss during local storage migration.
- Non-Goals:
  - Changing core product behavior or analytics logic.
  - Removing legacy compatibility before the 90-day window ends.

## Decisions
- Decision: Keep a 90-day compatibility layer that transparently redirects old CLI commands, API paths, and local storage locations to the new naming.
- Decision: Primary NPM package becomes `vibeusage` (fallback `@vibeusage/tracker` if needed), with old packages acting as compatibility entrypoints.
- Decision: Vercel domain is `www.vibeusage.cc`; legacy domains 301 to canonical.

## Alternatives Considered
- Partial rename (dashboard only): rejected due to inconsistent public identity and long-term maintenance burden.
- Immediate cutover without compatibility: rejected due to breakage risk for existing users.

## Risks / Trade-offs
- Risk: Missed references (docs/tests/env vars) causing regressions → mitigate via exhaustive search + new tests.
- Risk: Local storage migration failure → mitigate with idempotent migration, read-old/write-new fallback, and safe rollback.
- Risk: API consumers relying on old paths → mitigate with 90-day transparent proxy and monitoring.

## Migration Plan
1. Update brand identifiers and domain config in docs and dashboard SEO assets.
2. Implement compatibility wrappers for old CLI commands and API paths.
3. Migrate local storage to `~/.vibeusage` with idempotent fallback to old path.
4. Publish new package name; publish a compatibility update to old packages.
5. Validate with regression tests + manual verification.

## Open Questions
- Confirm final naming for any CLI binary aliases beyond `vibeusage`.
