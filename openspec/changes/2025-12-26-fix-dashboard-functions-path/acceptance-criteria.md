# Acceptance Criteria

## Feature: Dashboard function path compatibility

### Requirement: Prefer `/api/functions` and fallback on 404
- Rationale: New gateways expose edge functions under `/api/functions`, while legacy paths remain `/functions`.

#### Scenario: 404 triggers legacy retry
- WHEN the dashboard requests `usage-summary` via `/api/functions/vibescore-usage-summary`
- AND the gateway responds with HTTP 404
- THEN the dashboard SHALL retry once using `/functions/vibescore-usage-summary`
- AND the response data SHALL be used if the legacy path succeeds

### Requirement: Non-404 errors do not fallback
- Rationale: Unauthorized or server errors should surface without hidden retries.

#### Scenario: 401 does not retry
- WHEN the dashboard requests `usage-summary` via `/api/functions/vibescore-usage-summary`
- AND the gateway responds with HTTP 401
- THEN the dashboard SHALL NOT retry `/functions/...`
- AND the original error SHALL be surfaced

### Requirement: Backend probe follows the same path policy
- Rationale: Health checks should not report false-down due to path mismatch.

#### Scenario: Probe succeeds after fallback
- WHEN the backend probe receives HTTP 404 from `/api/functions/vibescore-usage-summary`
- AND the legacy path `/functions/vibescore-usage-summary` succeeds
- THEN the probe SHALL report status `active`
