#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { KulaClient } from "./client.js";
import { buildServer } from "./server.js";
import { startHttpServer, drainAndExit } from "./http.js";

// `--http` runs the stateless remote connector (deployed mode); the default is the
// local stdio server (unchanged published behavior — token from KULA_API_KEY).
if (process.argv.includes("--http")) {
  const httpServer = startHttpServer();
  let shuttingDown = false;
  const shutdown = (signal: string): void => {
    if (shuttingDown) return;
    shuttingDown = true;
    drainAndExit(httpServer, signal, process.exit);
  };
  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGINT", () => shutdown("SIGINT"));
} else {
  const apiKey = process.env.KULA_API_KEY;
  if (!apiKey) {
    console.error(
      "Error: KULA_API_KEY environment variable is required. " +
        "Get your API key from https://developers.kula.ai"
    );
    process.exit(1);
  }

  const client = new KulaClient(apiKey);
  const server = buildServer(client);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Kula MCP server started");
}
