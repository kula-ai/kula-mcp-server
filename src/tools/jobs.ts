import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { KulaClient } from "../client.js";

export function register(server: McpServer, client: KulaClient) {
  server.registerTool(
    "list_jobs",
    {
      description:
        "List jobs with SQL-based filters and sorting. " +
        "Use this for browsing jobs or filtering by status, department, office, or date ranges. " +
        "For title search (partial match supported), use search_jobs instead.",
      inputSchema: {
        page: z.string().optional().describe("Page number (default: 1)"),
        limit: z.string().optional().describe("Items per page (default: 20, max: 100)"),
        department_ids: z.string().optional().describe("Comma-separated department IDs to filter by (includes descendants)"),
        office_ids: z.string().optional().describe("Comma-separated office IDs to filter by"),
        status: z.string().optional().describe("Comma-separated statuses to filter by: draft, pending_approval, rejected, scheduled, published, closed, archived"),
        sort_by: z.enum(["created_at", "updated_at"]).optional().describe("Field to sort by (default: created_at)"),
        sort_order: z.enum(["asc", "desc"]).optional().describe("Sort direction (default: desc)"),
        created_after: z.string().optional().describe("Return jobs created on or after this ISO 8601 datetime"),
        created_before: z.string().optional().describe("Return jobs created on or before this ISO 8601 datetime"),
        updated_after: z.string().optional().describe("Return jobs updated on or after this ISO 8601 datetime"),
        updated_before: z.string().optional().describe("Return jobs updated on or before this ISO 8601 datetime"),
      },
    },
    async ({ page, limit, department_ids, office_ids, status, sort_by, sort_order, created_after, created_before, updated_after, updated_before }) => {
      try {
        const params: Record<string, string | string[] | number[] | undefined> = { page, limit, sort_by, sort_order, created_after, created_before, updated_after, updated_before };
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
    "search_jobs",
    {
      description:
        "Search jobs by title (partial match supported) with optional filters. " +
        "Preferred over list_jobs when you need to find jobs by name. " +
        "Results are sorted by relevance.",
      inputSchema: {
        query: z.string().optional().describe("Search jobs by title — partial match supported"),
        department_ids: z.string().optional().describe("Comma-separated department IDs to filter by (includes descendants)"),
        office_ids: z.string().optional().describe("Comma-separated office IDs to filter by"),
        status: z.string().optional().describe("Comma-separated statuses to filter by: draft, pending_approval, rejected, scheduled, published, closed, archived"),
        employment_types: z.string().optional().describe("Comma-separated employment types: full_time, part_time, contract, internship, temporary, seasonal, volunteer"),
        workplace: z.string().optional().describe("Comma-separated workplace types: office, remote, hybrid"),
        confidential: z.boolean().optional().describe("Filter by confidentiality — true for confidential jobs only, false for non-confidential"),
        job_post_listed: z.boolean().optional().describe("Filter by job post visibility — true for publicly listed jobs only"),
        primary_recruiter_ids: z.string().optional().describe("Comma-separated user IDs to filter by primary recruiter"),
        primary_hiring_manager_ids: z.string().optional().describe("Comma-separated user IDs to filter by primary hiring manager"),
        page: z.string().optional().describe("Page number (default: 1)"),
        limit: z.string().optional().describe("Items per page (default: 20, max: 100)"),
      },
    },
    async ({ query, department_ids, office_ids, status, employment_types, workplace, confidential, job_post_listed, primary_recruiter_ids, primary_hiring_manager_ids, page, limit }) => {
      try {
        const body: Record<string, unknown> = {};
        if (query !== undefined) body.query = query;
        if (department_ids !== undefined) body.department_ids = department_ids.split(",").map((s) => Number(s.trim()));
        if (office_ids !== undefined) body.office_ids = office_ids.split(",").map((s) => Number(s.trim()));
        if (status !== undefined) body.status = status.split(",").map((s) => s.trim());
        if (employment_types !== undefined) body.employment_types = employment_types.split(",").map((s) => s.trim());
        if (workplace !== undefined) body.workplace = workplace.split(",").map((s) => s.trim());
        if (confidential !== undefined) body.confidential = confidential;
        if (job_post_listed !== undefined) body.job_post_listed = job_post_listed;
        if (primary_recruiter_ids !== undefined) body.primary_recruiter_ids = primary_recruiter_ids.split(",").map((s) => Number(s.trim()));
        if (primary_hiring_manager_ids !== undefined) body.primary_hiring_manager_ids = primary_hiring_manager_ids.split(",").map((s) => Number(s.trim()));
        if (page !== undefined) body.page = Number(page);
        if (limit !== undefined) body.limit = Number(limit);

        const data = await client.post("/v1/jobs/search", body);
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
      description:
        "Retrieve full details of a specific job by ID, including description, interview stages, and the hiring team " +
        "(hiring managers, recruiters, coordinators, and external recruiters, grouped by role with an is_primary flag). " +
        "Use this when you already have the job ID. To find a job by title, use search_jobs first.",
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
