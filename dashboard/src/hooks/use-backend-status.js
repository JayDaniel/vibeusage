import { useCallback, useEffect, useRef, useState } from "react";

import { getBackendProbeUrl } from "../lib/vibescore-api.js";

export function useBackendStatus({
  baseUrl,
  accessToken,
  intervalMs = 60_000,
  timeoutMs = 1500,
} = {}) {
  const [status, setStatus] = useState("unknown"); // unknown | active | error | down
  const [checking, setChecking] = useState(false);
  const [httpStatus, setHttpStatus] = useState(null);
  const [lastCheckedAt, setLastCheckedAt] = useState(null);
  const [lastOkAt, setLastOkAt] = useState(null);
  const [error, setError] = useState(null);

  const inFlightRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!baseUrl) {
      setStatus("error");
      setChecking(false);
      setHttpStatus(null);
      setLastCheckedAt(new Date().toISOString());
      setError("Missing baseUrl");
      return;
    }

    let url;
    try {
      url = getBackendProbeUrl(baseUrl);
    } catch (_e) {
      setStatus("error");
      setChecking(false);
      setHttpStatus(null);
      setLastCheckedAt(new Date().toISOString());
      setError("Invalid baseUrl");
      return;
    }

    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setChecking(true);
    setError(null);

    const controller = new AbortController();
    const t = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url.toString(), {
        method: "GET",
        cache: "no-store",
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        signal: controller.signal,
      });

      setHttpStatus(res.status);
      setLastCheckedAt(new Date().toISOString());

      if (res.status === 401 || res.status === 403) {
        setStatus("error");
        setError("Unauthorized");
      } else if (res.status === 404 || res.status >= 500) {
        setStatus("error");
        setError(`HTTP ${res.status}`);
      } else {
        setStatus("active");
        setError(null);
        setLastOkAt(new Date().toISOString());
      }
    } catch (e) {
      setHttpStatus(null);
      setLastCheckedAt(new Date().toISOString());
      setStatus("down");
      setError(e?.name === "AbortError" ? "Timeout" : e?.message || "Fetch failed");
    } finally {
      window.clearTimeout(t);
      inFlightRef.current = false;
      setChecking(false);
    }
  }, [baseUrl, timeoutMs]);

  useEffect(() => {
    let id = null;

    const stop = () => {
      if (id) window.clearInterval(id);
      id = null;
    };

    const start = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      if (id) return;
      refresh();
      id = window.setInterval(() => refresh(), intervalMs);
    };

    const onVisibility = () => {
      if (typeof document !== "undefined" && document.hidden) stop();
      else start();
    };

    start();
    document?.addEventListener?.("visibilitychange", onVisibility);
    return () => {
      stop();
      document?.removeEventListener?.("visibilitychange", onVisibility);
    };
  }, [intervalMs, refresh]);

  return {
    status,
    checking,
    httpStatus,
    lastCheckedAt,
    lastOkAt,
    error,
    refresh,
  };
}
