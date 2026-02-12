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
        per_page: z.string().optional().describe("Items per page"),
        status: z.string().optional().describe("Filter by status"),
      },
    },
    async ({ page, per_page, status }) => {
      try {
        const data = await client.get("/v1/job-boards/job-posts", {
          page,
          per_page,
          status,
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
