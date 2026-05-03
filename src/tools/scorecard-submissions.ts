import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { KulaClient } from "../client.js";

export function register(server: McpServer, client: KulaClient) {
  server.registerTool(
    "list_scorecard_submissions",
    {
      description: "List scorecard submissions for a specific application.",
      inputSchema: {
        application_id: z.string().describe("Application ID"),
        status: z.string().optional().describe("Comma-separated submission statuses to filter by"),
        page: z.string().optional().describe("Page number"),
        limit: z.string().optional().describe("Items per page"),
        sort_by: z.enum(["created_at", "updated_at"]).optional().describe("Field to sort by (default: created_at)"),
        sort_order: z.enum(["asc", "desc"]).optional().describe("Sort direction (default: desc)"),
        created_after: z.string().optional().describe("Filter by created date (ISO 8601, inclusive lower bound)"),
        created_before: z.string().optional().describe("Filter by created date (ISO 8601, inclusive upper bound)"),
        updated_after: z.string().optional().describe("Filter by updated date (ISO 8601, inclusive lower bound)"),
        updated_before: z.string().optional().describe("Filter by updated date (ISO 8601, inclusive upper bound)"),
      },
    },
    async ({ application_id, status, page, limit, sort_by, sort_order, created_after, created_before, updated_after, updated_before }) => {
      try {
        const params: Record<string, string | string[] | undefined> = { page, limit, sort_by, sort_order, created_after, created_before, updated_after, updated_before };
        if (status !== undefined) params.status = status.split(",").map((s) => s.trim());
        const data = await client.get(
          `/v1/applications/${application_id}/scorecards`,
          params
        );
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
