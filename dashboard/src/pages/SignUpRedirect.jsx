import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  storePostAuthPathFromSearch,
  storeRedirectFromSearch,
  stripNextParam,
  stripRedirectParam,
} from "../lib/auth-redirect";
import {
  clearAuthStorage,
  clearSessionExpired,
  clearSessionSoftExpired,
} from "../lib/auth-storage";
import { supabaseAuthClient } from "../lib/supabase-auth-client";
import { clearSupabasePersistentStorage } from "../lib/supabase-client";

function buildCallbackUrl() {
  if (typeof window === "undefined") return "/auth/callback";
  return `${window.location.origin}/auth/callback`;
}

export function SignUpRedirect() {
  const callbackUrl = useMemo(() => buildCallbackUrl(), []);
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const { saved } = storeRedirectFromSearch(window.location.search);
    const { saved: nextSaved } = storePostAuthPathFromSearch(window.location.search);
    if (!saved && !nextSaved) return;

    let nextUrl = window.location.href;
    const strippedRedirect = stripRedirectParam(nextUrl);
    if (strippedRedirect) nextUrl = strippedRedirect;
    const strippedNext = stripNextParam(nextUrl);
    if (strippedNext) nextUrl = strippedNext;
    if (!nextUrl || nextUrl === window.location.href) return;
    window.history.replaceState(null, "", nextUrl);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let active = true;

    const run = async () => {
      try {
        // Force a clean auth state so stale mobile sessions cannot short-circuit
        // OAuth and bounce back to a useless dashboard.
        await supabaseAuthClient.auth.signOut().catch(() => {});
        clearSupabasePersistentStorage();
        clearAuthStorage();
        clearSessionExpired();
        clearSessionSoftExpired();

        // Supabase OAuth sign-in also provisions new users when needed.
        const { error } = await supabaseAuthClient.auth.signInWithOAuth({
          provider: "github",
          redirectTo: callbackUrl,
        });
        if (error) {
          // eslint-disable-next-line no-console
          console.error("OAuth init failed:", error);
          navigate("/", { replace: true });
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Sign-up redirect failed:", error);
        navigate("/", { replace: true });
      }
    };

    run();
    return () => {
      active = false;
    };
  }, [callbackUrl, navigate]);

  return <div className="min-h-screen bg-matrix-dark" />;
}
