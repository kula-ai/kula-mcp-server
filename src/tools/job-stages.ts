import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { KulaClient } from "../client.js";

export function register(server: McpServer, client: KulaClient) {
  server.registerTool(
    "list_job_stages",
    {
      description: "List all pipeline stages for a specific job.",
      inputSchema: {
        job_id: z.string().describe("Job ID"),
        page: z.string().optional().describe("Page number"),
        limit: z.string().optional().describe("Items per page"),
        sort_by: z.enum(["created_at", "updated_at"]).optional().describe("Field to sort by (default: created_at)"),
        sort_order: z.enum(["asc", "desc"]).optional().describe("Sort direction (default: desc)"),
        created_after: z.string().optional().describe("ISO 8601 datetime lower bound on created_at"),
        created_before: z.string().optional().describe("ISO 8601 datetime upper bound on created_at"),
        updated_after: z.string().optional().describe("ISO 8601 datetime lower bound on updated_at"),
        updated_before: z.string().optional().describe("ISO 8601 datetime upper bound on updated_at"),
      },
    },
    async ({ job_id, page, limit, sort_by, sort_order, created_after, created_before, updated_after, updated_before }) => {
      try {
        const data = await client.get(`/v1/jobs/${job_id}/stages`, { page, limit, sort_by, sort_order, created_after, created_before, updated_after, updated_before });
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
    "create_job_stage",
    {
      description: "Create a new pipeline stage for a job.",
      inputSchema: {
        job_id: z.string().describe("Job ID"),
        name: z.string().describe("Stage name"),
        milestone_id: z.string().optional().describe("Milestone ID to associate with this stage"),
        position: z.string().optional().describe("Position of the stage in the pipeline (1-based)"),
        candidate_review_time: z.string().optional().describe("Expected review time in days"),
      },
    },
    async ({ job_id, name, milestone_id, position, candidate_review_time }) => {
      try {
        const body: Record<string, unknown> = { name };
        if (milestone_id !== undefined) body.milestone_id = Number(milestone_id);
        if (position !== undefined) body.position = Number(position);
        if (candidate_review_time !== undefined) body.candidate_review_time = Number(candidate_review_time);
        const data = await client.post(`/v1/jobs/${job_id}/stages`, body);
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
    "list_stage_activities",
    {
      description: "List all activities (actions) configured for a specific job stage.",
      inputSchema: {
        job_id: z.string().describe("Job ID"),
        stage_id: z.string().describe("Stage ID"),
        page: z.string().optional().describe("Page number"),
        limit: z.string().optional().describe("Items per page"),
        sort_by: z.enum(["created_at", "updated_at"]).optional().describe("Field to sort by (default: created_at)"),
        sort_order: z.enum(["asc", "desc"]).optional().describe("Sort direction (default: desc)"),
        created_after: z.string().optional().describe("ISO 8601 datetime lower bound on created_at"),
        created_before: z.string().optional().describe("ISO 8601 datetime upper bound on created_at"),
        updated_after: z.string().optional().describe("ISO 8601 datetime lower bound on updated_at"),
        updated_before: z.string().optional().describe("ISO 8601 datetime upper bound on updated_at"),
      },
    },
    async ({ job_id, stage_id, page, limit, sort_by, sort_order, created_after, created_before, updated_after, updated_before }) => {
      try {
        const data = await client.get(`/v1/jobs/${job_id}/stages/${stage_id}/activities`, { page, limit, sort_by, sort_order, created_after, created_before, updated_after, updated_before });
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
    "list_job_stage_activities",
    {
      description: "List all activities (actions) across every stage of a job in one call. Each activity includes its stage_id. Use this to sync a job's full pipeline configuration without making one request per stage.",
      inputSchema: {
        job_id: z.string().describe("Job ID"),
        page: z.string().optional().describe("Page number"),
        limit: z.string().optional().describe("Items per page"),
        sort_by: z.enum(["created_at", "updated_at"]).optional().describe("Field to sort by (default: created_at)"),
        sort_order: z.enum(["asc", "desc"]).optional().describe("Sort direction (default: desc)"),
        created_after: z.string().optional().describe("ISO 8601 datetime lower bound on created_at"),
        created_before: z.string().optional().describe("ISO 8601 datetime upper bound on created_at"),
        updated_after: z.string().optional().describe("ISO 8601 datetime lower bound on updated_at"),
        updated_before: z.string().optional().describe("ISO 8601 datetime upper bound on updated_at"),
      },
    },
    async ({ job_id, page, limit, sort_by, sort_order, created_after, created_before, updated_after, updated_before }) => {
      try {
        const data = await client.get(`/v1/jobs/${job_id}/stage-activities`, { page, limit, sort_by, sort_order, created_after, created_before, updated_after, updated_before });
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
