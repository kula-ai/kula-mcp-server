import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { KulaClient } from "../client.js";

export function register(server: McpServer, client: KulaClient) {
  server.registerTool(
    "list_departments",
    {
      description: "List all departments as a flat paginated list. Each record has a parent_id to reconstruct the hierarchy client-side.",
      inputSchema: {
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
    async ({ page, limit, sort_by, sort_order, created_after, created_before, updated_after, updated_before }) => {
      try {
        const data = await client.get("/v1/departments", { page, limit, sort_by, sort_order, created_after, created_before, updated_after, updated_before });
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
    "list_offices",
    {
      description: "List all offices in the organization.",
      inputSchema: {
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
    async ({ page, limit, sort_by, sort_order, created_after, created_before, updated_after, updated_before }) => {
      try {
        const data = await client.get("/v1/offices", { page, limit, sort_by, sort_order, created_after, created_before, updated_after, updated_before });
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
    "list_milestones",
    {
      description: "List all hiring milestones (pipeline stage groupings) in the organization.",
      inputSchema: {
        page: z.string().optional().describe("Page number"),
        limit: z.string().optional().describe("Items per page"),
        sort_by: z.enum(["created_at", "updated_at"]).optional().describe("Field to sort by (default: created_at)"),
        sort_order: z.enum(["asc", "desc"]).optional().describe("Sort direction"),
        created_after: z.string().optional().describe("Filter by created date (ISO 8601, inclusive lower bound)"),
        created_before: z.string().optional().describe("Filter by created date (ISO 8601, inclusive upper bound)"),
        updated_after: z.string().optional().describe("Filter by updated date (ISO 8601, inclusive lower bound)"),
        updated_before: z.string().optional().describe("Filter by updated date (ISO 8601, inclusive upper bound)"),
      },
    },
    async ({ page, limit, sort_by, sort_order, created_after, created_before, updated_after, updated_before }) => {
      try {
        const params: Record<string, string | undefined> = { page, limit, sort_by, sort_order, created_after, created_before, updated_after, updated_before };
        const data = await client.get("/v1/milestones", params);
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
    "list_custom_fields",
    {
      description: "List custom fields configured in the organization. The type parameter is required — specify job, candidate, requisition, or offer.",
      inputSchema: {
        type: z
          .enum(["job", "candidate", "requisition", "offer"])
          .describe("Subject type to filter by: job, candidate, requisition, or offer"),
        page: z.string().optional().describe("Page number"),
        limit: z.string().optional().describe("Items per page"),
        sort_by: z.enum(["created_at", "updated_at"]).optional().describe("Field to sort by (default: created_at)"),
        sort_order: z.enum(["asc", "desc"]).optional().describe("Sort direction (default: desc)"),
        created_after: z.string().optional().describe("Filter by created date (ISO 8601, inclusive lower bound)"),
        created_before: z.string().optional().describe("Filter by created date (ISO 8601, inclusive upper bound)"),
        updated_after: z.string().optional().describe("Filter by updated date (ISO 8601, inclusive lower bound)"),
        updated_before: z.string().optional().describe("Filter by updated date (ISO 8601, inclusive upper bound)"),
        department_ids: z.string().optional().describe("Comma-separated department IDs — returns fields that apply to any of these departments and fields with no department restriction"),
        office_ids: z.string().optional().describe("Comma-separated office IDs — returns fields that apply to any of these offices and fields with no office restriction"),
      },
    },
    async ({ type, page, limit, sort_by, sort_order, created_after, created_before, updated_after, updated_before, department_ids, office_ids }) => {
      try {
        const params: Record<string, string | number | boolean | string[] | number[] | undefined> = { type, page, limit, sort_by, sort_order, created_after, created_before, updated_after, updated_before };
        if (department_ids !== undefined) params["department_ids[]"] = department_ids.split(",").map(Number);
        if (office_ids !== undefined) params["office_ids[]"] = office_ids.split(",").map(Number);
        const data = await client.get("/v1/custom-fields", params);
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
    "list_rejection_reasons",
    {
      description: "List all rejection reasons configured in the organization.",
      inputSchema: {
        page: z.string().optional().describe("Page number"),
        limit: z.string().optional().describe("Items per page"),
        sort_by: z.enum(["created_at", "updated_at"]).optional().describe("Field to sort by (default: created_at)"),
        sort_order: z.enum(["asc", "desc"]).optional().describe("Sort direction (default: desc)"),
        created_after: z.string().optional().describe("Filter by created date (ISO 8601, inclusive lower bound)"),
        created_before: z.string().optional().describe("Filter by created date (ISO 8601, inclusive upper bound)"),
        updated_after: z.string().optional().describe("Filter by updated date (ISO 8601, inclusive lower bound)"),
        updated_before: z.string().optional().describe("Filter by updated date (ISO 8601, inclusive upper bound)"),
        enabled: z.enum(["true", "false"]).optional().describe("Filter by enabled status"),
        group: z.string().optional().describe("Filter by rejection reason group"),
      },
    },
    async ({ page, limit, sort_by, sort_order, created_after, created_before, updated_after, updated_before, enabled, group }) => {
      try {
        const params: Record<string, string | boolean | undefined> = { page, limit, sort_by, sort_order, created_after, created_before, updated_after, updated_before, group };
        if (enabled !== undefined) params.enabled = enabled === "true";
        const data = await client.get("/v1/rejection-reasons", params);
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
    "list_sources",
    {
      description: "List all candidate sources in the organization.",
      inputSchema: {
        page: z.string().optional().describe("Page number"),
        limit: z.string().optional().describe("Items per page"),
        enabled: z.enum(["true", "false"]).optional().describe("Filter by enabled status"),
        sort_by: z.enum(["created_at", "updated_at"]).optional().describe("Field to sort by (default: created_at)"),
        sort_order: z.enum(["asc", "desc"]).optional().describe("Sort direction (default: desc)"),
        created_after: z.string().optional().describe("Filter by created date (ISO 8601, inclusive lower bound)"),
        created_before: z.string().optional().describe("Filter by created date (ISO 8601, inclusive upper bound)"),
        updated_after: z.string().optional().describe("Filter by updated date (ISO 8601, inclusive lower bound)"),
        updated_before: z.string().optional().describe("Filter by updated date (ISO 8601, inclusive upper bound)"),
      },
    },
    async ({ page, limit, enabled, sort_by, sort_order, created_after, created_before, updated_after, updated_before }) => {
      try {
        const params: Record<string, string | boolean | undefined> = { page, limit, sort_by, sort_order, created_after, created_before, updated_after, updated_before };
        if (enabled !== undefined) params.enabled = enabled === "true";
        const data = await client.get("/v1/candidate-sources", params);
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
    "list_users",
    {
      description: "List users in the organization. Defaults to active users. Use the status filter to include pending, deactivated, or imported users.",
      inputSchema: {
        page: z.string().optional().describe("Page number"),
        limit: z.string().optional().describe("Items per page"),
        sort_by: z.enum(["created_at", "updated_at"]).optional().describe("Field to sort by (default: created_at)"),
        sort_order: z.enum(["asc", "desc"]).optional().describe("Sort direction"),
        status: z.string().optional().describe("Comma-separated user statuses to filter by: active, pending, deactivated, imported. Defaults to active when omitted."),
        role: z.string().optional().describe("Comma-separated user roles to filter by: owner, admin, recruiter, hiring_manager, employee, external_collaborator. Multiple values are OR'd together. Useful for resolving primary_recruiter_ids or hiring_manager_ids on jobs / requisitions / interviews."),
        created_after: z.string().optional().describe("Filter by created date (ISO 8601, inclusive lower bound)"),
        created_before: z.string().optional().describe("Filter by created date (ISO 8601, inclusive upper bound)"),
        updated_after: z.string().optional().describe("Filter by updated date (ISO 8601, inclusive lower bound)"),
        updated_before: z.string().optional().describe("Filter by updated date (ISO 8601, inclusive upper bound)"),
      },
    },
    async ({ page, limit, sort_by, sort_order, status, role, created_after, created_before, updated_after, updated_before }) => {
      try {
        const params: Record<string, string | string[] | undefined> = { page, limit, sort_by, sort_order, created_after, created_before, updated_after, updated_before };
        if (status !== undefined) params["status[]"] = status.split(",").map((s) => s.trim());
        if (role !== undefined) params["role[]"] = role.split(",").map((s) => s.trim());
        const data = await client.get("/v1/users", params);
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
