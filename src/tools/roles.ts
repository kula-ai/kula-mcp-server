import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { KulaClient } from "../client.js";

const VALID_SORT_BY = ["created_at", "updated_at"] as const;
const VALID_SORT_ORDER = ["asc", "desc"] as const;

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
    "list_roles",
    {
      description: "List roles available in the account. Use this to discover valid org_role_id values for create_user and update_user.",
      inputSchema: {
        page: z.string().optional().describe("Page number"),
        limit: z.string().optional().describe("Items per page"),
        sort_by: z.enum(VALID_SORT_BY).optional().describe("Field to sort by (default: created_at)"),
        sort_order: z.enum(VALID_SORT_ORDER).optional().describe("Sort direction"),
        created_after: z.string().optional().describe("ISO 8601 datetime lower bound on created_at"),
        created_before: z.string().optional().describe("ISO 8601 datetime upper bound on created_at"),
        updated_after: z.string().optional().describe("ISO 8601 datetime lower bound on updated_at"),
        updated_before: z.string().optional().describe("ISO 8601 datetime upper bound on updated_at"),
      },
    },
    async (params) => {
      try {
        return okResult(await client.get("/v1/roles", params));
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "get_role",
    {
      description: "Retrieve a single role by ID. The response includes a permissions object mapping each permission key to a boolean indicating whether it is granted by this role.",
      inputSchema: {
        id: z.string().describe("Role ID"),
      },
    },
    async ({ id }) => {
      try {
        return okResult(await client.get(`/v1/roles/${id}`));
      } catch (error) {
        return errorResult(error);
      }
    }
  );
}
