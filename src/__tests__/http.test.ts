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
});
