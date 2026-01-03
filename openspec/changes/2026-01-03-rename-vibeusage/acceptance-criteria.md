# Acceptance Criteria

1. Public-facing brand and identifiers show **VibeUsage** (dashboard, docs, CLI output, SEO).
2. `vibeusage` package is publishable; old packages remain functional via compatibility.
3. Old CLI commands and old API paths work transparently for 90 days.
4. Local storage migration from `~/.vibescore` to `~/.vibeusage` is idempotent and non-destructive.
5. All copy changes are centralized in `dashboard/src/content/copy.csv`.
6. Regression tests and verification steps are recorded with commands and outcomes.
