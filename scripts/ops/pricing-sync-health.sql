-- Pricing sync health check for OpenRouter rows.
-- Run in InsForge SQL console or via admin tooling.

-- 1) Freshness check (expect is_fresh = true for 6h schedule, allow 12h drift).
select
  max(created_at) as last_created_at,
  (max(created_at) >= now() - interval '12 hours') as is_fresh
from vibescore_pricing_profiles
where source = 'openrouter';

-- 2) Active rows for the latest effective date.
with latest as (
  select max(effective_from) as effective_from
  from vibescore_pricing_profiles
  where source = 'openrouter' and active = true
)
select effective_from, count(*) as active_rows
from vibescore_pricing_profiles
where source = 'openrouter'
  and active = true
  and effective_from = (select effective_from from latest)
group by effective_from;

-- 3) Default model presence (exact or suffix match).
select model, source, effective_from, active, created_at
from vibescore_pricing_profiles
where source = 'openrouter'
  and (model = 'gpt-5.2-codex' or model like '%/gpt-5.2-codex')
order by effective_from desc, created_at desc
limit 1;
