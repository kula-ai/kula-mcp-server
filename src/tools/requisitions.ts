import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { KulaClient } from "../client.js";

export function register(server: McpServer, client: KulaClient) {
  server.registerTool(
    "list_requisitions",
    {
      description:
        "List all requisitions for your account, respecting permissions.",
      inputSchema: {
        page: z.string().optional().describe("Page number"),
        limit: z.string().optional().describe("Items per page"),
        status: z.string().optional().describe("Comma-separated statuses to filter by (draft, pending_approval, approved, rejected, created, open, filled, closed, archived)"),
        department_ids: z.string().optional().describe("Comma-separated department IDs to filter by"),
        employment_type: z.string().optional().describe("Comma-separated employment types to filter by (full_time, part_time, contract, internship, temporary, seasonal)"),
        requisition_type: z.string().optional().describe("Comma-separated requisition types to filter by (new_hire, contract, backfill, internship, internal)"),
        recruiter_ids: z.string().optional().describe("Comma-separated recruiter user IDs to filter by"),
        hiring_manager_ids: z.string().optional().describe("Comma-separated hiring manager user IDs to filter by"),
        office_ids: z.string().optional().describe("Comma-separated office IDs to filter by"),
        job_ids: z.string().optional().describe("Comma-separated job IDs to filter by"),
        created_by_ids: z.string().optional().describe("Comma-separated user IDs to filter by creator"),
        q: z.string().optional().describe("Full-text search query"),
        sort_by: z.string().optional().describe("Field to sort by (created_at, updated_at, opened_at, target_hire_date)"),
        sort_order: z.string().optional().describe("Sort order: asc or desc"),
        created_after: z.string().optional().describe("Filter by created date (ISO 8601, inclusive lower bound)"),
        created_before: z.string().optional().describe("Filter by created date (ISO 8601, inclusive upper bound)"),
        updated_after: z.string().optional().describe("Filter by updated date (ISO 8601, inclusive lower bound)"),
        updated_before: z.string().optional().describe("Filter by updated date (ISO 8601, inclusive upper bound)"),
        target_hire_date_after: z.string().optional().describe("Filter by target hire date lower bound (YYYY-MM-DD)"),
        target_hire_date_before: z.string().optional().describe("Filter by target hire date upper bound (YYYY-MM-DD)"),
        target_start_date_after: z.string().optional().describe("Filter by target start date lower bound (YYYY-MM-DD)"),
        target_start_date_before: z.string().optional().describe("Filter by target start date upper bound (YYYY-MM-DD)"),
      },
    },
    async ({ page, limit, status, department_ids, employment_type, requisition_type, recruiter_ids, hiring_manager_ids, office_ids, job_ids, created_by_ids, q, sort_by, sort_order, created_after, created_before, updated_after, updated_before, target_hire_date_after, target_hire_date_before, target_start_date_after, target_start_date_before }) => {
      try {
        const params: Record<string, string | string[] | number[] | undefined> = { page, limit, q, sort_by, sort_order, created_after, created_before, updated_after, updated_before, target_hire_date_after, target_hire_date_before, target_start_date_after, target_start_date_before };
        if (status !== undefined) params.status = status.split(",").map((s) => s.trim());
        if (department_ids !== undefined) params.department_ids = department_ids.split(",").map((s) => Number(s.trim()));
        if (employment_type !== undefined) params.employment_type = employment_type.split(",").map((s) => s.trim());
        if (requisition_type !== undefined) params.requisition_type = requisition_type.split(",").map((s) => s.trim());
        if (recruiter_ids !== undefined) params.recruiter_ids = recruiter_ids.split(",").map((s) => Number(s.trim()));
        if (hiring_manager_ids !== undefined) params.hiring_manager_ids = hiring_manager_ids.split(",").map((s) => Number(s.trim()));
        if (office_ids !== undefined) params.office_ids = office_ids.split(",").map((s) => Number(s.trim()));
        if (job_ids !== undefined) params.job_ids = job_ids.split(",").map((s) => Number(s.trim()));
        if (created_by_ids !== undefined) params.created_by_ids = created_by_ids.split(",").map((s) => Number(s.trim()));
        const data = await client.get("/v1/requisitions", params);
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
    "get_requisition",
    {
      description:
        "Get detailed information about a specific requisition, including description and custom field values.",
      inputSchema: {
        id: z.string().describe("Requisition ID"),
      },
    },
    async ({ id }) => {
      try {
        const data = await client.get(`/v1/requisitions/${id}`);
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
    "list_requisition_fields",
    {
      description:
        "List default and custom field definitions for requisitions. Hidden fields are excluded. Optionally filter by department or office.",
      inputSchema: {
        department_id: z
          .string()
          .optional()
          .describe("Department ID to filter scoped custom fields"),
        office_ids: z
          .string()
          .optional()
          .describe("Comma-separated office IDs to filter scoped custom fields"),
      },
    },
    async ({ department_id, office_ids }) => {
      try {
        const data = await client.get("/v1/requisitions/fields", {
          department_id,
          office_ids,
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
    "create_requisition",
    {
      description:
        "Create a new requisition. When head_count exceeds 1, creates a group of linked requisitions. Use list_requisition_fields to get available custom field IDs for additional_info.",
      inputSchema: {
        head_count: z
          .number()
          .optional()
          .describe(
            "Number of positions. Set greater than 1 to generate multiple linked requisitions"
          ),
        additional_info: z
          .record(z.unknown())
          .optional()
          .describe(
            "Custom fields as key-value pairs (field ID to value). Use list_requisition_fields to get field IDs."
          ),
      },
    },
    async ({ head_count, additional_info }) => {
      try {
        const body: Record<string, unknown> = {};
        if (head_count !== undefined) body.head_count = head_count;
        if (additional_info !== undefined) body.additional_info = additional_info;
        const data = await client.post("/v1/requisitions", body);
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
    "update_requisition",
    {
      description:
        "Update an existing requisition. Cannot modify requisitions with closed, archived, or filled statuses. Pass all custom field values in additional_info — omitted fields will be cleared.",
      inputSchema: {
        id: z.string().describe("Requisition ID"),
        additional_info: z
          .record(z.unknown())
          .optional()
          .describe(
            "Custom field values as key-value pairs. Pass all values — omitted fields will be cleared."
          ),
        apply_to_group: z
          .boolean()
          .optional()
          .describe(
            "When true, updates all requisitions in the group. Defaults to false (requisition leaves the group)."
          ),
        reapproval_note: z
          .string()
          .optional()
          .describe("Note included if approval workflows trigger reapproval"),
        job_id: z
          .string()
          .nullable()
          .optional()
          .describe(
            "Associate a job or change the associated job. Set to null to remove association."
          ),
      },
    },
    async ({ id, additional_info, apply_to_group, reapproval_note, job_id }) => {
      try {
        const body: Record<string, unknown> = {};
        if (additional_info !== undefined) body.additional_info = additional_info;
        if (apply_to_group !== undefined) body.apply_to_group = apply_to_group;
        if (reapproval_note !== undefined) body.reapproval_note = reapproval_note;
        if (job_id !== undefined) body.job_id = job_id;
        const data = await client.put(`/v1/requisitions/${id}`, body);
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
    "close_requisition",
    {
      description:
        "Close a requisition. Only requisitions in a closeable state can be closed.",
      inputSchema: {
        id: z.string().describe("Requisition ID"),
        apply_to_group: z
          .boolean()
          .optional()
          .describe(
            "When true, closes all requisitions in the group. Defaults to false (removes from group before closing)."
          ),
      },
    },
    async ({ id, apply_to_group }) => {
      try {
        const body: Record<string, unknown> = {};
        if (apply_to_group !== undefined) body.apply_to_group = apply_to_group;
        const data = await client.post(`/v1/requisitions/${id}/close`, body);
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
