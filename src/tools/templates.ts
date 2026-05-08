import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { KulaClient } from "../client.js";

const VALID_EMAIL_CHANNELS = ["email", "calendar_invite"] as const;
const VALID_EMAIL_CATEGORIES = [
  "adhoc",
  "interview_coordination",
  "interviewer_coordination",
  "email_activity",
  "application_submission",
  "assessment",
  "rejection",
  "offer",
  "self_schedule_invite",
  "availability",
  "survey",
] as const;
const VALID_SORT_BY = ["created_at", "updated_at"] as const;
const VALID_SORT_ORDER = ["asc", "desc"] as const;

function csvNumberArray(value: string): number[] {
  return value.split(",").map((s) => Number(s.trim())).filter((n) => !Number.isNaN(n));
}

function csvStringArray(value: string): string[] {
  return value.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
}

function errorResult(error: unknown) {
  return {
    content: [
      { type: "text" as const, text: `Error: ${error instanceof Error ? error.message : String(error)}` },
    ],
    isError: true,
  };
}

function okResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

export function register(server: McpServer, client: KulaClient) {
  server.registerTool(
    "list_scorecard_templates",
    {
      description:
        "List scorecard templates configured for the account. Use this to discover `scorecard_template_id` values to pass to `create_interview` (only honored when `stage_activity_id` is NOT set — interview-plan activities own scorecard config).",
      inputSchema: {
        page: z.string().optional(),
        limit: z.string().optional(),
        query: z.string().optional().describe("Filter by template name (case-insensitive substring)"),
        department_ids: z.string().optional().describe("Comma-separated department IDs"),
        office_ids: z.string().optional().describe("Comma-separated office IDs"),
        employment_types: z.string().optional().describe("Comma-separated employment types"),
        sort_by: z.enum(VALID_SORT_BY).optional(),
        sort_order: z.enum(VALID_SORT_ORDER).optional(),
        created_after: z.string().optional(),
        created_before: z.string().optional(),
        updated_after: z.string().optional(),
        updated_before: z.string().optional(),
      },
    },
    async (args) => {
      try {
        const params: Record<string, string | string[] | number[] | undefined> = {
          page: args.page,
          limit: args.limit,
          query: args.query,
          sort_by: args.sort_by,
          sort_order: args.sort_order,
          created_after: args.created_after,
          created_before: args.created_before,
          updated_after: args.updated_after,
          updated_before: args.updated_before,
        };
        if (args.department_ids !== undefined) params.department_ids = csvNumberArray(args.department_ids);
        if (args.office_ids !== undefined) params.office_ids = csvNumberArray(args.office_ids);
        if (args.employment_types !== undefined) params.employment_types = csvStringArray(args.employment_types);
        return okResult(await client.get("/v1/scorecard_templates", params));
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "get_scorecard_template",
    {
      description: "Get full details for a single scorecard template — questions, feedback/rating descriptions, and segmentation.",
      inputSchema: {
        id: z.string().describe("Scorecard template ID"),
      },
    },
    async ({ id }) => {
      try {
        return okResult(await client.get(`/v1/scorecard_templates/${id}`));
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "list_email_templates",
    {
      description:
        "List email and calendar-invite templates configured for the account. Per-interview snapshots and system templates are excluded. Use this to discover `interviewer_template_id` and `candidate_template_id` for `create_interview`.",
      inputSchema: {
        page: z.string().optional(),
        limit: z.string().optional(),
        query: z.string().optional().describe("Filter by template name (case-insensitive substring)"),
        channel: z.enum(VALID_EMAIL_CHANNELS).optional().describe("Filter by delivery channel"),
        categories: z.string().optional().describe(`Comma-separated categories: ${VALID_EMAIL_CATEGORIES.join(", ")}`),
        owner_ids: z.string().optional().describe("Comma-separated owner user IDs"),
        sort_by: z.enum(VALID_SORT_BY).optional(),
        sort_order: z.enum(VALID_SORT_ORDER).optional(),
        created_after: z.string().optional(),
        created_before: z.string().optional(),
        updated_after: z.string().optional(),
        updated_before: z.string().optional(),
      },
    },
    async (args) => {
      try {
        const params: Record<string, string | string[] | number[] | undefined> = {
          page: args.page,
          limit: args.limit,
          query: args.query,
          channel: args.channel,
          sort_by: args.sort_by,
          sort_order: args.sort_order,
          created_after: args.created_after,
          created_before: args.created_before,
          updated_after: args.updated_after,
          updated_before: args.updated_before,
        };
        if (args.categories !== undefined) params.categories = csvStringArray(args.categories);
        if (args.owner_ids !== undefined) params.owner_ids = csvNumberArray(args.owner_ids);
        return okResult(await client.get("/v1/email_templates", params));
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "get_email_template",
    {
      description: "Get full details for a single email or calendar-invite template, including subject, body, and owner.",
      inputSchema: {
        id: z.string().describe("Email template ID"),
      },
    },
    async ({ id }) => {
      try {
        return okResult(await client.get(`/v1/email_templates/${id}`));
      } catch (error) {
        return errorResult(error);
      }
    }
  );
}
