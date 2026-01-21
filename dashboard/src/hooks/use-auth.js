import { useCallback, useEffect, useState } from "react";

import {
  clearAuthStorage,
  clearSessionExpired,
  loadAuthFromStorage,
  loadSessionExpired,
  saveAuthToStorage,
  subscribeAuthStorage,
} from "../lib/auth-storage.js";
import { getSupabase } from "../lib/supabase-client.js";

export function useAuth() {
  const [auth, setAuth] = useState(() => loadAuthFromStorage());
  const [sessionExpired, setSessionExpired] = useState(() =>
    loadSessionExpired()
  );

  useEffect(() => {
    const unsubscribe = subscribeAuthStorage(
      ({ auth: nextAuth, sessionExpired: nextExpired }) => {
        setAuth(nextAuth);
        setSessionExpired(nextExpired);
      }
    );
    return unsubscribe;
  }, []);

  // Sync with Supabase session on mount and auth state changes
  useEffect(() => {
    const sb = getSupabase();
    if (sb._isPlaceholder) {
      console.log("[useAuth] Supabase client is placeholder, skipping sync");
      return;
    }

    // Check current session - always sync if Supabase has a valid session
    sb.auth.getSession().then(({ data: sessionData, error }) => {
      console.log("[useAuth] getSession result:", { session: sessionData?.session ? "exists" : "none", error });
      const session = sessionData?.session;
      if (session?.access_token && session?.user) {
        console.log("[useAuth] Valid session found, syncing auth...");
        const next = {
          accessToken: session.access_token,
          userId: session.user.id || null,
          email: session.user.email || null,
          name: session.user.user_metadata?.name || session.user.email || null,
          savedAt: new Date().toISOString(),
        };
        saveAuthToStorage(next);
        setAuth(next);
        // Clear expired state since we have a valid Supabase session
        clearSessionExpired();
        setSessionExpired(false);
        console.log("[useAuth] Auth synced successfully");
      } else {
        console.log("[useAuth] No valid session found");
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.access_token) {
        const next = {
          accessToken: session.access_token,
          userId: session.user?.id || null,
          email: session.user?.email || null,
          name: session.user?.user_metadata?.name || session.user?.email || null,
          savedAt: new Date().toISOString(),
        };
        saveAuthToStorage(next);
        setAuth(next);
        clearSessionExpired();
        setSessionExpired(false);
      } else if (event === "SIGNED_OUT") {
        clearAuthStorage();
        clearSessionExpired();
        setAuth(null);
        setSessionExpired(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const path = window.location.pathname.replace(/\/+$/, "");
    if (path !== "/auth/callback") return;

    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("access_token") || "";
    if (!accessToken) return;

    console.log("[useAuth] Callback detected, saving auth...");
    clearSessionExpired();
    const next = {
      accessToken,
      userId: params.get("user_id") || null,
      email: params.get("email") || null,
      name: params.get("name") || null,
      savedAt: new Date().toISOString(),
    };

    saveAuthToStorage(next);
    setAuth(next);
    setSessionExpired(false);

    // Use setTimeout to ensure state is updated before navigation
    setTimeout(() => {
      window.history.replaceState({}, "", "/");
      window.location.reload();
    }, 100);
  }, []);

  const signOut = useCallback(() => {
    const sb = getSupabase();
    if (!sb._isPlaceholder) {
      sb.auth.signOut();
    }
    clearAuthStorage();
    clearSessionExpired();
    setAuth(null);
    setSessionExpired(false);
  }, []);

  const getAccessToken = useCallback(async () => {
    const sb = getSupabase();
    if (sb._isPlaceholder) return auth?.accessToken || null;
    const { data } = await sb.auth.getSession();
    return data?.session?.access_token || auth?.accessToken || null;
  }, [auth]);

  const signedIn = Boolean(auth?.accessToken) && !sessionExpired;
  const effectiveAuth = signedIn ? { ...auth, getAccessToken } : null;

  return {
    auth: effectiveAuth,
    signedIn,
    sessionExpired,
    signOut,
  };
}
