import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { KulaClient } from "../client.js";

export function register(server: McpServer, client: KulaClient) {
  server.registerTool(
    "list_sources",
    {
      description: "List all candidate sources in the organization.",
      inputSchema: {
        page: z.string().optional().describe("Page number"),
        limit: z.string().optional().describe("Items per page"),
        enabled: z.string().optional().describe("Filter by enabled status: true or false"),
        sort_by: z.enum(["created_at", "updated_at"]).optional().describe("Field to sort by (default: created_at)"),
        sort_order: z.enum(["asc", "desc"]).optional().describe("Sort direction (default: desc)"),
        created_after: z.string().optional().describe("Filter by created date (ISO 8601, inclusive lower bound)"),
        created_before: z.string().optional().describe("Filter by created date (ISO 8601, inclusive upper bound)"),
        updated_after: z.string().optional().describe("Filter by updated date (ISO 8601, inclusive lower bound)"),
        updated_before: z.string().optional().describe("Filter by updated date (ISO 8601, inclusive upper bound)"),
      },
    },
    async ({ page, limit, enabled, sort_by, sort_order, created_after, created_before, updated_after, updated_before }) => {
      try {
        const params: Record<string, string | boolean | undefined> = { page, limit, sort_by, sort_order, created_after, created_before, updated_after, updated_before };
        if (enabled !== undefined) params.enabled = enabled === "true";
        const data = await client.get("/v1/sources", params);
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
