import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { KulaClient } from "../client.js";

export function register(server: McpServer, client: KulaClient) {
  server.registerTool(
    "list_applications",
    {
      description: "List job applications. Only use when the user explicitly asks about applications.",
      inputSchema: {
        page: z.string().optional().describe("Page number"),
        limit: z.string().optional().describe("Items per page"),
        job_id: z.string().optional().describe("Filter by job ID"),
        status: z.string().optional().describe("Filter by application status"),
        stage_ids: z.string().optional().describe("Comma-separated stage IDs to filter by"),
        credited_to_user_ids: z.string().optional().describe("Comma-separated user IDs to filter by credited user"),
        sort_by: z.string().optional().describe("Field to sort by"),
        sort_order: z.string().optional().describe("Sort order: asc or desc"),
      },
    },
    async ({ page, limit, job_id, status, stage_ids, credited_to_user_ids, sort_by, sort_order }) => {
      try {
        const data = await client.get("/v1/applications", {
          page,
          limit,
          job_id,
          status,
          stage_ids,
          credited_to_user_ids,
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
    "get_application",
    {
      description: "Get details of a specific application. Only use when the user asks about a specific application.",
      inputSchema: {
        id: z.string().describe("Application ID"),
      },
    },
    async ({ id }) => {
      try {
        const data = await client.get(`/v1/applications/${id}`);
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
    "update_application_stage",
    {
      description: "Update the stage of a specific application.",
      inputSchema: {
        id: z.string().describe("Application ID"),
        stage_id: z.string().describe("Target stage ID"),
      },
    },
    async ({ id, stage_id }) => {
      try {
        const data = await client.post(`/v1/applications/${id}/update-stage`, {
          stage_id: Number(stage_id),
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
