import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import http from "node:http";
import type { Server } from "node:http";

const PORT = 8199;
const HOST = `localhost:${PORT}`;

vi.stubEnv("MCP_ALLOWED_HOSTS", HOST);
vi.stubEnv("MCP_ALLOWED_ORIGINS", `http://${HOST}`);
vi.stubEnv("PORT", String(PORT));

interface Res {
  status: number;
}

// Raw node:http so Host/Origin headers can be set freely (undici fetch forbids Host).
function request(
  method: string,
  path: string,
  headers: Record<string, string> = {},
  body?: string
): Promise<Res> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: "localhost", port: PORT, method, path, headers },
      (res) => {
        res.resume();
        res.on("end", () => resolve({ status: res.statusCode ?? 0 }));
      }
    );
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

describe("HTTP connector guards", () => {
  let server: Server;

  beforeAll(async () => {
    const { startHttpServer } = await import("../http.js");
    server = startHttpServer();
    await new Promise((r) => setTimeout(r, 200));
  });

  afterAll(() => {
    server.close();
  });

  it("serves /healthz", async () => {
    expect((await request("GET", "/healthz")).status).toBe(200);
  });

  it("rejects POST /mcp with no token (401)", async () => {
    const res = await request(
      "POST",
      "/mcp",
      { Host: HOST, "Content-Type": "application/json" },
      "{}"
    );
    expect(res.status).toBe(401);
  });

  it("rejects a mismatched Host (403)", async () => {
    const res = await request(
      "POST",
      "/mcp",
      { Host: "evil.com", "Content-Type": "application/json", Authorization: "Bearer x" },
      "{}"
    );
    expect(res.status).toBe(403);
  });

  it("allows an absent Origin but rejects a mismatched one (403)", async () => {
    const res = await request(
      "POST",
      "/mcp",
      {
        Host: HOST,
        Origin: "http://evil.com",
        "Content-Type": "application/json",
        Authorization: "Bearer x",
      },
      "{}"
    );
    expect(res.status).toBe(403);
  });

  it("returns 405 for GET /mcp", async () => {
    expect((await request("GET", "/mcp")).status).toBe(405);
  });

  it("returns 401 when core rejects the token (/v1/me 401)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 401 }))
    );
    const res = await request(
      "POST",
      "/mcp",
      { Host: HOST, "Content-Type": "application/json", Authorization: "Bearer bad" },
      "{}"
    );
    expect(res.status).toBe(401);
    vi.unstubAllGlobals();
  });

  it("returns 502 when core is unreachable during validation", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("ECONNREFUSED");
      })
    );
    const res = await request(
      "POST",
      "/mcp",
      { Host: HOST, "Content-Type": "application/json", Authorization: "Bearer any" },
      "{}"
    );
    expect(res.status).toBe(502);
    vi.unstubAllGlobals();
  });

  it("passes the guard when core accepts the token (/v1/me 200)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string | URL) => {
        if (String(url).endsWith("/v1/me")) {
          return new Response(JSON.stringify({ id: 1 }), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        }
        return new Response("{}", { status: 200 });
      })
    );
    const res = await request(
      "POST",
      "/mcp",
      {
        Host: HOST,
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        Authorization: "Bearer good",
      },
      JSON.stringify({ jsonrpc: "2.0", method: "tools/list", id: 1 })
    );
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(502);
    vi.unstubAllGlobals();
  });
});
