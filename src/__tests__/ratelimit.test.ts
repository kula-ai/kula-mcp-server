import { afterEach, describe, expect, it, vi } from "vitest";

const { incr, pexpire, connect } = vi.hoisted(() => ({
  incr: vi.fn(),
  pexpire: vi.fn(),
  connect: vi.fn(),
}));

vi.mock("ioredis", () => ({
  Redis: class {
    connect = connect;
    incr = incr;
    pexpire = pexpire;
  },
}));

type CheckFn = (a: string | number, s: string | number) => Promise<boolean>;

async function load(env: Record<string, string>): Promise<CheckFn> {
  vi.resetModules();
  connect.mockResolvedValue(undefined);
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  return (await import("../ratelimit.js")).checkRateLimit;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("checkRateLimit — local fallback (no Redis)", () => {
  it("allows up to the limit then denies within the window", async () => {
    const check = await load({ REDIS_URL: "", MCP_RATELIMIT_PER_MIN: "2" });
    expect(await check("acct", "u1")).toBe(true);
    expect(await check("acct", "u1")).toBe(true);
    expect(await check("acct", "u1")).toBe(false);
  });

  it("tracks (account, user) keys independently", async () => {
    const check = await load({ REDIS_URL: "", MCP_RATELIMIT_PER_MIN: "2" });
    expect(await check("acct", "u2")).toBe(true);
    expect(await check("acct", "u1")).toBe(true);
    expect(await check("acct", "u2")).toBe(true);
    expect(await check("acct", "u2")).toBe(false);
  });
});

describe("checkRateLimit — Redis path", () => {
  it("uses Redis INCR and sets expiry on the first hit", async () => {
    const check = await load({ REDIS_URL: "redis://x", MCP_RATELIMIT_PER_MIN: "2" });
    incr.mockResolvedValueOnce(1).mockResolvedValueOnce(2).mockResolvedValueOnce(3);

    expect(await check("a", "u")).toBe(true);
    expect(await check("a", "u")).toBe(true);
    expect(await check("a", "u")).toBe(false);
    expect(pexpire).toHaveBeenCalledTimes(1); // only when count === 1
  });

  it("fails open to the local bucket when Redis errors", async () => {
    const check = await load({ REDIS_URL: "redis://x", MCP_RATELIMIT_PER_MIN: "1" });
    incr.mockRejectedValue(new Error("timeout"));

    expect(await check("a", "u")).toBe(true); // local allow
    expect(await check("a", "u")).toBe(false); // local deny (limit 1)
  });

  it("fails closed when the kill-switch is set", async () => {
    const check = await load({
      REDIS_URL: "redis://x",
      MCP_RATELIMIT_FAIL_CLOSED: "true",
    });
    incr.mockRejectedValue(new Error("partition"));

    expect(await check("a", "u")).toBe(false);
  });

  it("swallows a Redis connect error at startup (fail-open handles it later)", async () => {
    vi.resetModules();
    vi.stubEnv("REDIS_URL", "redis://x");
    connect.mockRejectedValue(new Error("down"));

    // Importing constructs the client and calls connect().catch() — must not throw.
    await expect(import("../ratelimit.js")).resolves.toBeDefined();
  });
});
