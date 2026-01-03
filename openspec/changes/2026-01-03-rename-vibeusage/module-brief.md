# Module Brief: VibeUsage Rename & Compatibility Layer

## Scope
- IN: CLI commands, NPM package names, env vars, local storage path, API/Edge Function paths, docs/copy registry, domain and SEO assets.
- OUT: Core analytics logic changes, pricing logic changes, platform expansion.

## Interfaces
- CLI: `vibeusage` commands and aliases.
- API: `/functions/vibeusage-*` with compatibility for `/functions/vibescore-*`.
- Storage: `~/.vibeusage/` primary; legacy `~/.vibescore/` read compatibility.
- Domains: `www.vibeusage.cc` canonical; legacy domains 301.

## Data Flow and Constraints
- Local migration must be idempotent and non-destructive.
- Compatibility layer must preserve path + query parameters.
- Tokens and auth flows remain unchanged.

## Non-Negotiables
- 90-day compatibility window.
- Copy must go through `dashboard/src/content/copy.csv`.
- No hardcoded secrets.

## Test Strategy
- Unit tests for mapping + migration helpers.
- Integration tests for old/new API paths.
- E2E or scripted verification for CLI init/sync and dashboard usage.

## Milestones
1. Proposal + spec deltas approved.
2. Compatibility scaffolding implemented.
3. Rename rollout complete + verification done.
4. Compatibility window tracking prepared.

## Plan B Triggers
- Migration error rate >1% in manual tests.
- Critical CLI regression in `init` or `sync` flows.
- API compatibility fails for old paths.

## Upgrade Plan (disabled by default)
- After 90 days, prepare a separate proposal to remove legacy paths and aliases.
