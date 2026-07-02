import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

describe("checkRateLimit (local fallback, no Redis)", () => {
  let checkRateLimit: (a: string | number, s: string | number) => Promise<boolean>;

  beforeAll(async () => {
    vi.stubEnv("MCP_RATELIMIT_PER_MIN", "2");
    vi.stubEnv("REDIS_URL", "");
    ({ checkRateLimit } = await import("../ratelimit.js"));
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  it("allows up to the limit then denies within the window", async () => {
    expect(await checkRateLimit("acct", "u1")).toBe(true);
    expect(await checkRateLimit("acct", "u1")).toBe(true);
    expect(await checkRateLimit("acct", "u1")).toBe(false);
  });

  it("tracks (account, user) keys independently", async () => {
    expect(await checkRateLimit("acct", "u2")).toBe(true);
    expect(await checkRateLimit("acct", "u2")).toBe(true);
    expect(await checkRateLimit("acct", "u2")).toBe(false);
  });
});
