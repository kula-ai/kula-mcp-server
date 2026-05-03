#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { KulaClient } from "./client.js";
import { register as registerJobPosts } from "./tools/job-posts.js";
import { register as registerJobs } from "./tools/jobs.js";
import { register as registerApplications } from "./tools/applications.js";
import { register as registerCandidates } from "./tools/candidates.js";
import { register as registerWebhooks } from "./tools/webhooks.js";
import { register as registerAutocomplete } from "./tools/autocomplete.js";
import { register as registerOrganization } from "./tools/organization.js";
import { register as registerRequisitions } from "./tools/requisitions.js";
import { register as registerScorecardSubmissions } from "./tools/scorecard-submissions.js";
import { register as registerJobStages } from "./tools/job-stages.js";

const apiKey = process.env.KULA_API_KEY;
if (!apiKey) {
  console.error(
    "Error: KULA_API_KEY environment variable is required. " +
      "Get your API key from https://developers.kula.ai"
  );
  process.exit(1);
}

const client = new KulaClient(apiKey);

const server = new McpServer({
  name: "kula",
  version: "0.1.0",
});

// Register all tools
registerJobPosts(server, client);
registerJobs(server, client);
registerApplications(server, client);
registerCandidates(server, client);
registerWebhooks(server, client);
registerAutocomplete(server, client);
registerOrganization(server, client);
registerRequisitions(server, client);
registerScorecardSubmissions(server, client);
registerJobStages(server, client);

// Start the server with STDIO transport
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Kula MCP server started");
