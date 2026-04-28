import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { KulaClient } from "../client.js";

export function register(server: McpServer, client: KulaClient) {
  server.registerTool(
    "list_jobs",
    {
      description: "List and search jobs — supports keyword search via `query`, plus filters (status, department, office, date ranges). Only use when the user explicitly asks about jobs (not job posts).",
      inputSchema: {
        query: z.string().optional().describe("Search query to find jobs by title or keyword"),
        page: z.string().optional().describe("Page number"),
        limit: z.string().optional().describe("Items per page"),
        department_ids: z.string().optional().describe("Comma-separated department IDs to filter by"),
        office_ids: z.string().optional().describe("Comma-separated office IDs to filter by"),
        status: z.string().optional().describe("Comma-separated job statuses to filter by (draft, published, closed, archived)"),
        sort_by: z.string().optional().describe("Field to sort by"),
        sort_order: z.string().optional().describe("Sort order: asc or desc"),
        created_after: z.string().optional().describe("Filter by created date (ISO 8601, inclusive lower bound)"),
        created_before: z.string().optional().describe("Filter by created date (ISO 8601, inclusive upper bound)"),
        updated_after: z.string().optional().describe("Filter by updated date (ISO 8601, inclusive lower bound)"),
        updated_before: z.string().optional().describe("Filter by updated date (ISO 8601, inclusive upper bound)"),
      },
    },
    async ({ query, page, limit, department_ids, office_ids, status, sort_by, sort_order, created_after, created_before, updated_after, updated_before }) => {
      try {
        const params: Record<string, string | string[] | number[] | undefined> = { query, page, limit, sort_by, sort_order, created_after, created_before, updated_after, updated_before };
        if (department_ids !== undefined) params.department_ids = department_ids.split(",").map((s) => Number(s.trim()));
        if (office_ids !== undefined) params.office_ids = office_ids.split(",").map((s) => Number(s.trim()));
        if (status !== undefined) params.status = status.split(",").map((s) => s.trim());
        const data = await client.get("/v1/jobs", params);
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
