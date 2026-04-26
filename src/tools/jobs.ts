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
        status: z.string().optional().describe("Comma-separated job statuses to filter by (draft, published, closed, archived)"),
        sort_by: z.string().optional().describe("Field to sort by"),
        sort_order: z.string().optional().describe("Sort order: asc or desc"),
        created_after: z.string().optional().describe("Filter by created date (ISO 8601, inclusive lower bound)"),
        created_before: z.string().optional().describe("Filter by created date (ISO 8601, inclusive upper bound)"),
        updated_after: z.string().optional().describe("Filter by updated date (ISO 8601, inclusive lower bound)"),
        updated_before: z.string().optional().describe("Filter by updated date (ISO 8601, inclusive upper bound)"),
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
      description: "Full-text search for jobs by keyword.",
      inputSchema: {
        query: z.string().optional().describe("Search query string"),
        page: z.string().optional().describe("Page number"),
        limit: z.string().optional().describe("Items per page"),
        department_ids: z.string().optional().describe("Comma-separated department IDs to filter by"),
        office_ids: z.string().optional().describe("Comma-separated office IDs to filter by"),
        status: z.string().optional().describe("Comma-separated job statuses to filter by (draft, published, closed, archived)"),
      },
    },
    async ({ query, page, limit, department_ids, office_ids, status }) => {
      try {
        const params: Record<string, string | string[] | number[] | undefined> = { query, page, limit };
        if (department_ids !== undefined) params.department_ids = department_ids.split(",").map((s) => Number(s.trim()));
        if (office_ids !== undefined) params.office_ids = office_ids.split(",").map((s) => Number(s.trim()));
        if (status !== undefined) params.status = status.split(",").map((s) => s.trim());
        const data = await client.get("/v1/jobs/search", params);
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
    "create_job",
    {
      description: "Create a new job opening.",
      inputSchema: {
        name: z.string().describe("Job name/title"),
        department_id: z.string().optional().describe("Department ID"),
        office_ids: z.string().optional().describe("Comma-separated office IDs"),
        employment_type: z.string().optional().describe("Employment type (e.g. full_time, part_time, contract)"),
        workplace: z.string().optional().describe("Workplace type: office, remote, or hybrid"),
        description: z.string().optional().describe("Job description"),
        requisition_codes: z.string().optional().describe("Comma-separated requisition codes to link"),
        confidential: z.string().optional().describe("Whether the job is confidential: true or false"),
        compensation: z
          .object({
            currency_country_id: z.string().optional().describe("Country ID for salary currency"),
            min_amount: z.number().optional().describe("Minimum salary amount"),
            max_amount: z.number().optional().describe("Maximum salary amount"),
            interval: z.string().optional().describe("Salary interval (e.g. monthly, yearly)"),
          })
          .optional()
          .describe("Compensation/salary range"),
      },
    },
    async ({ name, department_id, office_ids, employment_type, workplace, description, requisition_codes, confidential, compensation }) => {
      try {
        const body: Record<string, unknown> = { name };
        if (department_id !== undefined) body.department_id = Number(department_id);
        if (office_ids !== undefined) body.office_ids = office_ids.split(",").map((s) => Number(s.trim()));
        if (employment_type !== undefined) body.employment_type = employment_type;
        if (workplace !== undefined) body.workplace = workplace;
        if (description !== undefined) body.description = description;
        if (requisition_codes !== undefined) body.requisition_codes = requisition_codes.split(",").map((s) => s.trim());
        if (confidential !== undefined) body.confidential = confidential === "true";
        if (compensation !== undefined) {
          body.compensation = {
            ...(compensation.currency_country_id !== undefined && { currency_country_id: Number(compensation.currency_country_id) }),
            ...(compensation.min_amount !== undefined && { min_amount: compensation.min_amount }),
            ...(compensation.max_amount !== undefined && { max_amount: compensation.max_amount }),
            ...(compensation.interval !== undefined && { interval: compensation.interval }),
          };
        }

        const data = await client.post("/v1/jobs", body);
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
    "update_job",
    {
      description: "Update an existing job opening.",
      inputSchema: {
        id: z.string().describe("Job ID"),
        name: z.string().optional().describe("Job name/title"),
        department_id: z.string().optional().describe("Department ID"),
        office_ids: z.string().optional().describe("Comma-separated office IDs"),
        employment_type: z.string().optional().describe("Employment type (e.g. full_time, part_time, contract)"),
        workplace: z.string().optional().describe("Workplace type: office, remote, or hybrid"),
        description: z.string().optional().describe("Job description"),
        requisition_codes: z.string().optional().describe("Comma-separated requisition codes to link"),
        confidential: z.string().optional().describe("Whether the job is confidential: true or false"),
        compensation: z
          .object({
            currency_country_id: z.string().optional().describe("Country ID for salary currency"),
            min_amount: z.number().optional().describe("Minimum salary amount"),
            max_amount: z.number().optional().describe("Maximum salary amount"),
            interval: z.string().optional().describe("Salary interval (e.g. monthly, yearly)"),
          })
          .optional()
          .describe("Compensation/salary range"),
      },
    },
    async ({ id, name, department_id, office_ids, employment_type, workplace, description, requisition_codes, confidential, compensation }) => {
      try {
        const body: Record<string, unknown> = {};
        if (name !== undefined) body.name = name;
        if (department_id !== undefined) body.department_id = Number(department_id);
        if (office_ids !== undefined) body.office_ids = office_ids.split(",").map((s) => Number(s.trim()));
        if (employment_type !== undefined) body.employment_type = employment_type;
        if (workplace !== undefined) body.workplace = workplace;
        if (description !== undefined) body.description = description;
        if (requisition_codes !== undefined) body.requisition_codes = requisition_codes.split(",").map((s) => s.trim());
        if (confidential !== undefined) body.confidential = confidential === "true";
        if (compensation !== undefined) {
          body.compensation = {
            ...(compensation.currency_country_id !== undefined && { currency_country_id: Number(compensation.currency_country_id) }),
            ...(compensation.min_amount !== undefined && { min_amount: compensation.min_amount }),
            ...(compensation.max_amount !== undefined && { max_amount: compensation.max_amount }),
            ...(compensation.interval !== undefined && { interval: compensation.interval }),
          };
        }

        const data = await client.patch(`/v1/jobs/${id}`, body);
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
