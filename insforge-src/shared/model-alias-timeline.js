'use strict';

const { normalizeModel } = require('./model');
const { normalizeUsageModelKey } = require('./model-identity');

const DEFAULT_MODEL = 'unknown';

function extractDateKey(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'string' && value.length >= 10) return value.slice(0, 10);
  return null;
}

function resolveIdentityAtDate({ rawModel, usageKey, dateKey, timeline } = {}) {
  const normalized = usageKey || normalizeUsageModelKey(rawModel) || DEFAULT_MODEL;
  const entries = timeline && typeof timeline.get === 'function' ? timeline.get(normalized) : null;
  if (Array.isArray(entries)) {
    let match = null;
    for (const entry of entries) {
      if (entry.effective_from && entry.effective_from <= dateKey) {
        match = entry;
      } else if (entry.effective_from && entry.effective_from > dateKey) {
        break;
      }
    }
    if (match) {
      return { model_id: match.model_id, model: match.model };
    }
  }
  const display = normalizeModel(rawModel) || DEFAULT_MODEL;
  return { model_id: normalized, model: display };
}

function buildAliasTimeline({ usageModels, aliasRows } = {}) {
  const normalized = new Set(
    Array.isArray(usageModels)
      ? usageModels.map((model) => normalizeUsageModelKey(model)).filter(Boolean)
      : []
  );
  const timeline = new Map();
  const rows = Array.isArray(aliasRows) ? aliasRows : [];
  for (const row of rows) {
    const usageKey = normalizeUsageModelKey(row?.usage_model);
    const canonical = normalizeUsageModelKey(row?.canonical_model);
    if (!usageKey || !canonical) continue;
    if (normalized.size && !normalized.has(usageKey)) continue;
    const display = normalizeModel(row?.display_name) || canonical;
    const effective = String(row?.effective_from || '');
    if (!effective) continue;
    const entry = {
      model_id: canonical,
      model: display,
      effective_from: effective
    };
    const list = timeline.get(usageKey);
    if (list) {
      list.push(entry);
    } else {
      timeline.set(usageKey, [entry]);
    }
  }
  for (const list of timeline.values()) {
    list.sort((a, b) => String(a.effective_from).localeCompare(String(b.effective_from)));
  }
  return timeline;
}

async function fetchAliasRows({ edgeClient, usageModels, effectiveDate } = {}) {
  const models = Array.isArray(usageModels)
    ? usageModels.map((model) => normalizeUsageModelKey(model)).filter(Boolean)
    : [];
  if (!models.length || !edgeClient || !edgeClient.database) return [];

  const dateKey =
    typeof effectiveDate === 'string' && effectiveDate.trim()
      ? effectiveDate.trim()
      : new Date().toISOString().slice(0, 10);

  const query = edgeClient.database
    .from('vibescore_model_aliases')
    .select('usage_model,canonical_model,display_name,effective_from')
    .eq('active', true)
    .in('usage_model', models)
    .lte('effective_from', dateKey)
    .order('effective_from', { ascending: true });

  const result = await query;
  const data = Array.isArray(result?.data)
    ? result.data
    : Array.isArray(query?.data)
      ? query.data
      : null;
  if (!Array.isArray(data) || result?.error || query?.error) return [];
  return data;
}

module.exports = {
  extractDateKey,
  resolveIdentityAtDate,
  buildAliasTimeline,
  fetchAliasRows
};
