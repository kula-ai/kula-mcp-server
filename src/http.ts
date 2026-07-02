import type { Server } from "node:http";
import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { KulaClient } from "./client.js";
import { buildServer } from "./server.js";
import { checkRateLimit } from "./ratelimit.js";

// Whole-request deadline. Bounded well under the MCP client's 60s default request
// timeout and the container's SIGKILL grace, so a request never outlives a deploy.
const REQUEST_DEADLINE_MS = 50_000;

const DEFAULT_API_BASE = "https://api.kula.ai";
const WWW_AUTHENTICATE =
  'Bearer resource_metadata="https://mcp.kula.ai/.well-known/oauth-protected-resource/mcp"';

const ALLOWED_HOSTS = (process.env.MCP_ALLOWED_HOSTS ?? "")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);
const ALLOWED_ORIGINS = (process.env.MCP_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

function redact(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  // Strip anything after "Bearer " so tokens never reach logs.
  return msg.replace(/Bearer\s+[\w.-]+/gi, "Bearer [redacted]");
}

// Reject a mismatched Host always. Reject Origin only when PRESENT and not allowed:
// non-browser MCP clients (Claude Code, Cursor) send no Origin, and DNS-rebinding is
// browser-only, so an absent Origin is safe and must be allowed.
function originHostGuard(req: Request, res: Response, next: NextFunction): void {
  const host = (req.headers.host ?? "").trim();
  if (!ALLOWED_HOSTS.includes(host)) {
    res.status(403).json({ error: "forbidden_host" });
    return;
  }
  const origin = req.headers.origin;
  if (origin !== undefined && !ALLOWED_ORIGINS.includes(origin)) {
    res.status(403).json({ error: "forbidden_origin" });
    return;
  }
  next();
}

// Deliberately shallow liveness: a response served on the event loop proves the
// process is up and not blocked. We do NOT probe core here on purpose — a deep
// "can I reach core?" check makes a brief core blip fail every task at once and
// take the whole fleet out of rotation (cascading outage). Core reachability is
// surfaced per-request (the /v1/me validation returns 502 when core is down).
function healthOk(): boolean {
  return true;
}

export function startHttpServer(): Server {
  if (!ALLOWED_HOSTS.length || !ALLOWED_ORIGINS.length) {
    throw new Error(
      "MCP_ALLOWED_HOSTS and MCP_ALLOWED_ORIGINS must be set (fail-closed)"
    );
  }
  const apiBase = process.env.KULA_API_URL ?? DEFAULT_API_BASE;
  const port = Number(process.env.PORT ?? 8080);

  const app = express();
  app.use(
    cors({
      origin: ALLOWED_ORIGINS,
      allowedHeaders: ["Content-Type", "Authorization", "MCP-Protocol-Version"],
      exposedHeaders: ["WWW-Authenticate"],
    })
  );

  app.get("/healthz", (_req, res) => {
    const ok = healthOk();
    res.status(ok ? 200 : 503).json({ status: ok ? "ok" : "stale" });
  });

  app.post("/mcp", express.json(), originHostGuard, async (req, res) => {
    const deadline = AbortSignal.timeout(REQUEST_DEADLINE_MS);
    // Outer socket timeout: handleRequest/serialization receive no signal, so a
    // post-core hang needs the socket destroyed independently of the AbortSignal.
    res.setTimeout(REQUEST_DEADLINE_MS, () => res.destroy());

    let transport: StreamableHTTPServerTransport | undefined;
    let closed = false;
    const teardown = (): void => {
      if (closed) return;
      closed = true;
      void transport?.close();
    };
    res.on("close", teardown);

    try {
      const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
      if (!token) {
        res
          .status(401)
          .set("WWW-Authenticate", WWW_AUTHENTICATE)
          .json({ error: "unauthorized" });
        return;
      }

      // Validate the token before exposing any tools. /v1/me is the lightweight
      // identity probe — core checks signature, revocation and scope. Without this,
      // tools/list (which makes no core call) would succeed for an invalid token.
      let meRes: globalThis.Response;
      try {
        meRes = await fetch(new URL("/v1/me", apiBase), {
          headers: { Authorization: `Bearer ${token}` },
          signal: deadline,
        });
      } catch (err) {
        console.error("mcp_validate_error", redact(err));
        res.status(502).json({ error: "upstream_unavailable" });
        return;
      }
      if (meRes.status === 401 || meRes.status === 403) {
        res
          .status(401)
          .set("WWW-Authenticate", WWW_AUTHENTICATE)
          .json({ error: "unauthorized" });
        return;
      }
      if (!meRes.ok) {
        res.status(502).json({ error: "upstream_error" });
        return;
      }

      // Rate-limit per (account, user), read from the /me identity we just fetched.
      let me: { id?: number | string; account?: { id?: number | string } } = {};
      try {
        me = (await meRes.json()) as typeof me;
      } catch {
        // identity is only used for the rate-limit key; fall back to a shared bucket
      }
      if (!(await checkRateLimit(me.account?.id ?? "unknown", me.id ?? "unknown"))) {
        res.status(429).set("Retry-After", "30").json({ error: "rate_limited" });
        return;
      }

      // Phase 1: the caller's own mcp-scoped Kula token is used directly against
      // core for every tool call. core re-validates it and 401s if it goes bad.
      const client = new KulaClient(token, apiBase, deadline);
      const server = buildServer(client);
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      console.error("mcp_post_error", redact(err));
      teardown();
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "internal_error" },
          id: null,
        });
      }
    }
  });

  app.get("/mcp", (_req, res) =>
    res.status(405).set("Allow", "POST").json({ error: "method_not_allowed" })
  );
  app.delete("/mcp", (_req, res) =>
    res.status(405).set("Allow", "POST").json({ error: "method_not_allowed" })
  );

  const httpServer = app.listen(port, () =>
    console.error(`Kula MCP connector (stateless HTTP) on :${port}`)
  );
  // Bound the request-body-read phase, which express.json + the AbortSignal do NOT
  // cover; the Node default (300s) would otherwise outlive the container stop grace.
  httpServer.requestTimeout = REQUEST_DEADLINE_MS;
  httpServer.headersTimeout = REQUEST_DEADLINE_MS;
  return httpServer;
}
