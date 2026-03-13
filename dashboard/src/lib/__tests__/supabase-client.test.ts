import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPersistentStorage, createPersistentStorage } from "../supabase-client";

const TOKEN_STORAGE_KEY = "vibeusage.supabase.session.v1.supabase-auth-token";

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    removeItem(key: string) {
      store.delete(key);
    },
  };
}

function buildJwt(expSeconds: number) {
  const header = { alg: "HS256", typ: "JWT" };
  const payload = { exp: expSeconds };
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString("base64url").replace(/=/g, "");
  return `${encode(header)}.${encode(payload)}.sig`;
}

describe("createPersistentStorage", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: createMemoryStorage(),
    });
    Object.defineProperty(window, "sessionStorage", {
      configurable: true,
      value: createMemoryStorage(),
    });
  });

  it("stores auth token as TTL envelope and returns raw token", () => {
    const storage = createPersistentStorage();
    const token = buildJwt(Math.floor(Date.now() / 1000) + 3600);

    storage.setItem("supabase-auth-token", token);

    const raw = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    expect(raw).toBeTruthy();

    const parsed = JSON.parse(String(raw));
    expect(parsed.token).toBe(token);
    expect(parsed.expiresAt).toBeGreaterThan(Date.now());

    expect(storage.getItem("supabase-auth-token")).toBe(token);
  });

  it("keeps token envelope readable even after token exp", () => {
    const storage = createPersistentStorage();
    const expiredToken = buildJwt(Math.floor(Date.now() / 1000) - 10);

    storage.setItem("supabase-auth-token", expiredToken);

    expect(storage.getItem("supabase-auth-token")).toBe(expiredToken);
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeTruthy();
  });

  it("restores token from sessionStorage and backfills localStorage", () => {
    const storage = createPersistentStorage();
    const token = buildJwt(Math.floor(Date.now() / 1000) + 600);
    const wrapped = JSON.stringify({
      v: 1,
      token,
      expiresAt: Date.now() + 600_000,
    });

    window.sessionStorage.setItem(TOKEN_STORAGE_KEY, wrapped);

    expect(storage.getItem("supabase-auth-token")).toBe(token);
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBe(wrapped);
  });
});

describe("createPersistentStorage", () => {
  it("forces storage mode and saves returned session", async () => {
    const session = { accessToken: "token-123", user: { id: "u1" } };
    const tokenManager = {
      setStorageMode: vi.fn(),
      saveSession: vi.fn(),
    };
    const auth = {
      getSession: vi.fn(async () => ({ data: { session }, error: null })),
    };
    const client = { auth, tokenManager };

    createPersistentStorage(client);
    await client.auth.getSession();

    expect(tokenManager.setStorageMode).toHaveBeenCalledTimes(1);
    expect(tokenManager.saveSession).toHaveBeenCalledWith(session);
  });

  it("installs only once", async () => {
    const session = { accessToken: "token-123", user: { id: "u1" } };
    const tokenManager = {
      setStorageMode: vi.fn(),
      saveSession: vi.fn(),
    };
    const originalGetCurrentSession = vi.fn(async () => ({
      data: { session },
      error: null,
    }));
    const auth = { getSession: originalGetCurrentSession };
    const client = { auth, tokenManager };

    createPersistentStorage(client);
    createPersistentStorage(client);

    await client.auth.getSession();

    expect(originalGetCurrentSession).toHaveBeenCalledTimes(1);
    expect(tokenManager.saveSession).toHaveBeenCalledTimes(1);
  });
});
