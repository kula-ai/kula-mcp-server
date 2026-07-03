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

// Explicit allowlist of read-only tools exposed over the remote (HTTP) transport.
// This is a security boundary: it is an ALLOWLIST, not a name heuristic, so any
// NEW tool is excluded by default until deliberately added here — a mis-named write
// (e.g. get_or_create_x) can never leak through. Keep in sync via server.test.ts.
export const READ_ONLY_TOOLS = new Set<string>([
  "find_companies",
  "find_currencies",
  "find_degrees",
  "find_disciplines",
  "find_industries",
  "find_institutions",
  "find_locations",
  "find_skills",
  "find_tags",
  "get_application",
  "get_candidate",
  "get_email_template",
  "get_interview",
  "get_interview_plan",
  "get_interviewers_availability_result",
  "get_job",
  "get_job_post",
  "get_requisition",
  "get_role",
  "get_scorecard_template",
  "get_user",
  "get_webhook",
  "get_webhook_sample_payload",
  "list_application_interviews",
  "list_application_notes",
  "list_applications",
  "list_candidates",
  "list_conference_hosts",
  "list_custom_fields",
  "list_degrees",
  "list_departments",
  "list_email_templates",
  "list_industries",
  "list_interviews",
  "list_job_posts",
  "list_job_stages",
  "list_jobs",
  "list_milestones",
  "list_offices",
  "list_rejection_reasons",
  "list_requisition_fields",
  "list_requisitions",
  "list_roles",
  "list_scorecard_submissions",
  "list_scorecard_templates",
  "list_sources",
  "list_stage_activities",
  "list_users",
  "list_valid_organizers",
  "list_webhook_events",
  "list_webhook_logs",
  "list_webhooks",
  "search_candidates",
  "search_companies",
  "search_disciplines",
  "search_institutions",
  "search_jobs",
  "search_locations",
]);

const TOOL_MODULES = [
  registerJobPosts,
  registerJobs,
  registerApplications,
  registerCandidates,
  registerWebhooks,
  registerAutocomplete,
  registerOrganization,
  registerRequisitions,
  registerScorecardSubmissions,
  registerJobStages,
  registerInterviews,
  registerTemplates,
  registerUsers,
  registerRoles,
  registerLookups,
];

// Builds a fresh McpServer with tools registered against the given client. A new
// server + client is created per request in the HTTP transport (stateless,
// multi-tenant); the stdio entry point builds one for the process lifetime.
// readOnly restricts registration to the allowlist — the remote pilot's safety
// boundary until core-side read-only enforcement (PAT) lands.
export function buildServer(
  client: KulaClient,
  opts: { readOnly?: boolean } = {}
): McpServer {
  const server = new McpServer({
    name: "kula",
    version: "0.1.0",
  });

  if (opts.readOnly) {
    // Wrap registerTool so only allowlisted tools register; restore afterwards.
    const original = server.registerTool.bind(server);
    (server as { registerTool: unknown }).registerTool = (
      name: string,
      ...rest: unknown[]
    ): unknown =>
      READ_ONLY_TOOLS.has(name)
        ? (original as (...a: unknown[]) => unknown)(name, ...rest)
        : undefined;
    for (const register of TOOL_MODULES) register(server, client);
    (server as { registerTool: unknown }).registerTool = original;
  } else {
    for (const register of TOOL_MODULES) register(server, client);
  }

  return server;
}
