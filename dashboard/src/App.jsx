import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuth as useInsforgeAuth } from "@insforge/react-router";

import { getInsforgeBaseUrl } from "./lib/config.js";
import { buildAuthUrl } from "./lib/auth-url.js";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import { LandingPage } from "./pages/LandingPage.jsx";
import { isMockEnabled } from "./lib/mock-data.js";
import { fetchLatestTrackerVersion } from "./lib/npm-version.js";
import {
  clearAuthStorage,
  clearSessionExpired,
  loadSessionExpired,
  subscribeSessionExpired,
} from "./lib/auth-storage.js";
import { insforgeAuthClient } from "./lib/insforge-auth-client.js";
import { probeBackend } from "./lib/vibescore-api.js";

import { UpgradeAlertModal } from "./ui/matrix-a/components/UpgradeAlertModal.jsx";

const DashboardPage = React.lazy(() =>
  import("./pages/DashboardPage.jsx").then((mod) => ({
    default: mod.DashboardPage,
  }))
);

const LOCAL_REDIRECT_HOSTS = new Set(["127.0.0.1", "localhost"]);

function getSafeRedirect(searchParams) {
  const redirect = searchParams.get("redirect") || "";
  if (!redirect) return null;

  try {
    const redirectUrl = new URL(redirect);
    if (redirectUrl.protocol !== "http:") return null;
    if (!LOCAL_REDIRECT_HOSTS.has(redirectUrl.hostname)) return null;
    return redirectUrl.toString();
  } catch (_e) {
    return null;
  }
}

export default function App() {
  const baseUrl = useMemo(() => getInsforgeBaseUrl(), []);
  const {
    isLoaded: insforgeLoaded,
    isSignedIn: insforgeSignedIn,
    signOut: insforgeSignOut,
  } = useInsforgeAuth();
  const mockEnabled = isMockEnabled();
  const [latestVersion, setLatestVersion] = useState(null);
  const [insforgeSession, setInsforgeSession] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(() => loadSessionExpired());
  const lastProbeTokenRef = useRef(null);

  useEffect(() => {
    let active = true;
    fetchLatestTrackerVersion({ allowStale: true }).then((version) => {
      if (!active) return;
      setLatestVersion(version);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!insforgeLoaded) return;
    let active = true;
    const refreshSession = () => {
      return insforgeAuthClient.auth
        .getCurrentSession()
        .then(({ data }) => {
          if (!active) return;
          setInsforgeSession(data?.session ?? null);
        })
        .catch(() => {
          if (!active) return;
          setInsforgeSession(null);
        });
    };
    refreshSession();
    return () => {
      active = false;
    };
  }, [insforgeLoaded, insforgeSignedIn]);

  useEffect(() => {
    return subscribeSessionExpired((next) => {
      setSessionExpired(Boolean(next));
    });
  }, []);

  const getInsforgeAccessToken = useCallback(async () => {
    if (!insforgeSignedIn) return null;
    const { data } = await insforgeAuthClient.auth.getCurrentSession();
    return data?.session?.accessToken ?? null;
  }, [insforgeSignedIn]);

  useEffect(() => {
    if (!sessionExpired) {
      lastProbeTokenRef.current = null;
      return;
    }
    if (!insforgeSignedIn) {
      lastProbeTokenRef.current = null;
      return;
    }
    let active = true;
    (async () => {
      const token = await getInsforgeAccessToken();
      if (!active) return;
      if (!token || token === lastProbeTokenRef.current) return;
      lastProbeTokenRef.current = token;
      probeBackend({ baseUrl, accessToken: token }).catch(() => {});
    })();
    return () => {
      active = false;
    };
  }, [baseUrl, getInsforgeAccessToken, insforgeSignedIn, sessionExpired]);

  const insforgeAuth = useMemo(() => {
    if (!insforgeSession?.accessToken) return null;
    const user = insforgeSession.user;
    return {
      accessToken: insforgeSession.accessToken,
      getAccessToken: getInsforgeAccessToken,
      userId: user?.id ?? null,
      email: user?.email ?? null,
      name: user?.name ?? null,
      savedAt: new Date().toISOString(),
    };
  }, [getInsforgeAccessToken, insforgeSession]);

  const useInsforge = insforgeLoaded && insforgeSignedIn;
  const insforgeAuthFallback = useMemo(() => {
    const user = insforgeSession?.user;
    return {
      getAccessToken: getInsforgeAccessToken,
      userId: user?.id ?? null,
      email: user?.email ?? null,
      name: user?.name ?? null,
    };
  }, [getInsforgeAccessToken, insforgeSession]);
  const signedIn = useInsforge && !sessionExpired;
  const auth = useMemo(() => {
    if (!useInsforge || sessionExpired) return null;
    return insforgeAuth ?? insforgeAuthFallback;
  }, [insforgeAuth, insforgeAuthFallback, sessionExpired, useInsforge]);
  const signOut = useMemo(() => {
    return async () => {
      if (useInsforge) {
        await insforgeSignOut();
      }
      clearAuthStorage();
      clearSessionExpired();
    };
  }, [insforgeSignOut, useInsforge]);

  const pageUrl = new URL(window.location.href);
  const pathname = pageUrl.pathname.replace(/\/+$/, "");
  const shareMatch = pathname.match(/^\/share\/([^/]+)$/i);
  const publicToken = shareMatch ? shareMatch[1] : null;
  const publicMode = Boolean(publicToken);
  const safeRedirect = getSafeRedirect(pageUrl.searchParams);
  const baseUrlOverride =
    safeRedirect && pageUrl.searchParams.get("base_url")
      ? pageUrl.searchParams.get("base_url")
      : "";
  const authBaseUrl = baseUrlOverride || baseUrl;
  const hostedSignInUrl = "/sign-in";
  const hostedSignUpUrl = "/sign-up";
  const signInUrl = useMemo(() => {
    if (!safeRedirect) return hostedSignInUrl;
    return buildAuthUrl({
      baseUrl: authBaseUrl,
      path: "/auth/sign-in",
      redirectUrl: safeRedirect,
    });
  }, [authBaseUrl, hostedSignInUrl, safeRedirect]);
  const signUpUrl = useMemo(() => {
    if (!safeRedirect) return hostedSignUpUrl;
    return buildAuthUrl({
      baseUrl: authBaseUrl,
      path: "/auth/sign-up",
      redirectUrl: safeRedirect,
    });
  }, [authBaseUrl, hostedSignUpUrl, safeRedirect]);

  const loadingShell = <div className="min-h-screen bg-[#050505]" />;
  let content = null;
  if (!publicMode && !signedIn && !mockEnabled) {
    content = <LandingPage signInUrl={signInUrl} signUpUrl={signUpUrl} />;
  } else {
    content = (
      <Suspense fallback={loadingShell}>
        {!publicMode ? <UpgradeAlertModal requiredVersion={latestVersion} /> : null}
        <DashboardPage
          baseUrl={baseUrl}
          auth={auth}
          signedIn={signedIn}
          sessionExpired={sessionExpired}
          signOut={signOut}
          publicMode={publicMode}
          publicToken={publicToken}
          signInUrl={signInUrl}
          signUpUrl={signUpUrl}
        />
      </Suspense>
    );
  }

  return <ErrorBoundary>{content}</ErrorBoundary>;
}
