import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { KulaClient } from "../client.js";

export function register(server: McpServer, client: KulaClient) {
  server.registerTool(
    "search_companies",
    {
      description: "Search companies by name. Useful for autocompleting company names.",
      inputSchema: {
        query: z.string().describe("Search query for company name"),
      },
    },
    async ({ query }) => {
      try {
        const data = await client.get("/v1/autocomplete/companies", {
          q: query,
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
    "list_industries",
    {
      description: "List all available industries.",
      inputSchema: {},
    },
    async () => {
      try {
        const data = await client.get("/v1/autocomplete/industries");
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
    "search_locations",
    {
      description: "Search locations by query. Useful for autocompleting city or region names.",
      inputSchema: {
        query: z.string().describe("Search query for location"),
      },
    },
    async ({ query }) => {
      try {
        const data = await client.get("/v1/autocomplete/locations", {
          q: query,
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
    "search_institutions",
    {
      description: "Search academic institutions by name. Useful for autocompleting university or school names.",
      inputSchema: {
        query: z.string().describe("Search query for institution name"),
      },
    },
    async ({ query }) => {
      try {
        const data = await client.get("/v1/autocomplete/institutions", {
          q: query,
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
    "search_disciplines",
    {
      description: "Search academic disciplines by name. Useful for autocompleting field of study.",
      inputSchema: {
        query: z.string().describe("Search query for discipline"),
      },
    },
    async ({ query }) => {
      try {
        const data = await client.get("/v1/autocomplete/disciplines", {
          q: query,
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
    "list_degrees",
    {
      description: "List all available academic degrees.",
      inputSchema: {},
    },
    async () => {
      try {
        const data = await client.get("/v1/autocomplete/degrees");
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
