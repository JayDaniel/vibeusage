## ADDED Requirements
### Requirement: Dashboard resolves edge function path compatibility
The dashboard SHALL prefer calling edge functions under `/api/functions` and SHALL fall back to `/functions` when the preferred path returns HTTP 404, limited to idempotent GET requests.

#### Scenario: 404 fallback for usage summary
- **WHEN** the dashboard calls `GET /api/functions/vibescore-usage-summary`
- **AND** the gateway responds with HTTP 404
- **THEN** the dashboard SHALL retry `GET /functions/vibescore-usage-summary`
- **AND** use the response if the legacy path succeeds

#### Scenario: Unauthorized does not fallback
- **WHEN** the dashboard calls `GET /api/functions/vibescore-usage-summary`
- **AND** the gateway responds with HTTP 401
- **THEN** the dashboard SHALL NOT retry `/functions/...`
