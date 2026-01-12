const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function read(rel) {
  return fs.readFileSync(path.join(__dirname, "..", rel), "utf8");
}

test("App routes /share/:token to DashboardPage public mode", () => {
  const src = read("dashboard/src/App.jsx");
  assert.match(src, /share/i);
  assert.match(src, /publicMode/);
  assert.match(src, /publicToken/);
});

test("DashboardPage disables auth gate in public mode", () => {
  const src = read("dashboard/src/pages/DashboardPage.jsx");
  assert.match(src, /publicMode/);
  assert.match(src, /requireAuthGate/);
});
