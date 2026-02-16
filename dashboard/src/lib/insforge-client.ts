import { createClient } from "@insforge/sdk";

import { getInsforgeAnonKey, getInsforgeBaseUrl } from "./config";
import { createTimeoutFetch } from "./http-timeout";

// Storage key prefix for InsForge SDK session data
const INSFORGE_STORAGE_KEY = "vibeusage.insforge.session.v1";
const INSFORGE_TOKEN_KEY = "insforge-auth-token";
const TOKEN_ENVELOPE_VERSION = 1;
const FALLBACK_TOKEN_TTL_MS = 6 * 60 * 60 * 1000;

type StoredTokenEnvelope = {
  v: number;
  token: string;
  expiresAt: number;
};

type InsforgeSessionLike = {
  accessToken?: string | null;
  user?: unknown;
} | null;

type GetCurrentSessionResult = {
  data?: {
    session?: InsforgeSessionLike;
  };
};

type InsforgeTokenManagerLike = {
  setStorageMode?: () => void;
  saveSession?: (session: InsforgeSessionLike) => void;
  getSession?: () => InsforgeSessionLike;
};

type InsforgeAuthLike = {
  getCurrentSession?: (...args: unknown[]) => Promise<GetCurrentSessionResult>;
};

type InsforgeClientLike = {
  auth?: InsforgeAuthLike;
  tokenManager?: InsforgeTokenManagerLike;
};

function decodeBase64Url(input: string): string | null {
  if (typeof input !== "string" || input.length === 0) return null;
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "="
  );
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

function unwrapTokenFromStorage(
  raw: string | null
): { token: string | null; shouldMigrate: boolean } {
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
  return `${INSFORGE_STORAGE_KEY}.${key}`;
}

function setStorageValue(
  storage: Storage | null,
  key: string,
  value: string
): boolean {
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
      const tokenKey = key === INSFORGE_TOKEN_KEY;

      const migrateTokenIfNeeded = (token: string) => {
        if (!tokenKey) return;
        const wrapped = wrapTokenForStorage(token);
        setStorageValue(localStorage, key, wrapped);
        setStorageValue(sessionStorage, key, wrapped);
        memoryStore.set(key, wrapped);
      };

      const readStoredValue = (
        storage: Storage | null,
        rawKey: string
      ): string | null => {
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
      const persistedValue =
        key === INSFORGE_TOKEN_KEY ? wrapTokenForStorage(value) : value;

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

export function createInsforgeClient({
  baseUrl,
  accessToken,
}: {
  baseUrl?: string;
  accessToken?: string;
} = {}) {
  if (!baseUrl) throw new Error("Missing baseUrl");
  const anonKey = getInsforgeAnonKey();
  return createClient({
    baseUrl,
    anonKey: anonKey || undefined,
    edgeFunctionToken: accessToken || undefined,
    storage: createPersistentStorage(),
    fetch: createTimeoutFetch(globalThis.fetch),
  });
}

export function createInsforgeAuthClient() {
  const baseUrl = getInsforgeBaseUrl();
  if (!baseUrl) throw new Error("Missing baseUrl");
  const anonKey = getInsforgeAnonKey();
  const client = createClient({
    baseUrl,
    anonKey: anonKey || undefined,
    // Use persistent storage for auth client to survive page reloads
    // This is critical for mobile browsers where memory is frequently cleared
    storage: createPersistentStorage(),
  });
  forceStorageMode(client);
  installSessionPersistenceBridge(client);
  return client;
}

function persistSessionToStorage(
  client: InsforgeClientLike,
  session: InsforgeSessionLike
) {
  if (!session?.accessToken) return;
  const tokenManager = client?.tokenManager;
  if (!tokenManager || typeof tokenManager.saveSession !== "function") return;
  if (typeof tokenManager.setStorageMode === "function") {
    tokenManager.setStorageMode();
  }
  tokenManager.saveSession(session);
}

export function installSessionPersistenceBridge(client: InsforgeClientLike) {
  const auth = client?.auth;
  if (!auth || typeof auth.getCurrentSession !== "function") return;

  const marker = "__vibeusage_session_bridge_installed_v1__";
  const bridgeState = client as Record<string, unknown>;
  if (bridgeState[marker]) return;

  const originalGetCurrentSession = auth.getCurrentSession.bind(auth);
  auth.getCurrentSession = async (...args: unknown[]) => {
    const result = await originalGetCurrentSession(...args);
    persistSessionToStorage(client, result?.data?.session ?? null);
    return result;
  };

  bridgeState[marker] = true;
}

export function forceStorageMode(client: InsforgeClientLike) {
  try {
    const tokenManager = client?.tokenManager;
    if (!tokenManager || typeof tokenManager.setStorageMode !== "function") {
      return;
    }
    tokenManager.setStorageMode();
    if (typeof tokenManager.getSession === "function") {
      persistSessionToStorage(client, tokenManager.getSession());
    }
  } catch (_e) {
    // ignore SDK internals mismatch
  }
}
