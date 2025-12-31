# Acceptance Criteria

## Feature: Ingest guardrails & observability

### Requirement: M1 structured logs for critical functions
- Rationale: 支持责任归因与快速定位。

#### Scenario: Ingest request emits M1 log
- WHEN a client calls `POST /functions/vibescore-ingest`
- THEN the function SHALL emit a structured log containing `request_id`, `function`, `stage`, `status`, `latency_ms`, `error_code`, `upstream_status`, `upstream_latency_ms`
- AND the log SHALL NOT include payload contents

### Requirement: Concurrency guard for ingest
- Rationale: 降低认证/连接风暴对 DB 的冲击。

#### Scenario: Too many concurrent ingest requests
- WHEN concurrent requests exceed the configured limit
- THEN the endpoint SHALL respond `429` with `Retry-After` header
- AND the request SHALL NOT reach DB writes

### Requirement: Canary probe is safe and idempotent
- Rationale: 低成本早期发现

#### Scenario: Canary run
- WHEN the canary script runs with a dedicated device token
- THEN it SHALL perform a single ingest with `source=model=canary`
- AND repeated runs SHALL not mutate real user usage totals
