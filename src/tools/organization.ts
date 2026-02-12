import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { KulaClient } from "../client.js";

export function register(server: McpServer, client: KulaClient) {
  server.registerTool(
    "list_departments",
    {
      description: "List all departments in the organization as a nested tree structure.",
      inputSchema: {},
    },
    async () => {
      try {
        const data = await client.get("/v1/departments");
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
      inputSchema: {},
    },
    async () => {
      try {
        const data = await client.get("/v1/offices");
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
