import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import http from "node:http";
import type { Server } from "node:http";

// Force the tool server to throw so the POST /mcp catch (500) path is exercised.
vi.mock("../server.js", () => ({
  READ_ONLY_TOOLS: new Set<string>(),
  buildServer: () => {
    throw new Error("boom");
  },
}));

const PORT = 8212;
const HOST = `localhost:${PORT}`;

function post(headers: Record<string, string>, body: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: "localhost", port: PORT, method: "POST", path: "/mcp", headers },
      (res) => {
        res.resume();
        res.on("end", () => resolve(res.statusCode ?? 0));
      }
    );
    req.on("error", reject);
    req.end(body);
  });
}

describe("POST /mcp error handling", () => {
  let server: Server;

  beforeAll(async () => {
    vi.stubEnv("MCP_ALLOWED_HOSTS", HOST);
    vi.stubEnv("MCP_ALLOWED_ORIGINS", `http://${HOST}`);
    vi.stubEnv("PORT", String(PORT));
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ id: 1, account: { id: 1 } }), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      )
    );
    const { startHttpServer } = await import("../http.js");
    server = startHttpServer();
    await new Promise((r) => setTimeout(r, 150));
  });

  afterAll(() => {
    server.close();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("returns a JSON-RPC 500 when building the server throws", async () => {
    const status = await post(
      {
        Host: HOST,
        "Content-Type": "application/json",
        Authorization: "Bearer good",
      },
      JSON.stringify({ jsonrpc: "2.0", method: "tools/list", id: 1 })
    );
    expect(status).toBe(500);
  });
});
