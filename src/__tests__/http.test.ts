import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import http from "node:http";
import net from "node:net";
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

  it("rejects a request with no Host header (403)", async () => {
    const status = await new Promise<number>((resolve, reject) => {
      const sock = net.connect(PORT, "localhost", () => {
        // HTTP/1.0 lets us omit Host entirely (undefined host header).
        sock.write(
          "POST /mcp HTTP/1.0\r\nContent-Type: application/json\r\nContent-Length: 2\r\n\r\n{}"
        );
      });
      let data = "";
      sock.on("data", (d) => (data += d.toString()));
      sock.on("end", () => {
        const m = data.match(/HTTP\/1\.[01] (\d+)/);
        resolve(m ? Number(m[1]) : 0);
      });
      sock.on("error", reject);
    });
    expect(status).toBe(403);
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

  it("returns 405 for DELETE /mcp", async () => {
    expect((await request("DELETE", "/mcp")).status).toBe(405);
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

  it("returns 502 when core answers with a server error during validation", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 500 })));
    const res = await request(
      "POST",
      "/mcp",
      { Host: HOST, "Content-Type": "application/json", Authorization: "Bearer srv-err" },
      "{}"
    );
    expect(res.status).toBe(502);
    vi.unstubAllGlobals();
  });

  it("falls back to a shared rate-limit key when /v1/me omits identity", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string | URL) =>
        String(url).endsWith("/v1/me")
          ? new Response("{}", { status: 200, headers: { "content-type": "application/json" } })
          : new Response("{}", { status: 200 })
      )
    );
    const res = await request(
      "POST",
      "/mcp",
      {
        Host: HOST,
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        Authorization: "Bearer no-identity",
      },
      JSON.stringify({ jsonrpc: "2.0", method: "tools/list", id: 1 })
    );
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(502);
    vi.unstubAllGlobals();
  });

  it("negative-caches a rejected token so the second request skips /v1/me", async () => {
    const f = vi.fn(async () => new Response(null, { status: 401 }));
    vi.stubGlobal("fetch", f);
    const opts = {
      Host: HOST,
      "Content-Type": "application/json",
      Authorization: "Bearer repeat-bad",
    };
    expect((await request("POST", "/mcp", opts, "{}")).status).toBe(401);
    expect((await request("POST", "/mcp", opts, "{}")).status).toBe(401);
    expect(f).toHaveBeenCalledTimes(1); // second served from the negative cache
    vi.unstubAllGlobals();
  });
});

describe("redact", () => {
  it("scrubs bearer values and bare JWTs, passes plain text", async () => {
    const { redact } = await import("../http.js");
    expect(redact(new Error("Authorization: Bearer abc.def/ghi+jkl="))).not.toContain(
      "abc.def"
    );
    expect(
      redact(new Error("token eyJhbGciOiJFZERTQSJ9.payloadpart123.signature"))
    ).toContain("[redacted-jwt]");
    expect(redact("a plain non-error string")).toBe("a plain non-error string");
  });
});

describe("drainAndExit", () => {
  it("closes the server, drops idle connections, and exits 0", async () => {
    const { drainAndExit } = await import("../http.js");
    const exit = vi.fn();
    const closeIdleConnections = vi.fn();
    const fakeServer = {
      close: (cb: () => void) => cb(),
      closeIdleConnections,
    } as unknown as import("node:http").Server;

    drainAndExit(fakeServer, "SIGTERM", exit);

    expect(closeIdleConnections).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledWith(0);
  });

  it("force-exits when draining exceeds the timeout", async () => {
    vi.useFakeTimers();
    const { drainAndExit } = await import("../http.js");
    const exit = vi.fn();
    const fakeServer = {
      close: () => {}, // never invokes the callback → drain hangs
      closeIdleConnections: () => {},
    } as unknown as import("node:http").Server;

    drainAndExit(fakeServer, "SIGTERM", exit);
    vi.advanceTimersByTime(115_000);

    expect(exit).toHaveBeenCalledWith(0);
    vi.useRealTimers();
  });
});
