/**
 * Supabase-compatible API client for Dashboard
 *
 * Provides HTTP client that works with Supabase Edge Functions.
 * Path format: /functions/v1/<function-name>
 */

import { getInsforgeAnonKey, getInsforgeBaseUrl } from "./config.js";
import { createTimeoutFetch } from "./http-timeout.js";

/**
 * Create API client for Supabase Edge Functions
 */
export function createInsforgeClient({ baseUrl, accessToken } = {}) {
  const url = baseUrl || getInsforgeBaseUrl();
  const anonKey = getInsforgeAnonKey();
  const timeoutFetch = createTimeoutFetch(globalThis.fetch);

  if (!url) {
    throw new Error("Missing baseUrl - set VITE_SUPABASE_URL environment variable");
  }

  // Build authorization headers
  const getHeaders = () => {
    const headers = {
      'Content-Type': 'application/json',
    };
    // Always include apikey header for Supabase
    if (anonKey) {
      headers['apikey'] = anonKey;
    }
    // Use access token for Authorization if provided, otherwise use anon key
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    } else if (anonKey) {
      headers['Authorization'] = `Bearer ${anonKey}`;
    }
    return headers;
  };

  // HTTP client compatible with vibescore-api.js expectations
  const http = {
    async get(path, { params, ...options } = {}) {
      // Build URL with Supabase functions path format
      const functionUrl = new URL(`${url}${path}`);

      // Normalize path: /functions/xxx -> /functions/v1/xxx
      if (functionUrl.pathname.startsWith('/functions/') && !functionUrl.pathname.startsWith('/functions/v1/')) {
        functionUrl.pathname = functionUrl.pathname.replace('/functions/', '/functions/v1/');
      }

      // Add query params
      if (params) {
        for (const [key, value] of Object.entries(params)) {
          if (value != null && value !== '') {
            functionUrl.searchParams.set(key, String(value));
          }
        }
      }

      const response = await timeoutFetch(functionUrl.toString(), {
        method: 'GET',
        headers: getHeaders(),
        ...options
      });

      const text = await response.text();
      let data = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch (_e) {
        // Non-JSON response
      }

      if (!response.ok) {
        const error = new Error(data?.error || data?.message || text || `HTTP ${response.status}`);
        error.status = response.status;
        error.statusCode = response.status;
        throw error;
      }

      return data;
    },

    async post(path, body, options = {}) {
      // Build URL with Supabase functions path format
      const functionUrl = new URL(`${url}${path}`);

      // Normalize path: /functions/xxx -> /functions/v1/xxx
      if (functionUrl.pathname.startsWith('/functions/') && !functionUrl.pathname.startsWith('/functions/v1/')) {
        functionUrl.pathname = functionUrl.pathname.replace('/functions/', '/functions/v1/');
      }

      const response = await timeoutFetch(functionUrl.toString(), {
        method: 'POST',
        headers: getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
        ...options
      });

      const text = await response.text();
      let data = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch (_e) {
        // Non-JSON response
      }

      if (!response.ok) {
        const error = new Error(data?.error || data?.message || text || `HTTP ${response.status}`);
        error.status = response.status;
        error.statusCode = response.status;
        throw error;
      }

      return data;
    }
  };

  return {
    getHttpClient: () => http,
    baseUrl: url,
    anonKey
  };
}

/**
 * Create auth client (for backward compatibility)
 */
export function createInsforgeAuthClient() {
  const baseUrl = getInsforgeBaseUrl();
  const anonKey = getInsforgeAnonKey();
  return createInsforgeClient({ baseUrl, accessToken: anonKey });
}
