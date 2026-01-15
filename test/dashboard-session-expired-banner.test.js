const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

function read(rel) {
  return fs.readFileSync(path.join(__dirname, "..", rel), "utf8");
}

test("auth storage exposes session expired helpers", () => {
  const src = read("dashboard/src/lib/auth-storage.js");
  assert.match(src, /SESSION_EXPIRED_KEY/);
  assert.match(src, /loadSessionExpired/);
  assert.match(src, /setSessionExpired/);
  assert.match(src, /clearSessionExpired/);
  assert.match(src, /markSessionExpired/);
  assert.match(src, /subscribeAuthStorage/);
  assert.match(src, /subscribeSessionExpired/);
});

test("App does not use legacy auth hook", () => {
  const src = read("dashboard/src/App.jsx");
  assert.doesNotMatch(src, /useLegacyAuth/);
});

test("main wires InsForge hosted auth routes", () => {
  const src = read("dashboard/src/main.jsx");
  assert.match(src, /@insforge\/react-router/);
  assert.match(src, /getInsforgeRoutes/);
  assert.match(src, /getInsforgeBaseUrl/);
  assert.match(src, /afterSignInUrl/);
});

test("insforge auth client wrapper uses base url and anon key", () => {
  const wrapper = read("dashboard/src/lib/insforge-auth-client.js");
  assert.match(wrapper, /createInsforgeAuthClient/);

  const src = read("dashboard/src/lib/insforge-client.js");
  assert.match(src, /createInsforgeAuthClient/);
  assert.match(src, /getInsforgeBaseUrl/);
  assert.match(src, /getInsforgeAnonKey/);
});

test("App uses hosted auth routes for Landing login", () => {
  const src = read("dashboard/src/App.jsx");
  assert.match(src, /hostedSignInUrl/);
  assert.match(src, /hostedSignUpUrl/);
});

test("App routes LandingPage when signed out", () => {
  const src = read("dashboard/src/App.jsx");
  assert.match(src, /!publicMode\s*&&\s*!signedIn\s*&&\s*!mockEnabled/);
});

test("App uses InsForge auth hook for signed-in gating", () => {
  const src = read("dashboard/src/App.jsx");
  assert.match(src, /@insforge\/react-router/);
  assert.match(src, /useInsforgeAuth/);
});

test("App derives signedIn from sessionExpired gate", () => {
  const src = read("dashboard/src/App.jsx");
  assert.match(src, /const signedIn\s*=\s*useInsforge\s*&&\s*!sessionExpired/);
});

test("App disables auth when session expired", () => {
  const src = read("dashboard/src/App.jsx");
  const match = src.match(
    /useMemo\([\s\S]*?\n\s*if\s*\([^)]+sessionExpired[^)]*\)\s*return\s*null;/
  );
  assert.ok(match, "expected auth guard for sessionExpired");
});

test("App provides InsForge access token resolver", () => {
  const src = read("dashboard/src/App.jsx");
  assert.match(src, /getCurrentSession/);
  assert.match(src, /getAccessToken/);
});

test("App subscribes to sessionExpired state", () => {
  const src = read("dashboard/src/App.jsx");
  assert.match(src, /loadSessionExpired/);
  assert.match(src, /subscribeSessionExpired/);
});

test("App probes backend to revalidate expired sessions", () => {
  const src = read("dashboard/src/App.jsx");
  assert.match(src, /probeBackend/);
  assert.match(src, /sessionExpired/);
  assert.match(src, /getInsforgeAccessToken\(\)[\s\S]*probeBackend/);
});

test("vibescore-api resolves access token providers", () => {
  const src = read("dashboard/src/lib/vibescore-api.js");
  assert.match(src, /resolveAccessToken/);
  assert.match(src, /typeof\s+accessToken\s*===\s*\"function\"/);
});

test("App avoids legacy auth fallback before InsForge is ready", () => {
  const src = read("dashboard/src/App.jsx");
  assert.match(src, /insforgeLoaded\s*&&\s*insforgeSignedIn/);
});

test("DashboardPage shows session expired banner and bypasses auth gate", () => {
  const src = read("dashboard/src/pages/DashboardPage.jsx");
  assert.match(src, /sessionExpired/);
  assert.match(src, /dashboard\.session_expired\.title/);
  assert.match(src, /requireAuthGate\s*=\s*!signedIn\s*&&\s*!mockEnabled\s*&&\s*!sessionExpired/);
});

test("DashboardPage disables auth access token when session expired", () => {
  const src = read("dashboard/src/pages/DashboardPage.jsx");
  assert.match(
    src,
    /const authAccessToken\s*=\s*signedIn\s*\?\s*\(?\s*auth\?\.getAccessToken/
  );
});

test("vibescore-api marks session expired only for jwt access tokens", () => {
  const src = read("dashboard/src/lib/vibescore-api.js");
  assert.match(src, /markSessionExpired/);
  assert.match(src, /isJwtAccessToken/);
  const match = src.match(/function shouldMarkSessionExpired[\s\S]*?\n}/);
  assert.ok(match, "expected shouldMarkSessionExpired helper");
  assert.match(match[0], /status\s*(?:===|!==)\s*401/);
  assert.match(match[0], /hasAccessTokenValue/);
  assert.match(match[0], /isJwtAccessToken\(/);
});

test("vibescore-api clears session expired after successful jwt responses", () => {
  const src = read("dashboard/src/lib/vibescore-api.js");
  assert.match(src, /clearSessionExpired/);
  const match = src.match(/function shouldClearSessionExpired[\s\S]*?\n}/);
  assert.ok(match, "expected shouldClearSessionExpired helper");
  assert.match(match[0], /hasAccessTokenValue/);
  assert.match(match[0], /isJwtAccessToken\(/);
});

test("copy registry includes session expired strings", () => {
  const src = read("dashboard/src/content/copy.csv");
  assert.ok(src.includes("dashboard.session_expired.title"));
  assert.ok(src.includes("dashboard.session_expired.subtitle"));
  assert.ok(src.includes("dashboard.session_expired.body"));
  assert.ok(src.includes("dashboard.session_expired.body_tail"));
  assert.ok(src.includes("dashboard.session_expired.copy_label"));
  assert.ok(src.includes("dashboard.session_expired.copied"));
});

test("auth storage skips localStorage when window is undefined", async () => {
  const originalLocalStorage = globalThis.localStorage;
  const originalWindow = globalThis.window;
  const hadWindow = Object.prototype.hasOwnProperty.call(globalThis, "window");

  let setItemCalls = 0;
  globalThis.localStorage = {
    getItem() {
      throw new Error("unexpected localStorage access");
    },
    setItem() {
      setItemCalls += 1;
      throw new Error("unexpected localStorage access");
    },
    removeItem() {
      throw new Error("unexpected localStorage access");
    },
  };

  if (hadWindow) delete globalThis.window;

  const modulePath = path.resolve(
    __dirname,
    "../dashboard/src/lib/auth-storage.js"
  );
  const { setSessionExpired } = await import(pathToFileURL(modulePath).href);

  assert.doesNotThrow(() => {
    setSessionExpired();
  });
  assert.equal(setItemCalls, 0);

  if (hadWindow) globalThis.window = originalWindow;
  else delete globalThis.window;
  globalThis.localStorage = originalLocalStorage;
});

test("DashboardPage gates expired UI", () => {
  const src = read("dashboard/src/pages/DashboardPage.jsx");
  assert.match(src, /const showExpiredGate\s*=\s*sessionExpired\s*&&\s*!publicMode/);
  assert.match(src, /showExpiredGate\s*\?\s*\(/);
});

test("DashboardPage disables backend status when signed out or expired", () => {
  const src = read("dashboard/src/pages/DashboardPage.jsx");
  assert.match(src, /const headerStatus\s*=\s*signedIn\s*\?\s*\(\s*<BackendStatus/);
});
