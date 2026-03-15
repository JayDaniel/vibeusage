import { afterEach, describe, expect, it, vi } from "vitest";
import { copy } from "../copy";

describe("copy", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns an empty string when the registry entry is intentionally blank", () => {
    expect(copy("dashboard.identity.subtitle")).toBe("");
  });

  it("still falls back to the key when the registry entry is missing", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(copy("missing.copy.key")).toBe("missing.copy.key");
  });
});
