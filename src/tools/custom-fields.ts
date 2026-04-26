import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { KulaClient } from "../client.js";

export function register(server: McpServer, client: KulaClient) {
  server.registerTool(
    "list_custom_fields",
    {
      description: "List custom fields configured in the organization, optionally filtered by subject type.",
      inputSchema: {
        subject_type: z
          .string()
          .optional()
          .describe("Filter by subject type: job, candidate, or application"),
        page: z.string().optional().describe("Page number"),
        limit: z.string().optional().describe("Items per page"),
        sort_by: z.string().optional().describe("Field to sort by"),
        sort_order: z.string().optional().describe("Sort order: asc or desc"),
        created_after: z.string().optional().describe("Filter by created date (ISO 8601, inclusive lower bound)"),
        created_before: z.string().optional().describe("Filter by created date (ISO 8601, inclusive upper bound)"),
        updated_after: z.string().optional().describe("Filter by updated date (ISO 8601, inclusive lower bound)"),
        updated_before: z.string().optional().describe("Filter by updated date (ISO 8601, inclusive upper bound)"),
      },
    },
    async ({ subject_type, page, limit, sort_by, sort_order, created_after, created_before, updated_after, updated_before }) => {
      try {
        const data = await client.get("/v1/custom-fields", {
          subject_type,
          page,
          limit,
          sort_by,
          sort_order,
          created_after,
          created_before,
          updated_after,
          updated_before,
        });
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
