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
        status: z.string().optional().describe("Comma-separated application statuses to filter by (active, hired, rejected, duplicate)"),
        stage_ids: z.string().optional().describe("Comma-separated stage IDs to filter by"),
        credited_to_user_ids: z.string().optional().describe("Comma-separated user IDs to filter by credited user"),
        sort_by: z.string().optional().describe("Field to sort by"),
        sort_order: z.string().optional().describe("Sort order: asc or desc"),
        created_after: z.string().optional().describe("Filter by created date (ISO 8601, inclusive lower bound)"),
        created_before: z.string().optional().describe("Filter by created date (ISO 8601, inclusive upper bound)"),
        updated_after: z.string().optional().describe("Filter by updated date (ISO 8601, inclusive lower bound)"),
        updated_before: z.string().optional().describe("Filter by updated date (ISO 8601, inclusive upper bound)"),
      },
    },
    async ({ page, limit, job_id, status, stage_ids, credited_to_user_ids, sort_by, sort_order, created_after, created_before, updated_after, updated_before }) => {
      try {
        const params: Record<string, string | number | string[] | number[] | undefined> = { page, limit, sort_by, sort_order, created_after, created_before, updated_after, updated_before };
        if (job_id !== undefined) params.job_id = Number(job_id);
        if (status !== undefined) params.status = status.split(",").map((s) => s.trim());
        if (stage_ids !== undefined) params.stage_ids = stage_ids.split(",").map((s) => Number(s.trim()));
        if (credited_to_user_ids !== undefined) params.credited_to_user_ids = credited_to_user_ids.split(",").map((s) => Number(s.trim()));
        const data = await client.get("/v1/applications", params);
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
        requisition_code: z.string().optional().describe("Requisition code to associate with this stage move"),
      },
    },
    async ({ id, stage_id, requisition_code }) => {
      try {
        const body: Record<string, unknown> = { stage_id: Number(stage_id) };
        if (requisition_code !== undefined) body.requisition_code = requisition_code;
        const data = await client.patch(`/v1/applications/${id}/stage`, body);
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
