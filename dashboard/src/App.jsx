import React, { Suspense, useEffect, useMemo, useState } from "react";

import { useAuth } from "./hooks/use-auth.js";
import { getSupabaseUrl } from "./lib/config.js";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import { isMockEnabled } from "./lib/mock-data.js";
import { fetchLatestTrackerVersion } from "./lib/npm-version.js";
import { SignInPage } from "./pages/SignInPage.jsx";

import { UpgradeAlertModal } from "./ui/matrix-a/components/UpgradeAlertModal.jsx";

const DashboardPage = React.lazy(() =>
  import("./pages/DashboardPage.jsx").then((mod) => ({
    default: mod.DashboardPage,
  }))
);

export default function App() {
  const baseUrl = useMemo(() => getSupabaseUrl(), []);
  const { auth, signedIn, sessionExpired, signOut } = useAuth();
  const mockEnabled = isMockEnabled();
  const [latestVersion, setLatestVersion] = useState(null);
  const [cliRedirect, setCliRedirect] = useState(null);

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

  // Detect CLI redirect parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect");
    if (redirect && redirect.startsWith("http://127.0.0.1")) {
      setCliRedirect(redirect);
    }
  }, []);

  const pageUrl = new URL(window.location.href);
  const pathname = pageUrl.pathname.replace(/\/+$/, "");
  const redirectUrl = `${window.location.origin}/auth/callback`;

  // Route detection
  const isSignInPage = pathname === "/sign-in" || pathname === "/auth/sign-in" || cliRedirect;
  const isSignUpPage = pathname === "/sign-up" || pathname === "/auth/sign-up";
  const isCallbackPage = pathname === "/auth/callback";

  // Share page detection
  const shareMatch = pathname.match(/^\/share\/([^/]+)$/i);
  const publicToken = shareMatch ? shareMatch[1] : null;
  const publicMode = Boolean(publicToken);

  const signInUrl = "/sign-in";
  const signUpUrl = "/sign-up";

  const loadingShell = <div className="min-h-screen bg-[#050505]" />;

  // If callback page, show loading (useAuth will handle redirect)
  if (isCallbackPage) return loadingShell;

  // If explicit sign-in/sign-up page requested
  if (isSignInPage || isSignUpPage) {
    return (
      <ErrorBoundary>
        <SignInPage redirectUrl={redirectUrl} />
      </ErrorBoundary>
    );
  }

  let content = null;

  // Show sign-in page when not logged in or session expired (unless mock mode)
  if ((!signedIn || sessionExpired) && !mockEnabled && !publicMode) {
    content = <SignInPage redirectUrl={redirectUrl} />;
  } else {
    // Logged in or mock mode, show Dashboard
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
