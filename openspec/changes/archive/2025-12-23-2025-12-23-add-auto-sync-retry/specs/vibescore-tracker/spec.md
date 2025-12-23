## MODIFIED Requirements
### Requirement: Auto sync uploads are throttled to half-hour cadence
The CLI auto sync path SHALL rate-limit uploads to at most one upload attempt per device every 30 minutes, while manual sync and init-triggered sync run immediately without upload throttling. If auto sync is skipped due to throttling/backoff while pending data exists, the CLI SHALL schedule a retry at or after the next allowed window without requiring a new notify event.

#### Scenario: Auto sync enforces half-hour throttle
- **GIVEN** a device ran `sync --auto` less than 30 minutes ago
- **WHEN** `sync --auto` runs again with pending data
- **THEN** the upload SHOULD be skipped until the next allowed window

#### Scenario: Auto sync schedules retry after throttle
- **GIVEN** pending half-hour buckets exist
- **AND** `sync --auto` is skipped due to throttle/backoff
- **WHEN** the next allowed window arrives
- **THEN** the CLI SHALL attempt a retry without requiring another notify event

#### Scenario: Manual sync uploads immediately
- **GIVEN** pending half-hour buckets exist
- **WHEN** the user runs `npx @vibescore/tracker sync`
- **THEN** the upload SHOULD proceed immediately (no auto throttle)

#### Scenario: Init triggers an immediate sync
- **GIVEN** the user completes `npx @vibescore/tracker init`
- **WHEN** the command finishes
- **THEN** the CLI SHALL run a sync to upload pending half-hour buckets

### Requirement: Auto sync health is diagnosable
The CLI SHALL expose sufficient diagnostics to determine whether auto sync is functioning, degraded, or failing.

#### Scenario: User validates auto sync health
- **WHEN** a user runs `npx @vibescore/tracker status --diagnostics`
- **THEN** the output SHALL include the latest notify timestamp, last notify-triggered sync timestamp, queue pending bytes, upload throttle state, and any scheduled auto retry state
