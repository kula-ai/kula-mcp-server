import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { KulaClient } from "../client.js";

// ATS public API lookup tools. Each resolves IDs accepted by other endpoints
// (candidate create/search, requisition create, interview create, etc.).
// Distinct from src/tools/autocomplete.ts which targets the job-boards API.
export function register(server: McpServer, client: KulaClient) {
  server.registerTool(
    "find_locations",
    {
      description:
        "Search cities, states, and countries. The returned `type` discriminator (city|state|country) tells you which `places_*_id` field on candidate endpoints the `id` maps to. City results also include `state_id` and `country_id` (parent chain); State results include `country_id`; Country results have both as null.",
      inputSchema: {
        query: z
          .string()
          .describe("Search query — matched against the place's full address"),
        page: z.string().optional().describe("Page number (default: 1)"),
        limit: z.string().optional().describe("Items per page, max 100 (default: 20)"),
      },
    },
    async ({ query, page, limit }) => {
      try {
        const data = await client.get("/v1/locations", { query, page, limit });
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
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
    },
  );

  server.registerTool(
    "find_companies",
    {
      description:
        "Search the global company catalog. Returned IDs map to `current_company_ids` on candidate search.",
      inputSchema: {
        query: z.string().describe("Search query — matched against company name"),
        page: z.string().optional().describe("Page number (default: 1)"),
        limit: z.string().optional().describe("Items per page, max 100 (default: 20)"),
      },
    },
    async ({ query, page, limit }) => {
      try {
        const data = await client.get("/v1/companies", { query, page, limit });
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
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
    },
  );

  server.registerTool(
    "find_industries",
    {
      description:
        "List industries used to classify companies. Paginated; useful for discovering valid industry options.",
      inputSchema: {
        page: z.string().optional().describe("Page number (default: 1)"),
        limit: z.string().optional().describe("Items per page, max 100 (default: 20)"),
      },
    },
    async ({ page, limit }) => {
      try {
        const data = await client.get("/v1/industries", { page, limit });
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
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
    },
  );

  server.registerTool(
    "find_institutions",
    {
      description:
        "Search academic institutions. Returned IDs map to `institute_ids` on candidate search.",
      inputSchema: {
        query: z
          .string()
          .describe("Search query — matched against institution name"),
        page: z.string().optional().describe("Page number (default: 1)"),
        limit: z.string().optional().describe("Items per page, max 100 (default: 20)"),
      },
    },
    async ({ query, page, limit }) => {
      try {
        const data = await client.get("/v1/institutions", { query, page, limit });
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
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
    },
  );

  server.registerTool(
    "find_disciplines",
    {
      description: "Search academic disciplines (fields of study).",
      inputSchema: {
        query: z.string().describe("Search query — matched against discipline name"),
        page: z.string().optional().describe("Page number (default: 1)"),
        limit: z.string().optional().describe("Items per page, max 100 (default: 20)"),
      },
    },
    async ({ query, page, limit }) => {
      try {
        const data = await client.get("/v1/disciplines", { query, page, limit });
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
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
    },
  );

  server.registerTool(
    "find_degrees",
    {
      description:
        "List academic degrees, optionally filtered by name. Useful for discovering valid degree options for candidate education records.",
      inputSchema: {
        query: z.string().optional().describe("Optional search term to filter degrees by name"),
        page: z.string().optional().describe("Page number (default: 1)"),
        limit: z.string().optional().describe("Items per page, max 100 (default: 20)"),
      },
    },
    async ({ query, page, limit }) => {
      try {
        const data = await client.get("/v1/degrees", { query, page, limit });
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
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
    },
  );

  server.registerTool(
    "find_tags",
    {
      description:
        "Search candidate tags (account-scoped). Returned IDs map to `tag_ids` on candidate search.",
      inputSchema: {
        query: z.string().describe("Search query — matched against tag name"),
        page: z.string().optional().describe("Page number (default: 1)"),
        limit: z.string().optional().describe("Items per page, max 100 (default: 20)"),
      },
    },
    async ({ query, page, limit }) => {
      try {
        const data = await client.get("/v1/tags", { query, page, limit });
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
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
    },
  );

  server.registerTool(
    "find_skills",
    {
      description:
        "Search the global skill catalog. Returned IDs map to `skill_ids` on candidate search.",
      inputSchema: {
        query: z.string().describe("Search query — matched against skill name"),
        page: z.string().optional().describe("Page number (default: 1)"),
        limit: z.string().optional().describe("Items per page, max 100 (default: 20)"),
      },
    },
    async ({ query, page, limit }) => {
      try {
        const data = await client.get("/v1/skills", { query, page, limit });
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
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
    },
  );

  server.registerTool(
    "find_currencies",
    {
      description:
        "List currencies. Returned IDs map to `salary_currency_id` on requisitions.",
      inputSchema: {
        page: z.string().optional().describe("Page number (default: 1)"),
        limit: z.string().optional().describe("Items per page, max 100 (default: 20)"),
      },
    },
    async ({ page, limit }) => {
      try {
        const data = await client.get("/v1/currencies", { page, limit });
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
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
    },
  );
}
