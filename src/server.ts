import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
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
import { register as registerInterviews } from "./tools/interviews.js";
import { register as registerTemplates } from "./tools/templates.js";
import { register as registerUsers } from "./tools/users.js";
import { register as registerRoles } from "./tools/roles.js";
import { register as registerLookups } from "./tools/lookups.js";

// Builds a fresh McpServer with all tools registered against the given client.
// A new server + client is created per request in the HTTP transport (stateless,
// multi-tenant); the stdio entry point builds one for the process lifetime.
export function buildServer(client: KulaClient): McpServer {
  const server = new McpServer({
    name: "kula",
    version: "0.1.0",
  });

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
  registerInterviews(server, client);
  registerTemplates(server, client);
  registerUsers(server, client);
  registerRoles(server, client);
  registerLookups(server, client);

  return server;
}
