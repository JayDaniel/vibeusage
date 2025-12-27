const assert = require("node:assert/strict");
const { test } = require("node:test");

test("buildFleetData keeps usage tokens for fleet rows", async () => {
  const mod = await import("../dashboard/src/lib/model-breakdown.js");
  const buildFleetData = mod.buildFleetData;

  const modelBreakdown = {
    pricing: { pricing_mode: "list" },
    sources: [
      {
        source: "cli",
        totals: { total_tokens: 1200, total_cost_usd: 1.2 },
        models: [
          {
            model: "gpt-4o",
            totals: { total_tokens: 1200 }
          }
        ]
      },
      {
        source: "api",
        totals: { total_tokens: 0, total_cost_usd: 0 },
        models: []
      }
    ]
  };

  assert.equal(typeof buildFleetData, "function");

  const fleetData = buildFleetData(modelBreakdown);

  assert.equal(fleetData.length, 1);
  assert.equal(fleetData[0].label, "CLI");
  assert.equal(fleetData[0].usage, 1200);
  assert.equal(fleetData[0].totalPercent, "100.0");
});
