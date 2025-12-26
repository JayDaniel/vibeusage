# Requirement Analysis

## Goal
- Ensure the dashboard can fetch InsForge edge function data across gateway path differences by preferring `/api/functions` and falling back to `/functions` on 404.

## Scope
- In scope:
  - Dashboard request path resolution for usage endpoints and backend probe.
  - Documentation updates for dashboard API path guidance.
- Out of scope:
  - Backend routing changes or InsForge deployment configuration.
  - CLI request paths.
  - Auth flow changes or new UI copy.

## Users / Actors
- Dashboard users (signed-in).
- Dashboard frontend runtime.
- InsForge gateway / edge function router.

## Inputs
- `baseUrl` (from `VITE_VIBESCORE_INSFORGE_BASE_URL`).
- `accessToken` (user JWT).
- Edge function path/slug.
- HTTP status codes (notably 404).

## Outputs
- Successful JSON payloads for usage endpoints.
- Accurate backend status signal without false-down due to path mismatch.
- Clear errors for non-404 failures.

## Business Rules
- Prefer `/api/functions/<slug>` for edge function calls.
- If the preferred path returns HTTP 404, retry once using `/functions/<slug>`.
- Do not retry on non-404 errors (e.g., 401/403/5xx) to avoid masking issues.
- Apply fallback only to idempotent GET requests.

## Assumptions
- 404 indicates a path mismatch (not a missing function).
- `/api/functions` is the canonical path in newer gateway deployments.
- Fallback to `/functions` is safe for GET endpoints.

## Dependencies
- `dashboard/src/lib/vibescore-api.js` request layer.
- `@insforge/sdk` HTTP client behavior.
- `docs/dashboard/api.md` and `BACKEND_API.md` path guidance.

## Risks
- Extra latency on environments that still return 404 for `/api/functions`.
- Potential to obscure misconfigured base URLs if fallback succeeds silently.
- CORS differences between gateways if configured asymmetrically.
