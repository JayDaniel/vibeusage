import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl } from "./config";
import { createTimeoutFetch } from "./http-timeout";

// Storage key prefix for session data
const SUPABASE_STORAGE_KEY = "vibeusage.supabase.session.v1";
const SUPABASE_TOKEN_KEY = "supabase-auth-token";
const TOKEN_ENVELOPE_VERSION = 1;
const FALLBACK_TOKEN_TTL_MS = 6 * 60 * 60 * 1000;

type StoredTokenEnvelope = {
  v: number;
  token: string;
  expiresAt: number;
};

function decodeBase64Url(input: string): string | null {
  if (typeof input !== "string" || input.length === 0) return null;
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  try {
    if (typeof globalThis.atob === "function") {
      return globalThis.atob(padded);
    }
  } catch (_e) {
    // fall through
  }
  try {
    if (typeof Buffer !== "undefined") {
      return Buffer.from(padded, "base64").toString("utf8");
    }
  } catch (_e) {
    // fall through
  }
  return null;
}

function decodeJwtExpiryMs(token: string): number | null {
  if (typeof token !== "string" || token.length === 0) return null;
  const segments = token.split(".");
  if (segments.length < 2) return null;
  const payloadRaw = decodeBase64Url(segments[1]);
  if (!payloadRaw) return null;
  try {
    const payload = JSON.parse(payloadRaw);
    const exp = payload?.exp;
    if (typeof exp !== "number" || !Number.isFinite(exp) || exp <= 0) {
      return null;
    }
    return Math.floor(exp * 1000);
  } catch (_e) {
    return null;
  }
}

function wrapTokenForStorage(token: string): string {
  const now = Date.now();
  const expiresAt = decodeJwtExpiryMs(token) ?? now + FALLBACK_TOKEN_TTL_MS;
  const envelope: StoredTokenEnvelope = {
    v: TOKEN_ENVELOPE_VERSION,
    token,
    expiresAt,
  };
  return JSON.stringify(envelope);
}

function unwrapTokenFromStorage(raw: string | null): {
  token: string | null;
  shouldMigrate: boolean;
} {
  if (typeof raw !== "string" || raw.length === 0) {
    return { token: null, shouldMigrate: false };
  }
  try {
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      parsed.v === TOKEN_ENVELOPE_VERSION &&
      typeof parsed.token === "string" &&
      parsed.token.length > 0
    ) {
      return { token: parsed.token, shouldMigrate: false };
    }
  } catch (_e) {
    // fall through to legacy plain token format
  }
  return { token: raw, shouldMigrate: true };
}

function getNamespacedStorageKey(key: string): string {
  return `${SUPABASE_STORAGE_KEY}.${key}`;
}

function setStorageValue(storage: Storage | null, key: string, value: string): boolean {
  if (!storage) return false;
  try {
    storage.setItem(getNamespacedStorageKey(key), value);
    return true;
  } catch (_e) {
    return false;
  }
}

function removeStorageValue(storage: Storage | null, key: string): void {
  if (!storage) return;
  try {
    storage.removeItem(getNamespacedStorageKey(key));
  } catch (_e) {
    // ignore
  }
}

export function clearSupabasePersistentStorage() {
  if (typeof window === "undefined") return;
  const prefix = `${SUPABASE_STORAGE_KEY}.`;
  const clearFrom = (storage: Storage | null) => {
    if (!storage) return;
    try {
      const keys: string[] = [];
      for (let i = 0; i < storage.length; i += 1) {
        const key = storage.key(i);
        if (typeof key === "string" && key.startsWith(prefix)) {
          keys.push(key);
        }
      }
      for (const key of keys) {
        storage.removeItem(key);
      }
    } catch (_e) {
      // ignore
    }
  };

  let localStorage: Storage | null = null;
  let sessionStorage: Storage | null = null;
  try {
    localStorage = window.localStorage;
  } catch (_e) {
    localStorage = null;
  }
  try {
    sessionStorage = window.sessionStorage;
  } catch (_e) {
    sessionStorage = null;
  }

  clearFrom(localStorage);
  clearFrom(sessionStorage);
}

/**
 * Create a persistent storage adapter using localStorage with session backup.
 * This ensures session survives page reloads and mobile browser backgrounding.
 *
 * Mobile-specific considerations:
 * - iOS Safari private mode: localStorage may throw, use memory fallback
 * - iOS WebView: sessionStorage may be cleared on background, use localStorage
 * - Safari ITP: third-party cookies blocked, rely on first-party storage
 */
export function createPersistentStorage() {
  // Memory fallback for environments where storage is unavailable
  const memoryStore = new Map<string, string>();

  function getStorage(): Storage | null {
    if (typeof window === "undefined") return null;
    try {
      const storage = window.localStorage;
      // Test if storage is actually available (iOS private mode quirk)
      const testKey = "__vibeusage_storage_test__";
      storage.setItem(testKey, "1");
      storage.removeItem(testKey);
      return storage;
    } catch (_e) {
      return null;
    }
  }

  function getSessionStorage(): Storage | null {
    if (typeof window === "undefined") return null;
    try {
      return window.sessionStorage;
    } catch (_e) {
      return null;
    }
  }

  return {
    getItem(key: string): string | null {
      const localStorage = getStorage();
      const sessionStorage = getSessionStorage();
      const localKey = getNamespacedStorageKey(key);
      const sessionKey = getNamespacedStorageKey(key);
      const tokenKey = key === SUPABASE_TOKEN_KEY;

      const migrateTokenIfNeeded = (token: string) => {
        if (!tokenKey) return;
        const wrapped = wrapTokenForStorage(token);
        setStorageValue(localStorage, key, wrapped);
        setStorageValue(sessionStorage, key, wrapped);
        memoryStore.set(key, wrapped);
      };

      const readStoredValue = (storage: Storage | null, rawKey: string): string | null => {
        if (!storage) return null;
        try {
          return storage.getItem(rawKey);
        } catch (_e) {
          return null;
        }
      };

      const fromLocal = readStoredValue(localStorage, localKey);
      if (fromLocal !== null) {
        memoryStore.set(key, fromLocal);
        if (!tokenKey) return fromLocal;
        const parsed = unwrapTokenFromStorage(fromLocal);
        if (!parsed.token) return null;
        if (parsed.shouldMigrate) migrateTokenIfNeeded(parsed.token);
        return parsed.token;
      }

      const fromSession = readStoredValue(sessionStorage, sessionKey);
      if (fromSession !== null) {
        memoryStore.set(key, fromSession);
        if (!tokenKey) {
          setStorageValue(localStorage, key, fromSession);
          return fromSession;
        }
        const parsed = unwrapTokenFromStorage(fromSession);
        if (!parsed.token) return null;
        if (parsed.shouldMigrate) {
          migrateTokenIfNeeded(parsed.token);
        } else {
          setStorageValue(localStorage, key, fromSession);
        }
        return parsed.token;
      }

      const fromMemory = memoryStore.get(key);
      if (fromMemory === undefined) return null;
      if (!tokenKey) return fromMemory;
      const parsed = unwrapTokenFromStorage(fromMemory);
      if (!parsed.token) return null;
      if (parsed.shouldMigrate) migrateTokenIfNeeded(parsed.token);
      return parsed.token;
    },

    setItem(key: string, value: string): void {
      const persistedValue = key === SUPABASE_TOKEN_KEY ? wrapTokenForStorage(value) : value;

      // Always update memory
      memoryStore.set(key, persistedValue);

      // Try to persist to localStorage
      const storage = getStorage();
      if (storage) {
        const ok = setStorageValue(storage, key, persistedValue);
        if (!ok && process.env.NODE_ENV === "development") {
          // Storage quota exceeded or private mode - keep in memory only
          // eslint-disable-next-line no-console
          console.warn("[Auth] Failed to persist session to storage");
        }
      }

      // Also try sessionStorage as secondary backup (for mobile context switching)
      const sessionStorage = getSessionStorage();
      if (sessionStorage) {
        setStorageValue(sessionStorage, key, persistedValue);
      }
    },

    removeItem(key: string): void {
      memoryStore.delete(key);

      const storage = getStorage();
      removeStorageValue(storage, key);

      const sessionStorage = getSessionStorage();
      removeStorageValue(sessionStorage, key);
    },
  };
}

type HttpClient = {
  get: (path: string, options?: Record<string, any>) => Promise<any>;
  post: (path: string, body?: any, options?: Record<string, any>) => Promise<any>;
};

type SupabaseClientWithHttp = SupabaseClient & {
  getHttpClient: () => HttpClient;
};

/// 创建用于数据查询的 Supabase 客户端（携带用户 accessToken）
/// 返回值同时包含 SupabaseClient 接口和 getHttpClient() 桥接方法，
/// 后者提供 {get(), post()} 兼容接口，供 vibeusage-api.ts 调用 Edge Functions
export function createSupabaseClient({
  baseUrl,
  accessToken,
}: {
  baseUrl?: string;
  accessToken?: string;
} = {}): SupabaseClientWithHttp {
  if (!baseUrl) throw new Error("Missing baseUrl");
  const anonKey = getSupabaseAnonKey();
  const timeoutFetch = createTimeoutFetch(globalThis.fetch) as unknown as typeof fetch;
  const globalHeaders: Record<string, string> = {};
  if (accessToken) {
    globalHeaders["Authorization"] = `Bearer ${accessToken}`;
  }
  const supabaseClient = createClient(baseUrl, anonKey || "", {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: globalHeaders,
      fetch: timeoutFetch,
    },
  });

  const httpClient: HttpClient = {
    async get(path: string, options: Record<string, any> = {}) {
      const url = new URL(path.startsWith("/") ? path : `/${path}`, baseUrl);
      if (options.params) {
        for (const [key, value] of Object.entries(options.params)) {
          if (value != null) url.searchParams.set(key, String(value));
        }
      }
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...globalHeaders,
      };
      if (anonKey) headers["apikey"] = anonKey;
      const res = await timeoutFetch(url.toString(), {
        method: "GET",
        headers,
        signal: options.signal,
        cache: options.cache,
      });
      if (!res.ok) {
        const errorBody = await res.text().catch(() => "");
        const err: any = new Error(errorBody || `HTTP ${res.status}`);
        err.statusCode = res.status;
        err.status = res.status;
        throw err;
      }
      return res.json();
    },
    async post(path: string, body?: any, options: Record<string, any> = {}) {
      const url = new URL(path.startsWith("/") ? path : `/${path}`, baseUrl);
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...globalHeaders,
      };
      if (anonKey) headers["apikey"] = anonKey;
      const res = await timeoutFetch(url.toString(), {
        method: "POST",
        headers,
        body: body != null ? JSON.stringify(body) : undefined,
        signal: options.signal,
        cache: options.cache,
      });
      if (!res.ok) {
        const errorBody = await res.text().catch(() => "");
        const err: any = new Error(errorBody || `HTTP ${res.status}`);
        err.statusCode = res.status;
        err.status = res.status;
        throw err;
      }
      return res.json();
    },
  };

  const extended = supabaseClient as SupabaseClientWithHttp;
  extended.getHttpClient = () => httpClient;
  return extended;
}

/// 创建用于认证流程的 Supabase 客户端（含 session 持久化）
export function createSupabaseAuthClient(): SupabaseClient {
  const baseUrl = getSupabaseUrl();
  if (!baseUrl) throw new Error("Missing baseUrl");
  const anonKey = getSupabaseAnonKey();
  return createClient(baseUrl, anonKey || "", {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: createPersistentStorage(),
    },
  });
}
