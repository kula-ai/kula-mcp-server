import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { KulaClient } from "../client.js";

const VALID_PROVIDERS = ["google", "microsoft"] as const;
const VALID_STATUSES = ["active", "deleted_from_application", "deleted_from_provider"] as const;
const VALID_SORT_BY = ["created_at", "updated_at", "name"] as const;
const VALID_SORT_ORDER = ["asc", "desc"] as const;

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
    "list_shared_calendars",
    {
      description:
        "List shared calendars saved on the account. Defaults to `active` calendars; pass `status` to opt into deleted ones (useful for reconciling historical references). Use the returned `id` as `shared_calendar_id` on `create_interview` to host the calendar event on the chosen shared calendar instead of the organizer's primary.",
      inputSchema: {
        page: z.string().optional(),
        limit: z.string().optional(),
        provider: z.enum(VALID_PROVIDERS).optional().describe("Filter by calendar provider"),
        status: z.string().optional().describe(`Comma-separated statuses (default: active). Allowed: ${VALID_STATUSES.join(", ")}`),
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
        const params: Record<string, string | string[] | undefined> = {
          page: args.page,
          limit: args.limit,
          provider: args.provider,
          sort_by: args.sort_by,
          sort_order: args.sort_order,
          created_after: args.created_after,
          created_before: args.created_before,
          updated_after: args.updated_after,
          updated_before: args.updated_before,
        };
        if (args.status !== undefined) params.status = csvStringArray(args.status);
        return okResult(await client.get("/v1/shared_calendars", params));
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "get_shared_calendar",
    {
      description: "Get a single shared calendar by ID. Returns regardless of status — use this to resolve historical `shared_calendar_id` references from interview records even after the calendar has been removed.",
      inputSchema: {
        id: z.string().describe("Shared calendar ID"),
      },
    },
    async ({ id }) => {
      try {
        return okResult(await client.get(`/v1/shared_calendars/${id}`));
      } catch (error) {
        return errorResult(error);
      }
    }
  );
}
