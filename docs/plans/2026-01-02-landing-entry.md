# Landing Default Entry Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将未登录或会话过期用户默认引导至 Landing，mock 模式保持直达 Dashboard。

**Architecture:** 仅调整 `dashboard/src/App.jsx` 的页面分发条件，不新增路由或新模块；`useAuth` 仍为单一真源。

**Tech Stack:** React (Vite), Node test runner.

---

### Task 1: Update regression test for landing gate

**Files:**
- Modify: `test/dashboard-session-expired-banner.test.js`

**Step 1: Write the failing test**

```js
test("App routes LandingPage when signed out (sessionExpired does not bypass)", () => {
  const src = read("dashboard/src/App.jsx");
  assert.match(src, /!signedIn\s*&&\s*!mockEnabled/);
  assert.doesNotMatch(src, /!signedIn\s*&&\s*!mockEnabled\s*&&\s*!sessionExpired/);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test test/dashboard-session-expired-banner.test.js`

Expected: FAIL because `App.jsx` still includes `!sessionExpired` in the landing gate.

### Task 2: Update landing gating in App

**Files:**
- Modify: `dashboard/src/App.jsx`

**Step 1: Write minimal implementation**

```jsx
if (!signedIn && !mockEnabled) {
  content = <LandingPage signInUrl={signInUrl} signUpUrl={signUpUrl} />;
}
```

**Step 2: Run test to verify it passes**

Run: `node --test test/dashboard-session-expired-banner.test.js`

Expected: PASS.

### Task 3: Update architecture canvas

**Files:**
- Modify: `architecture.canvas`

**Step 1: Regenerate canvas**

Run: `node scripts/ops/architecture-canvas.cjs`

Expected: Command succeeds and `architecture.canvas` updated timestamp.

### Task 4: Commit

**Step 1: Run regression**

Run: `node --test test/dashboard-session-expired-banner.test.js`

Expected: PASS.

**Step 2: Commit**

```bash
git add test/dashboard-session-expired-banner.test.js dashboard/src/App.jsx architecture.canvas
git commit -m "fix: default landing for signed-out sessions"
```
