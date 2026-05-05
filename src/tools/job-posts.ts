import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { KulaClient } from "../client.js";

export function register(server: McpServer, client: KulaClient) {
  server.registerTool(
    "list_job_posts",
    {
      description: "List published job posts on the job board. Only use when the user explicitly asks about job board listings.",
      inputSchema: {
        page: z.string().optional().describe("Page number"),
        limit: z.string().optional().describe("Items per page"),
        department_ids: z.string().optional().describe("Comma-separated department IDs to filter by"),
        office_ids: z.string().optional().describe("Comma-separated office IDs to filter by"),
      },
    },
    async ({ page, limit, department_ids, office_ids }) => {
      try {
        const params: Record<string, string | number[] | undefined> = { page, limit };
        if (department_ids !== undefined) params.department_ids = department_ids.split(",").map((s) => Number(s.trim()));
        if (office_ids !== undefined) params.office_ids = office_ids.split(",").map((s) => Number(s.trim()));
        const data = await client.get("/v1/job-boards/job-posts", params);
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
    "get_job_post",
    {
      description: "Get details of a specific job post from the job board. Only use when the user asks about a specific job board listing.",
      inputSchema: {
        id: z.string().describe("Job post ID"),
      },
    },
    async ({ id }) => {
      try {
        const data = await client.get(`/v1/job-boards/job-posts/${id}`);
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
