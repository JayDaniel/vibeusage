const assert = require("node:assert/strict");
const { test } = require("node:test");

test("safe browser helpers do not throw when unavailable", async () => {
  const mod = await import("../dashboard/src/lib/safe-browser.js");
  const { safeGetItem, safeSetItem, safeWriteClipboard } = mod;

  assert.equal(typeof safeGetItem, "function");
  assert.equal(typeof safeSetItem, "function");
  assert.equal(typeof safeWriteClipboard, "function");

  assert.equal(safeGetItem("key", { storage: null }), null);
  assert.equal(safeSetItem("key", "value", { storage: null }), false);

  assert.equal(
    safeGetItem("key", {
      storage: {
        getItem() {
          throw new Error("boom");
        },
      },
    }),
    null
  );
  assert.equal(
    safeSetItem("key", "value", {
      storage: {
        setItem() {
          throw new Error("boom");
        },
      },
    }),
    false
  );

  assert.equal(
    safeGetItem("key", {
      storage: {
        getItem() {
          return "value";
        },
      },
    }),
    "value"
  );

  const ok = await safeWriteClipboard("value", {
    clipboard: {
      async writeText() {},
    },
  });
  assert.equal(ok, true);

  const fail = await safeWriteClipboard("value", {
    clipboard: {
      async writeText() {
        throw new Error("boom");
      },
    },
  });
  assert.equal(fail, false);

  const missing = await safeWriteClipboard("value", { clipboard: null });
  assert.equal(missing, false);
});
