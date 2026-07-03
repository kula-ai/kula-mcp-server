import { afterEach, describe, expect, it, vi } from "vitest";
import http from "node:http";
import type { Server } from "node:http";

function request(
  port: number,
  headers: Record<string, string>,
  body: string
): Promise<number> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: "localhost", port, method: "POST", path: "/mcp", headers },
      (res) => {
        res.resume();
        res.on("end", () => resolve(res.statusCode ?? 0));
      }
    );
    req.on("error", reject);
    req.end(body);
  });
}

async function boot(port: number, env: Record<string, string>): Promise<Server> {
  vi.resetModules();
  vi.stubEnv("MCP_ALLOWED_HOSTS", `localhost:${port}`);
  vi.stubEnv("MCP_ALLOWED_ORIGINS", `http://localhost:${port}`);
  vi.stubEnv("PORT", String(port));
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  const { startHttpServer } = await import("../http.js");
  const server = startHttpServer();
  await new Promise((r) => setTimeout(r, 150));
  return server;
}

describe("HTTP connector limits", () => {
  let server: Server;

  afterEach(() => {
    server?.close();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("throws (fail-closed) when allowed hosts/origins are unset", async () => {
    vi.resetModules();
    vi.stubEnv("MCP_ALLOWED_HOSTS", undefined as unknown as string);
    vi.stubEnv("MCP_ALLOWED_ORIGINS", undefined as unknown as string);
    const { startHttpServer } = await import("../http.js");
    expect(() => startHttpServer()).toThrow(/fail-closed/);
  });

  it("sheds with 503 when the in-flight cap is reached", async () => {
    server = await boot(8210, { MCP_MAX_IN_FLIGHT: "0" });
    const status = await request(
      8210,
      { Host: "localhost:8210", "Content-Type": "application/json", Authorization: "Bearer x" },
      "{}"
    );
    expect(status).toBe(503);
  });

  it("returns 429 when the rate limit is exceeded", async () => {
    // core accepts the token so we reach the rate-limit stage.
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ id: 1, account: { id: 1 } }), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      )
    );
    server = await boot(8211, { MCP_RATELIMIT_PER_MIN: "1" });
    const headers = {
      Host: "localhost:8211",
      "Content-Type": "application/json",
      Authorization: "Bearer good",
    };
    await request(8211, headers, "{}"); // first allowed (fills the window)
    const status = await request(8211, headers, "{}"); // second over the limit
    expect(status).toBe(429);
  });
});
