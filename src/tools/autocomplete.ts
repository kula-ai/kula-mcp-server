import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { KulaClient } from "../client.js";

export function register(server: McpServer, client: KulaClient) {
  server.registerTool(
    "search_companies",
    {
      description: "Search companies by name. Useful for autocompleting company names or resolving company IDs.",
      inputSchema: {
        query: z.string().describe("Search term for company name (required, 1-255 chars)"),
        page: z.string().optional().describe("Page number (default: 1)"),
        limit: z.string().optional().describe("Items per page, max 100 (default: 20)"),
      },
    },
    async ({ query, page, limit }) => {
      try {
        const data = await client.get("/v1/companies", { query, page, limit });
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
      description: "List the company industry taxonomy. Use this to resolve industry IDs for company creation or filtering.",
      inputSchema: {
        page: z.string().optional().describe("Page number (default: 1)"),
        limit: z.string().optional().describe("Items per page, max 100 (default: 20)"),
      },
    },
    async ({ page, limit }) => {
      try {
        const data = await client.get("/v1/industries", { page, limit });
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
      description: "Search cities, states, and countries by name. Returns a polymorphic mix with a `type` discriminator (city|state|country) and parent-chain IDs (state_id, country_id) when applicable.",
      inputSchema: {
        query: z.string().describe("Search term for city, state, or country name (required, 1-255 chars)"),
        page: z.string().optional().describe("Page number (default: 1)"),
        limit: z.string().optional().describe("Items per page, max 100 (default: 20)"),
      },
    },
    async ({ query, page, limit }) => {
      try {
        const data = await client.get("/v1/locations", { query, page, limit });
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
      description: "Search academic institutions (universities, schools) by name.",
      inputSchema: {
        query: z.string().describe("Search term for institution name (required, 1-255 chars)"),
        page: z.string().optional().describe("Page number (default: 1)"),
        limit: z.string().optional().describe("Items per page, max 100 (default: 20)"),
      },
    },
    async ({ query, page, limit }) => {
      try {
        const data = await client.get("/v1/institutions", { query, page, limit });
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
      description: "Search academic disciplines (fields of study) by name.",
      inputSchema: {
        query: z.string().describe("Search term for discipline name (required, 1-255 chars)"),
        page: z.string().optional().describe("Page number (default: 1)"),
        limit: z.string().optional().describe("Items per page, max 100 (default: 20)"),
      },
    },
    async ({ query, page, limit }) => {
      try {
        const data = await client.get("/v1/disciplines", { query, page, limit });
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
      description: "List academic degree types. Use this to resolve degree IDs for candidate education entries.",
      inputSchema: {
        page: z.string().optional().describe("Page number (default: 1)"),
        limit: z.string().optional().describe("Items per page, max 100 (default: 20)"),
      },
    },
    async ({ page, limit }) => {
      try {
        const data = await client.get("/v1/degrees", { page, limit });
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
    "search_tags",
    {
      description: "Search candidate tags by name. Tags are account-scoped — results are limited to tags created within the calling account.",
      inputSchema: {
        query: z.string().describe("Search term for tag name (required, 1-255 chars)"),
        page: z.string().optional().describe("Page number (default: 1)"),
        limit: z.string().optional().describe("Items per page, max 100 (default: 20)"),
      },
    },
    async ({ query, page, limit }) => {
      try {
        const data = await client.get("/v1/tags", { query, page, limit });
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
    "search_skills",
    {
      description: "Search skills by name from the global skill catalog.",
      inputSchema: {
        query: z.string().describe("Search term for skill name (required, 1-255 chars)"),
        page: z.string().optional().describe("Page number (default: 1)"),
        limit: z.string().optional().describe("Items per page, max 100 (default: 20)"),
      },
    },
    async ({ query, page, limit }) => {
      try {
        const data = await client.get("/v1/skills", { query, page, limit });
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
    "list_currencies",
    {
      description: "List ISO currencies. Use this to resolve currency IDs for requisition salary fields (`salary_currency_id`).",
      inputSchema: {
        page: z.string().optional().describe("Page number (default: 1)"),
        limit: z.string().optional().describe("Items per page, max 100 (default: 20)"),
      },
    },
    async ({ page, limit }) => {
      try {
        const data = await client.get("/v1/currencies", { page, limit });
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
