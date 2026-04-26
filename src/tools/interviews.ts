import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { KulaClient } from "../client.js";

export function register(server: McpServer, client: KulaClient) {
  server.registerTool(
    "list_interviews",
    {
      description: "List interviews. Only use when the user explicitly asks about interviews.",
      inputSchema: {
        application_id: z.string().optional().describe("Filter by application ID"),
        start_time_after: z.string().optional().describe("Filter interviews starting after this ISO 8601 datetime"),
        start_time_before: z.string().optional().describe("Filter interviews starting before this ISO 8601 datetime"),
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
    async ({ application_id, start_time_after, start_time_before, page, limit, sort_by, sort_order, created_after, created_before, updated_after, updated_before }) => {
      try {
        const params: Record<string, string | number | undefined> = { start_time_after, start_time_before, page, limit, sort_by, sort_order, created_after, created_before, updated_after, updated_before };
        if (application_id !== undefined) params.application_id = Number(application_id);
        const data = await client.get("/v1/interviews", params);
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
    "get_interview",
    {
      description: "Get details of a specific interview.",
      inputSchema: {
        id: z.string().describe("Interview ID"),
      },
    },
    async ({ id }) => {
      try {
        const data = await client.get(`/v1/interviews/${id}`);
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
    "create_interview",
    {
      description: "Schedule a new interview for an application.",
      inputSchema: {
        application_id: z.string().describe("Application ID"),
        start_time: z.string().describe("ISO 8601 datetime when the interview starts"),
        end_time: z.string().describe("ISO 8601 datetime when the interview ends (must be after start_time)"),
        interviewer_user_ids: z
          .string()
          .optional()
          .describe("Comma-separated user IDs of interviewers"),
        name: z.string().optional().describe("Interview name"),
        timezone: z.string().optional().describe("Timezone for the interview (e.g. America/New_York)"),
        location: z.string().optional().describe("Interview location (e.g. zoom, google_meet, in_person)"),
        kind: z.string().optional().describe("Interview kind: one_on_one or panel"),
        scorecard_required: z.string().optional().describe("Whether scorecard submission is required: true or false"),
        candidate_description: z.string().optional().describe("Description shown to the candidate"),
        interviewer_description: z.string().optional().describe("Description shown to interviewers"),
        calendar_visibility: z.string().optional().describe("Calendar event visibility"),
        note_taker_enabled: z.string().optional().describe("Whether to enable note taker: true or false"),
        scorecard_feedback_description: z.string().optional().describe("Instructions for written feedback on the scorecard"),
        scorecard_rating_description: z.string().optional().describe("Instructions for rating on the scorecard"),
      },
    },
    async ({
      application_id,
      start_time,
      end_time,
      interviewer_user_ids,
      name,
      timezone,
      location,
      kind,
      scorecard_required,
      candidate_description,
      interviewer_description,
      calendar_visibility,
      note_taker_enabled,
      scorecard_feedback_description,
      scorecard_rating_description,
    }) => {
      try {
        const body: Record<string, unknown> = {
          application_id: Number(application_id),
          start_time,
          end_time,
        };
        if (interviewer_user_ids !== undefined) {
          body.interviewer_user_ids = interviewer_user_ids.split(",").map((s) => Number(s.trim()));
        }
        if (name !== undefined) body.name = name;
        if (timezone !== undefined) body.timezone = timezone;
        if (location !== undefined) body.location = location;
        if (kind !== undefined) body.kind = kind;
        if (scorecard_required !== undefined) body.scorecard_required = scorecard_required === "true";
        if (candidate_description !== undefined) body.candidate_description = candidate_description;
        if (interviewer_description !== undefined) body.interviewer_description = interviewer_description;
        if (calendar_visibility !== undefined) body.calendar_visibility = calendar_visibility;
        if (note_taker_enabled !== undefined) body.note_taker_enabled = note_taker_enabled === "true";
        if (scorecard_feedback_description !== undefined) body.scorecard_feedback_description = scorecard_feedback_description;
        if (scorecard_rating_description !== undefined) body.scorecard_rating_description = scorecard_rating_description;

        const data = await client.post("/v1/interviews", body);
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
    "update_interview",
    {
      description: "Update an existing interview's details.",
      inputSchema: {
        id: z.string().describe("Interview ID"),
        start_time: z.string().optional().describe("ISO 8601 datetime when the interview starts"),
        end_time: z.string().optional().describe("ISO 8601 datetime when the interview ends"),
        interviewer_user_ids: z
          .string()
          .optional()
          .describe("Comma-separated user IDs of interviewers"),
        name: z.string().optional().describe("Interview name"),
        timezone: z.string().optional().describe("Timezone for the interview (e.g. America/New_York)"),
        location: z.string().optional().describe("Interview location"),
        candidate_description: z.string().optional().describe("Description shown to the candidate"),
        interviewer_description: z.string().optional().describe("Description shown to interviewers"),
        calendar_visibility: z.string().optional().describe("Calendar event visibility"),
        note_taker_enabled: z.string().optional().describe("Whether to enable note taker: true or false"),
        scorecard_required: z.string().optional().describe("Whether scorecard submission is required: true or false"),
        scorecard_feedback_description: z.string().optional().describe("Instructions for written feedback on the scorecard"),
        scorecard_rating_description: z.string().optional().describe("Instructions for rating on the scorecard"),
      },
    },
    async ({ id, start_time, end_time, interviewer_user_ids, name, timezone, location, candidate_description, interviewer_description, calendar_visibility, note_taker_enabled, scorecard_required, scorecard_feedback_description, scorecard_rating_description }) => {
      try {
        const body: Record<string, unknown> = {};
        if (start_time !== undefined) body.start_time = start_time;
        if (end_time !== undefined) body.end_time = end_time;
        if (interviewer_user_ids !== undefined) {
          body.interviewer_user_ids = interviewer_user_ids.split(",").map((s) => Number(s.trim()));
        }
        if (name !== undefined) body.name = name;
        if (timezone !== undefined) body.timezone = timezone;
        if (location !== undefined) body.location = location;
        if (candidate_description !== undefined) body.candidate_description = candidate_description;
        if (interviewer_description !== undefined) body.interviewer_description = interviewer_description;
        if (calendar_visibility !== undefined) body.calendar_visibility = calendar_visibility;
        if (note_taker_enabled !== undefined) body.note_taker_enabled = note_taker_enabled === "true";
        if (scorecard_required !== undefined) body.scorecard_required = scorecard_required === "true";
        if (scorecard_feedback_description !== undefined) body.scorecard_feedback_description = scorecard_feedback_description;
        if (scorecard_rating_description !== undefined) body.scorecard_rating_description = scorecard_rating_description;

        const data = await client.patch(`/v1/interviews/${id}`, body);
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
    "cancel_interview",
    {
      description: "Cancel an existing interview.",
      inputSchema: {
        id: z.string().describe("Interview ID"),
      },
    },
    async ({ id }) => {
      try {
        await client.delete(`/v1/interviews/${id}`);
        return {
          content: [{ type: "text", text: "Interview cancelled successfully." }],
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
