import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { KulaClient } from "../client.js";

const VALID_STATUSES = ["not_started", "in_progress", "ended", "cancelled", "candidate_no_show"] as const;
const VALID_KINDS = ["one_on_one", "panel"] as const;
const VALID_LIST_KINDS = ["one_on_one", "panel", "external"] as const;
const VALID_LOCATIONS = ["onsite", "phone", "zoom", "google_meet", "microsoft_teams", "hackerrank"] as const;
const VALID_VISIBILITIES = ["default", "private"] as const;
const VALID_SORT_BY = ["created_at", "updated_at", "start_time"] as const;
const VALID_SORT_ORDER = ["asc", "desc"] as const;

function csvNumberArray(value: string): number[] {
  return value.split(",").map((s) => Number(s.trim())).filter((n) => !Number.isNaN(n));
}

function csvStringArray(value: string): string[] {
  return value.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
}

function errorResult(error: unknown) {
  return {
    content: [
      { type: "text" as const, text: `Error: ${error instanceof Error ? error.message : String(error)}` },
    ],
    isError: true,
  };
}

function okResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

export function register(server: McpServer, client: KulaClient) {
  server.registerTool(
    "list_interviews",
    {
      description:
        "List interviews for the account. Supports rich multi-value filters: by job, application, candidate, interviewer, organizer, recruiter, department, office, status, kind, location, AI note-taker flag, and start_time window. Cancelled interviews are included by default — use `meeting_status=cancelled` etc. to filter.",
      inputSchema: {
        page: z.string().optional().describe("Page number (default: 1)"),
        limit: z.string().optional().describe("Items per page (default: 20, max: 100)"),
        job_ids: z.string().optional().describe("Comma-separated job IDs"),
        application_ids: z.string().optional().describe("Comma-separated application IDs"),
        candidate_ids: z.string().optional().describe("Comma-separated candidate IDs"),
        interviewer_ids: z.string().optional().describe("Comma-separated user IDs of participants"),
        organizer_ids: z.string().optional().describe("Comma-separated user IDs (the user who scheduled the interview)"),
        recruiter_ids: z.string().optional().describe("Comma-separated credited-recruiter user IDs (filters by job's credited recruiter)"),
        department_ids: z.string().optional().describe("Comma-separated job-department IDs"),
        office_ids: z.string().optional().describe("Comma-separated office IDs"),
        meeting_status: z.string().optional().describe(`Comma-separated statuses: ${VALID_STATUSES.join(", ")}`),
        kind: z.string().optional().describe(`Comma-separated kinds: ${VALID_LIST_KINDS.join(", ")}`),
        location: z.string().optional().describe(`Comma-separated locations: ${VALID_LOCATIONS.join(", ")}`),
        ai_note_taker_enabled: z.enum(["true", "false"]).optional().describe("Filter by AI note-taker flag"),
        start_time_after: z.string().optional().describe("Inclusive lower bound on start_time (ISO 8601)"),
        start_time_before: z.string().optional().describe("Inclusive upper bound on start_time (ISO 8601)"),
        created_after: z.string().optional().describe("Filter by created date (ISO 8601 inclusive)"),
        created_before: z.string().optional().describe("Filter by created date (ISO 8601 inclusive)"),
        updated_after: z.string().optional().describe("Filter by updated date (ISO 8601 inclusive)"),
        updated_before: z.string().optional().describe("Filter by updated date (ISO 8601 inclusive)"),
        sort_by: z.enum(VALID_SORT_BY).optional().describe("Sort field (default: created_at)"),
        sort_order: z.enum(VALID_SORT_ORDER).optional().describe("Sort direction (default: desc)"),
      },
    },
    async (args) => {
      try {
        const params: Record<string, string | string[] | number[] | boolean | undefined> = {
          page: args.page,
          limit: args.limit,
          start_time_after: args.start_time_after,
          start_time_before: args.start_time_before,
          created_after: args.created_after,
          created_before: args.created_before,
          updated_after: args.updated_after,
          updated_before: args.updated_before,
          sort_by: args.sort_by,
          sort_order: args.sort_order,
        };
        if (args.job_ids !== undefined) params.job_ids = csvNumberArray(args.job_ids);
        if (args.application_ids !== undefined) params.application_ids = csvNumberArray(args.application_ids);
        if (args.candidate_ids !== undefined) params.candidate_ids = csvNumberArray(args.candidate_ids);
        if (args.interviewer_ids !== undefined) params.interviewer_ids = csvNumberArray(args.interviewer_ids);
        if (args.organizer_ids !== undefined) params.organizer_ids = csvNumberArray(args.organizer_ids);
        if (args.recruiter_ids !== undefined) params.recruiter_ids = csvNumberArray(args.recruiter_ids);
        if (args.department_ids !== undefined) params.department_ids = csvNumberArray(args.department_ids);
        if (args.office_ids !== undefined) params.office_ids = csvNumberArray(args.office_ids);
        if (args.meeting_status !== undefined) params.meeting_status = csvStringArray(args.meeting_status);
        if (args.kind !== undefined) params.kind = csvStringArray(args.kind);
        if (args.location !== undefined) params.location = csvStringArray(args.location);
        if (args.ai_note_taker_enabled !== undefined) params.ai_note_taker_enabled = args.ai_note_taker_enabled === "true";
        return okResult(await client.get("/v1/interviews", params));
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "list_application_interviews",
    {
      description:
        "List the interviews scheduled on a specific application. Same as `list_interviews` but scoped to one application (the `application_id` goes in the path, not as a filter). Cancelled interviews are included by default — use `meeting_status=cancelled` etc. to filter.",
      inputSchema: {
        application_id: z.number().int().describe("ID of the application (candidate's submission to a job). Use list_applications to discover."),
        page: z.string().optional().describe("Page number (default: 1)"),
        limit: z.string().optional().describe("Items per page (default: 20, max: 100)"),
        interviewer_ids: z.string().optional().describe("Comma-separated user IDs of participants"),
        organizer_ids: z.string().optional().describe("Comma-separated user IDs (the user who scheduled the interview)"),
        meeting_status: z.string().optional().describe(`Comma-separated statuses: ${VALID_STATUSES.join(", ")}`),
        kind: z.string().optional().describe(`Comma-separated kinds: ${VALID_LIST_KINDS.join(", ")}`),
        location: z.string().optional().describe(`Comma-separated locations: ${VALID_LOCATIONS.join(", ")}`),
        ai_note_taker_enabled: z.enum(["true", "false"]).optional().describe("Filter by AI note-taker flag"),
        start_time_after: z.string().optional().describe("Inclusive lower bound on start_time (ISO 8601)"),
        start_time_before: z.string().optional().describe("Inclusive upper bound on start_time (ISO 8601)"),
        created_after: z.string().optional().describe("Filter by created date (ISO 8601 inclusive)"),
        created_before: z.string().optional().describe("Filter by created date (ISO 8601 inclusive)"),
        updated_after: z.string().optional().describe("Filter by updated date (ISO 8601 inclusive)"),
        updated_before: z.string().optional().describe("Filter by updated date (ISO 8601 inclusive)"),
        sort_by: z.enum(VALID_SORT_BY).optional().describe("Sort field (default: created_at)"),
        sort_order: z.enum(VALID_SORT_ORDER).optional().describe("Sort direction (default: desc)"),
      },
    },
    async ({ application_id, ...args }) => {
      try {
        const params: Record<string, string | string[] | number[] | boolean | undefined> = {
          page: args.page,
          limit: args.limit,
          start_time_after: args.start_time_after,
          start_time_before: args.start_time_before,
          created_after: args.created_after,
          created_before: args.created_before,
          updated_after: args.updated_after,
          updated_before: args.updated_before,
          sort_by: args.sort_by,
          sort_order: args.sort_order,
        };
        if (args.interviewer_ids !== undefined) params.interviewer_ids = csvNumberArray(args.interviewer_ids);
        if (args.organizer_ids !== undefined) params.organizer_ids = csvNumberArray(args.organizer_ids);
        if (args.meeting_status !== undefined) params.meeting_status = csvStringArray(args.meeting_status);
        if (args.kind !== undefined) params.kind = csvStringArray(args.kind);
        if (args.location !== undefined) params.location = csvStringArray(args.location);
        if (args.ai_note_taker_enabled !== undefined) params.ai_note_taker_enabled = args.ai_note_taker_enabled === "true";
        return okResult(await client.get(`/v1/applications/${application_id}/interviews`, params));
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "get_interview",
    {
      description: "Get full details for a single interview, including interviewers, candidate, conference URL, scorecard refs.",
      inputSchema: {
        id: z.string().describe("Interview ID"),
      },
    },
    async ({ id }) => {
      try {
        return okResult(await client.get(`/v1/interviews/${id}`));
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "create_interview",
    {
      description:
        "Schedule an interview against an application. Calendar invites and conference URL are provisioned asynchronously — subscribe to the `interview.event.created` webhook to receive the fully-provisioned interview.\n" +
        "\n" +
        "**Typical workflow:**\n" +
        "1. Plan-driven: `get_interview_plan` → pick a `stage_activity_id` → `check_interviewers_availability` → `create_interview` with `stage_activity_id` (scorecard config inherits from the activity; pass `scorecard_template_id` only when stage_activity_id is NOT set).\n" +
        "2. Ad-hoc: `list_valid_organizers` (organizer_id) → `list_applications` (application_id) → `check_interviewers_availability` → `create_interview`.\n" +
        "\n" +
        "**Where to discover IDs:**\n" +
        "- `application_id` → `list_applications`\n" +
        "- `organizer_id` → `list_valid_organizers` (filtered by job_id)\n" +
        "- `interviewer_ids` → `list_users` (any active user)\n" +
        "- `office_id` → `list_offices` (required when location=onsite)\n" +
        "- `host_id` → `list_conference_hosts` (required when location=zoom; must be in interviewer_ids)\n" +
        "- `stage_activity_id` → `get_interview_plan`\n" +
        "- `interviewer_template_id` / `candidate_template_id` → `list_email_templates`\n" +
        "- `scorecard_template_id` → `list_scorecard_templates`\n" +
        "\n" +
        "**Constraints:**\n" +
        "- `start_time` must be on a 15-minute boundary with zero seconds (e.g. `09:00:00`, `09:15:00`) and in the future\n" +
        "- `duration_minutes` must be a multiple of 15 (15..1440)\n" +
        "- `kind: one_on_one` requires exactly one entry in `interviewer_ids`",
      inputSchema: {
        organizer_id: z.number().int().describe("ID of the user who organizes the interview. Use list_valid_organizers to discover."),
        application_id: z.number().int().describe("ID of the application (candidate's submission to a job — NOT a candidate id)."),
        start_time: z.string().describe("ISO 8601 datetime, on 15-min boundary, in the future"),
        duration_minutes: z.number().int().describe("Length in minutes — multiple of 15, between 15 and 1440"),
        timezone: z.string().describe("IANA timezone name (e.g., America/Los_Angeles)"),
        kind: z.enum(VALID_KINDS).describe(`Type of interview: ${VALID_KINDS.join(" | ")}`),
        location: z.enum(VALID_LOCATIONS).describe(`Location: ${VALID_LOCATIONS.join(" | ")}`),
        interviewer_ids: z.array(z.number().int()).min(1).max(10).describe("IDs of users participating in the interview"),
        stage_activity_id: z.number().int().optional().describe("Interview-plan activity ID (from get_interview_plan). When set, scorecard config inherits from the activity."),
        office_id: z.number().int().optional().describe("Required when location=onsite"),
        host_id: z.number().int().optional().describe("Required when location=zoom; must be in interviewer_ids"),
        hackerrank_template_id: z.number().int().optional().describe("Required when location=hackerrank"),
        name: z.string().max(255).optional().describe("Display name for the interview"),
        calendar_event_visibility: z.enum(VALID_VISIBILITIES).optional().describe("Calendar invite visibility"),
        ai_note_taker_enabled: z.boolean().optional(),
        ai_scorecard_assist_enabled: z.boolean().optional(),
        interviewer_template_id: z.number().int().optional().describe("Email template ID for interviewer invite body"),
        candidate_template_id: z.number().int().optional().describe("Email template ID for candidate invite body"),
        scorecard_template_id: z.number().int().optional().describe("Scorecard template ID. Silently ignored when stage_activity_id is set."),
      },
    },
    async ({ application_id, ...body }) => {
      try {
        return okResult(await client.post(`/v1/applications/${application_id}/interviews`, body));
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "update_interview",
    {
      description:
        "Update an existing interview. All fields are optional — only the supplied fields are modified. " +
        "Immutable fields (cannot be changed after creation): `organizer_id`, `application_id`, `job_id`, `stage_id`, `candidate_id`, `stage_activity_id`, `scorecard_template_id`. " +
        "Cancelled interviews cannot be updated (returns 422 err_interview_cancelled).",
      inputSchema: {
        id: z.string().describe("Interview ID"),
        start_time: z.string().optional().describe("New start_time (ISO 8601, on 15-min boundary, zero seconds)"),
        duration_minutes: z.number().int().optional().describe("Multiple of 15, 15..1440"),
        timezone: z.string().optional().describe("IANA timezone (e.g., America/Los_Angeles)"),
        kind: z.enum(VALID_KINDS).optional().describe(`Interview type: ${VALID_KINDS.join(" | ")}`),
        location: z.enum(VALID_LOCATIONS).optional().describe(`Location: ${VALID_LOCATIONS.join(" | ")}`),
        interviewer_ids: z.array(z.number().int()).min(1).max(10).optional(),
        office_id: z.number().int().optional().describe("Required when location=onsite"),
        host_id: z.number().int().optional().describe("Required when location=zoom; must be in interviewer_ids"),
        hackerrank_template_id: z.number().int().optional().describe("Required when location=hackerrank"),
        name: z.string().max(255).optional(),
        calendar_event_visibility: z.enum(VALID_VISIBILITIES).optional().describe(`Visibility: ${VALID_VISIBILITIES.join(" | ")}`),
        ai_note_taker_enabled: z.boolean().optional(),
        ai_scorecard_assist_enabled: z.boolean().optional(),
        interviewer_template_id: z.number().int().optional().describe("From list_email_templates"),
        candidate_template_id: z.number().int().optional().describe("From list_email_templates"),
      },
    },
    async ({ id, ...body }) => {
      try {
        return okResult(await client.patch(`/v1/interviews/${id}`, body));
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "cancel_interview",
    {
      description:
        "Cancel a scheduled interview. Calendar events are torn down and cancellation notifications dispatched asynchronously. " +
        "Cannot cancel: already-cancelled interviews (err_interview_already_cancelled), or completed HackerRank interviews (err_cannot_cancel_completed_hackerrank).",
      inputSchema: { id: z.string().describe("Interview ID") },
    },
    async ({ id }) => {
      try {
        return okResult(await client.post(`/v1/interviews/${id}/cancel`));
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "mark_candidate_no_show",
    {
      description: "Mark the candidate as a no-show on an in_progress or ended interview. Cannot be marked when a scorecard has been submitted.",
      inputSchema: { id: z.string().describe("Interview ID") },
    },
    async ({ id }) => {
      try {
        return okResult(await client.post(`/v1/interviews/${id}/mark_candidate_no_show`));
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "undo_candidate_no_show",
    {
      description: "Reverse a candidate no-show. Allowed only when meeting_status is candidate_no_show.",
      inputSchema: { id: z.string().describe("Interview ID") },
    },
    async ({ id }) => {
      try {
        return okResult(await client.post(`/v1/interviews/${id}/undo_candidate_no_show`));
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "check_interviewers_availability",
    {
      description:
        "Compute free interview slots across the organizer + interviewers' calendars. **Async** — returns a `poll_id` immediately. " +
        "Get the result two ways: (a) call `get_interviewers_availability_result` with the poll_id, or (b) subscribe to the `interview.availability.computed` webhook (recommended for production — avoids polling). " +
        "Result expires 1 hour after computation.",
      inputSchema: {
        organizer_id: z.number().int().describe("User running the search (from list_valid_organizers)"),
        interviewer_ids: z.array(z.number().int()).min(1).max(25).describe("User IDs to check availability for"),
        start_time: z.string().describe("Search window start (ISO 8601)"),
        end_time: z.string().optional().describe("Search window end (ISO 8601). Defaults to start_time + 7 days. Max 30 days."),
        duration_minutes: z.number().int().describe("Slot length, 15..480"),
        interview_kind: z.enum(VALID_KINDS).describe("`panel` = slots when ALL interviewers are simultaneously free (intersection). `one_on_one` = slots when ANY one interviewer is free (union)"),
        timezone: z.string().describe("IANA timezone (e.g., America/Los_Angeles)"),
      },
    },
    async (body) => {
      try {
        return okResult(await client.post("/v1/interviews/interviewers_availability", body));
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "get_interviewers_availability_result",
    {
      description:
        "Poll for the result of a previous `check_interviewers_availability` call. Returns 200 with status=succeeded/failed when terminated, 202 with status=pending while running, 410 if expired (1-hour TTL after completion). Respect the Retry-After header — don't poll faster than every 5s. For production loads, prefer the `interview.availability.computed` webhook.",
      inputSchema: {
        poll_id: z.string().describe("poll_id returned by check_interviewers_availability (24-char hex string)"),
      },
    },
    async ({ poll_id }) => {
      try {
        return okResult(await client.get(`/v1/interviews/interviewers_availability/${poll_id}`));
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "list_valid_organizers",
    {
      description: "List users eligible to be the `organizer_id` when scheduling an interview for a job — they have a connected calendar (Google or Microsoft) and permission to manage candidates on the job.",
      inputSchema: {
        job_id: z.number().int().describe("Job ID"),
        query: z.string().optional().describe("Filter by name/email substring (case-insensitive)"),
        page: z.string().optional(),
        limit: z.string().optional(),
      },
    },
    async ({ job_id, query, page, limit }) => {
      try {
        return okResult(await client.get("/v1/interviews/valid_organizers", { job_id, query, page, limit }));
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "list_conference_hosts",
    {
      description: "List users eligible to be the conference `host_id` (e.g., for Zoom — they have an active workspace seat). Used when scheduling video-conference interviews.",
      inputSchema: {
        provider: z.enum(["zoom"]).describe("Conference provider"),
        query: z.string().optional().describe("Filter by name/email substring"),
        page: z.string().optional(),
        limit: z.string().optional(),
      },
    },
    async ({ provider, query, page, limit }) => {
      try {
        return okResult(await client.get("/v1/interviews/conference_hosts", { provider, query, page, limit }));
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "get_interview_plan",
    {
      description:
        "Read the interview plan configured on a job — stages with their pre-configured interview activities. " +
        "Each activity's `id` is the `stage_activity_id` to pass to `create_interview` (which inherits the activity's scorecard config).",
      inputSchema: {
        job_id: z.string().describe("Job ID"),
      },
    },
    async ({ job_id }) => {
      try {
        return okResult(await client.get(`/v1/jobs/${job_id}/interview_plan`));
      } catch (error) {
        return errorResult(error);
      }
    }
  );
}
