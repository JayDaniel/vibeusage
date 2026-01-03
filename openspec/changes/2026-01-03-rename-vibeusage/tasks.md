## 1. Implementation
- [ ] 1.1 Create mapping list for all public identifiers (domains, CLI, env vars, API paths, package names).
- [ ] 1.2 Implement CLI alias + rename flow with 90-day compatibility (no warnings).
- [ ] 1.3 Implement local storage migration: `~/.vibescore` -> `~/.vibeusage` with idempotent fallback.
- [ ] 1.4 Implement API path rename: `/functions/vibeusage-*` with proxy from `/functions/vibescore-*`.
- [ ] 1.5 Update dashboard + copy registry to VibeUsage branding.
- [ ] 1.6 Update docs and specs for VibeUsage naming.

## 2. Verification
- [ ] 2.1 Run unit tests covering mapping and migration.
- [ ] 2.2 Verify old CLI commands execute new logic.
- [ ] 2.3 Verify old and new API paths return identical responses.
- [ ] 2.4 Verify local migration is idempotent and non-destructive.
- [ ] 2.5 Record commands and results in `verification-report.md`.
