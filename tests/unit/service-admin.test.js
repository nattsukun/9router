import { afterEach, describe, expect, it, vi } from "vitest";
import { hasServiceAdminToken, serviceAdminRoute } from "../../src/lib/auth/serviceAdmin.js";

afterEach(() => vi.unstubAllEnvs());
describe("Enixera service credential", () => {
  const key = "a".repeat(64);
  const req = (value) => new Request("https://router.test/api/providers", { headers: { authorization: value } });
  it("requires a configured strong key and exact Bearer token", () => {
    vi.stubEnv("ENIXERA_ROUTER_ADMIN_KEY", "");
    expect(hasServiceAdminToken(req(`Bearer ${key}`))).toBe(false);
    vi.stubEnv("ENIXERA_ROUTER_ADMIN_KEY", key);
    expect(hasServiceAdminToken(req(`Bearer ${key}`))).toBe(true);
    expect(hasServiceAdminToken(req(`Bearer ${key}x`))).toBe(false);
    expect(hasServiceAdminToken(req(`Bearer ${"b".repeat(64)}`))).toBe(false);
  });
  it("does not grant inference, settings or host access", () => {
    for (const path of ["/v1/chat/completions", "/api/settings", "/api/shutdown", "/api/cli-tools/cowork-settings", "/api/providers-evil"]) {
      expect(serviceAdminRoute(path, "POST")).toBe("deny");
    }
    expect(serviceAdminRoute("/api/providers", "GET")).toBe("allow");
    expect(serviceAdminRoute("/api/combos/abc", "PUT")).toBe("allow");
  });
  it("fails closed for customer provisioning until budgets are implemented", () => {
    expect(serviceAdminRoute("/api/keys", "POST")).toBe("unsupported");
    expect(serviceAdminRoute("/api/keys/123", "PUT")).toBe("unsupported");
    expect(serviceAdminRoute("/api/usage/budget", "POST")).toBe("unsupported");
    expect(serviceAdminRoute("/api/keys", "GET")).toBe("allow");
  });
});
