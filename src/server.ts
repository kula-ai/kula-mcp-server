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

// Read tools name themselves list_/get_/find_/search_; everything else mutates.
const READ_ONLY_PREFIX = /^(list|get|find|search)_/;

// When read-only, wrap the server so registerTool silently drops write tools.
// register() modules never read registerTool's return value, so skipping is safe.
function readOnlyGuard(server: McpServer): McpServer {
  return new Proxy(server, {
    get(target, prop, receiver) {
      if (prop === "registerTool") {
        return (name: string, ...rest: unknown[]): unknown => {
          if (READ_ONLY_PREFIX.test(name)) {
            return (target.registerTool as (...a: unknown[]) => unknown)(name, ...rest);
          }
          return undefined;
        };
      }
      const value = Reflect.get(target, prop, receiver);
      return typeof value === "function" ? (value as () => unknown).bind(target) : value;
    },
  }) as McpServer;
}

// Builds a fresh McpServer with tools registered against the given client. A new
// server + client is created per request in the HTTP transport (stateless,
// multi-tenant); the stdio entry point builds one for the process lifetime.
// readOnly restricts registration to read tools (the remote pilot's safety boundary
// until core-side read-only enforcement lands).
export function buildServer(
  client: KulaClient,
  opts: { readOnly?: boolean } = {}
): McpServer {
  const server = new McpServer({
    name: "kula",
    version: "0.1.0",
  });
  const target = opts.readOnly ? readOnlyGuard(server) : server;

  registerJobPosts(target, client);
  registerJobs(target, client);
  registerApplications(target, client);
  registerCandidates(target, client);
  registerWebhooks(target, client);
  registerAutocomplete(target, client);
  registerOrganization(target, client);
  registerRequisitions(target, client);
  registerScorecardSubmissions(target, client);
  registerJobStages(target, client);
  registerInterviews(target, client);
  registerTemplates(target, client);
  registerUsers(target, client);
  registerRoles(target, client);
  registerLookups(target, client);

  return server;
}
