import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { KulaClient } from "../client.js";

export function register(server: McpServer, client: KulaClient) {
  server.registerTool(
    "list_jobs",
    {
      description: "List jobs. Only use when the user explicitly asks about jobs (not job posts).",
      inputSchema: {
        page: z.string().optional().describe("Page number"),
        limit: z.string().optional().describe("Items per page"),
        department_ids: z.string().optional().describe("Comma-separated department IDs to filter by"),
        office_ids: z.string().optional().describe("Comma-separated office IDs to filter by"),
        status: z.string().optional().describe("Filter by job status"),
        sort_by: z.string().optional().describe("Field to sort by"),
        sort_order: z.string().optional().describe("Sort order: asc or desc"),
      },
    },
    async ({ page, limit, department_ids, office_ids, status, sort_by, sort_order }) => {
      try {
        const data = await client.get("/v1/jobs", {
          page,
          limit,
          department_ids,
          office_ids,
          status,
          sort_by,
          sort_order,
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

  server.registerTool(
    "get_job",
    {
      description: "Get details of a specific job. Only use when the user asks about a specific job (not job post).",
      inputSchema: {
        id: z.string().describe("Job ID"),
      },
    },
    async ({ id }) => {
      try {
        const data = await client.get(`/v1/jobs/${id}`);
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
