# VibeUsage Rename Design

This design captures the agreed approach for renaming VibeScore to VibeUsage with a 90-day compatibility window across CLI, packages, API paths, domains, and local storage.

## Architecture
- The canonical public brand becomes **VibeUsage**.
- CLI, API paths, and local storage use new names, while old names are transparently supported for 90 days.
- Old API paths proxy to new paths without user-visible warnings.

## Components
- CLI entrypoints: `vibeusage` primary, legacy commands alias to new logic.
- Packages: primary package name `vibeusage` (fallback `@vibeusage/tracker` if necessary), legacy packages remain functional.
- API/Edge Functions: `/functions/vibeusage-*` primary with legacy `/functions/vibescore-*` proxy.
- Local storage: migrate `~/.vibescore` to `~/.vibeusage` with idempotent fallback.
- Dashboard/Docs: all public copy and SEO assets updated to VibeUsage via `copy.csv`.

## Data Flow
- Existing ingest and usage flows remain unchanged; only paths and identifiers change.
- Compatibility routing ensures legacy calls reach the new implementation without semantic differences.

## Error Handling
- Migration failures fall back to legacy storage for read/write to avoid blocking sync.
- API compatibility logs for monitoring (no user-visible warnings).

## Testing
- Unit: mapping helpers + migration idempotency.
- Integration: old/new API paths match responses.
- E2E: legacy CLI flows + dashboard queries.

## Rollout
- Publish new package first, then compatibility updates to old packages.
- Keep compatibility for 90 days, then remove via a separate proposal.
