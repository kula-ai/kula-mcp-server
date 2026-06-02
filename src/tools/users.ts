import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { KulaClient } from "../client.js";

const VALID_SORT_BY = ["created_at", "updated_at"] as const;
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
    "list_users",
    {
      description:
        "List users in the organization. Defaults to active users; use the status filter to include pending, deactivated, or imported. Supports filtering by role, department, office, granted permissions, and a full-text query across name and email.",
      inputSchema: {
        page: z.string().optional().describe("Page number"),
        limit: z.string().optional().describe("Items per page"),
        sort_by: z.enum(VALID_SORT_BY).optional().describe("Field to sort by (default: created_at)"),
        sort_order: z.enum(VALID_SORT_ORDER).optional().describe("Sort direction"),
        status: z.string().optional().describe("Comma-separated user statuses: active, pending, deactivated, imported. Defaults to active when omitted."),
        role_id: z.string().optional().describe("Comma-separated role IDs to filter by"),
        department_id: z.string().optional().describe("Comma-separated department IDs to filter by"),
        office_id: z.string().optional().describe("Comma-separated office IDs to filter by"),
        permission: z.string().optional().describe("Comma-separated permission keys in `resource:action` format (e.g. `users:manage,jobs:read`). Matches users whose role grants any of the listed permissions."),
        query: z.string().optional().describe("Full-text search across user name and email"),
        created_after: z.string().optional().describe("ISO 8601 datetime lower bound on created_at"),
        created_before: z.string().optional().describe("ISO 8601 datetime upper bound on created_at"),
        updated_after: z.string().optional().describe("ISO 8601 datetime lower bound on updated_at"),
        updated_before: z.string().optional().describe("ISO 8601 datetime upper bound on updated_at"),
      },
    },
    async ({ page, limit, sort_by, sort_order, status, role_id, department_id, office_id, permission, query, created_after, created_before, updated_after, updated_before }) => {
      try {
        const params: Record<string, string | string[] | number[] | undefined> = {
          page, limit, sort_by, sort_order, query, created_after, created_before, updated_after, updated_before,
        };
        if (status !== undefined) params["status[]"] = csvStringArray(status);
        if (role_id !== undefined) params["role_id[]"] = csvNumberArray(role_id);
        if (department_id !== undefined) params["department_id[]"] = csvNumberArray(department_id);
        if (office_id !== undefined) params["office_id[]"] = csvNumberArray(office_id);
        if (permission !== undefined) params["permission[]"] = csvStringArray(permission);
        return okResult(await client.get("/v1/users", params));
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "get_user",
    {
      description: "Retrieve a single user by ID. Response includes a `permissions` array of `resource:action` keys granted by the user's role.",
      inputSchema: {
        id: z.string().describe("User ID"),
      },
    },
    async ({ id }) => {
      try {
        return okResult(await client.get(`/v1/users/${id}`));
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "create_user",
    {
      description:
        "Invite a new user to the account. The user is created in the pending state and sent an invitation email. Requires email and first_name.",
      inputSchema: {
        email: z.string().describe("Email address of the user"),
        first_name: z.string().describe("First name of the user"),
        role_id: z.number().optional().describe("ID of the role to assign to the user. Defaults to the Organization Member role if not specified. Use list_roles to discover valid IDs."),
        last_name: z.string().optional().describe("Last name of the user"),
        job_title: z.string().optional().describe("Job title of the user"),
        time_zone: z.string().optional().describe("IANA timezone identifier (e.g. America/Los_Angeles)"),
        department_id: z.number().optional().describe("Department to assign the user to. Use list_departments."),
        office_id: z.number().optional().describe("Office to assign the user to. Use list_offices."),
        reporting_manager_id: z.number().optional().describe("User the new user reports to. Use list_users."),
      },
    },
    async (input) => {
      try {
        return okResult(await client.post("/v1/users", input));
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "update_user",
    {
      description: "Update an existing user. Only supplied fields are modified. Email and account status cannot be changed via this endpoint.",
      inputSchema: {
        id: z.string().describe("User ID"),
        first_name: z.string().optional().describe("First name of the user"),
        last_name: z.string().optional().describe("Last name of the user"),
        job_title: z.string().optional().describe("Job title of the user (pass null-equivalent by omitting if not changing)"),
        time_zone: z.string().optional().describe("IANA timezone identifier"),
        role_id: z.number().optional().describe("ID of the role to assign to the user. Use list_roles to discover valid IDs."),
        department_id: z.number().optional().describe("Department to assign the user to"),
        office_id: z.number().optional().describe("Office to assign the user to"),
        reporting_manager_id: z.number().optional().describe("User the user reports to"),
      },
    },
    async ({ id, ...body }) => {
      try {
        return okResult(await client.patch(`/v1/users/${id}`, body));
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "deactivate_user",
    {
      description: "Deactivate a user. The user can no longer sign in but their historical activity is preserved.",
      inputSchema: {
        id: z.string().describe("User ID"),
      },
    },
    async ({ id }) => {
      try {
        return okResult(await client.post(`/v1/users/${id}/deactivate`));
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "reactivate_user",
    {
      description: "Reactivate a previously deactivated user.",
      inputSchema: {
        id: z.string().describe("User ID"),
      },
    },
    async ({ id }) => {
      try {
        return okResult(await client.post(`/v1/users/${id}/reactivate`));
      } catch (error) {
        return errorResult(error);
      }
    }
  );
}
