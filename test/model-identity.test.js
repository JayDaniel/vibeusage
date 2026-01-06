const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  normalizeUsageModelKey,
  buildIdentityMap,
  applyModelIdentity,
  resolveModelIdentity,
  resolveUsageModelsForCanonical
} = require('../insforge-src/shared/model-identity');

test('normalizeUsageModelKey lowercases and trims', () => {
  assert.equal(normalizeUsageModelKey(' GPT-4o '), 'gpt-4o');
  assert.equal(normalizeUsageModelKey(''), null);
});

function createEdgeClient(aliasRows) {
  return {
    database: {
      from: () => {
        const state = {
          filters: {},
          select() {
            return this;
          },
          eq(field, value) {
            this.filters[field] = value;
            return this;
          },
          in(field, values) {
            this.filters[field] = Array.isArray(values) ? values : [values];
            return this;
          },
          lte(field, value) {
            this.filters.lte = { field, value };
            return this;
          },
          lt(field, value) {
            this.filters.lt = { field, value };
            return this;
          },
          order() {
            const data = aliasRows.filter((row) => {
              if (this.filters.active !== undefined && row.active !== this.filters.active) {
                return false;
              }
              if (this.filters.canonical_model && row.canonical_model !== this.filters.canonical_model) {
                return false;
              }
              if (this.filters.usage_model) {
                const allowed = this.filters.usage_model;
                if (Array.isArray(allowed) && !allowed.includes(row.usage_model)) {
                  return false;
                }
              }
              if (this.filters.lt) {
                return String(row[this.filters.lt.field]) < this.filters.lt.value;
              }
              if (this.filters.lte) {
                return String(row[this.filters.lte.field]) <= this.filters.lte.value;
              }
              return true;
            });
            return { data, error: null };
          }
        };
        return state;
      }
    }
  };
}

test('buildIdentityMap selects latest effective mapping', () => {
  const map = buildIdentityMap({
    usageModels: ['gpt-4o-mini'],
    aliasRows: [
      {
        usage_model: 'gpt-4o-mini',
        canonical_model: 'gpt-4o',
        display_name: 'GPT-4o',
        effective_from: '2025-12-01'
      },
      {
        usage_model: 'gpt-4o-mini',
        canonical_model: 'gpt-4o',
        display_name: 'GPT-4o',
        effective_from: '2026-01-01'
      }
    ]
  });
  assert.deepEqual(map.get('gpt-4o-mini'), { model_id: 'gpt-4o', model: 'GPT-4o' });
});

test('applyModelIdentity falls back to raw model', () => {
  const identityMap = new Map();
  const res = applyModelIdentity({ rawModel: 'custom-model', identityMap });
  assert.equal(res.model_id, 'custom-model');
  assert.equal(res.model, 'custom-model');
});

test('resolveUsageModelsForCanonical includes same-day alias timestamps', async () => {
  const edgeClient = createEdgeClient([
    {
      usage_model: 'gpt-foo',
      canonical_model: 'alpha',
      display_name: 'Alpha',
      effective_from: '2025-01-01T12:00:00Z',
      active: true
    }
  ]);

  const { usageModels } = await resolveUsageModelsForCanonical({
    edgeClient,
    canonicalModel: 'alpha',
    effectiveDate: '2025-01-01'
  });

  assert.ok(usageModels.includes('gpt-foo'));
});

test('resolveModelIdentity includes same-day alias timestamps', async () => {
  const edgeClient = createEdgeClient([
    {
      usage_model: 'gpt-foo',
      canonical_model: 'alpha',
      display_name: 'Alpha',
      effective_from: '2025-01-01T12:00:00Z',
      active: true
    }
  ]);

  const identityMap = await resolveModelIdentity({
    edgeClient,
    usageModels: ['gpt-foo'],
    effectiveDate: '2025-01-01'
  });

  assert.deepEqual(identityMap.get('gpt-foo'), { model_id: 'alpha', model: 'Alpha' });
});
