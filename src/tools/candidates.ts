import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { KulaClient } from "../client.js";

export function register(server: McpServer, client: KulaClient) {
  server.registerTool(
    "create_candidate",
    {
      description: "Create a new candidate in the system.",
      inputSchema: {
        first_name: z.string().describe("Candidate's first name"),
        last_name: z.string().optional().describe("Candidate's last name"),
        email: z.string().optional().describe("Candidate's email address"),
        phone_number: z.string().optional().describe("Candidate's phone number"),
        tags: z.string().optional().describe("Comma-separated tags"),
        skills: z.string().optional().describe("Comma-separated skills"),
        job_id: z.string().optional().describe("Job ID to associate the candidate with"),
        job_stage_id: z.string().optional().describe("Job stage ID"),
        source_id: z.string().optional().describe("Candidate source ID"),
        credited_to_user_id: z.string().optional().describe("User ID to credit"),
        social_urls: z
          .array(
            z.object({
              kind: z.string().describe("Social network type (e.g. linkedin, github)"),
              url: z.string().describe("Profile URL"),
            })
          )
          .optional()
          .describe("Social profile URLs"),
        location: z
          .object({
            places_city_id: z.string().optional().describe("City ID"),
            places_state_id: z.string().optional().describe("State ID"),
            places_country_id: z.string().optional().describe("Country ID"),
          })
          .optional()
          .describe("Candidate location"),
        additional_info: z.record(z.unknown()).optional().describe("Additional custom fields"),
      },
    },
    async ({
      first_name,
      last_name,
      email,
      phone_number,
      tags,
      skills,
      job_id,
      job_stage_id,
      source_id,
      credited_to_user_id,
      social_urls,
      location,
      additional_info,
    }) => {
      try {
        const body: Record<string, unknown> = { first_name };
        if (last_name !== undefined) body.last_name = last_name;
        if (email !== undefined) body.email = email;
        if (phone_number !== undefined) body.phone_number = phone_number;
        if (tags !== undefined) body.tags = tags.split(",").map((s) => s.trim()).filter(Boolean);
        if (skills !== undefined) body.skills = skills.split(",").map((s) => s.trim()).filter(Boolean);
        if (job_id !== undefined) body.job_id = Number(job_id);
        if (job_stage_id !== undefined) body.job_stage_id = Number(job_stage_id);
        if (source_id !== undefined) body.source_id = Number(source_id);
        if (credited_to_user_id !== undefined) body.credited_to_user_id = Number(credited_to_user_id);
        if (social_urls !== undefined) body.social_urls = social_urls;
        if (location !== undefined) {
          body.location = {
            ...(location.places_city_id !== undefined && { places_city_id: Number(location.places_city_id) }),
            ...(location.places_state_id !== undefined && { places_state_id: Number(location.places_state_id) }),
            ...(location.places_country_id !== undefined && { places_country_id: Number(location.places_country_id) }),
          };
        }
        if (additional_info !== undefined) body.additional_info = additional_info;

        const data = await client.post("/v1/candidates", body);
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
    "list_candidates",
    {
      description: "List and search candidates — supports keyword search via `query`, plus filters (email, date ranges). Only use when the user explicitly asks about candidates.",
      inputSchema: {
        query: z.string().optional().describe("Search query to find candidates by name or keyword"),
        page: z.string().optional().describe("Page number"),
        limit: z.string().optional().describe("Items per page"),
        email: z.string().optional().describe("Filter by email address"),
        sort_by: z.string().optional().describe("Field to sort by"),
        sort_order: z.enum(["asc", "desc"]).optional().describe("Sort direction"),
        created_after: z.string().optional().describe("Filter by created date (ISO 8601, inclusive lower bound)"),
        created_before: z.string().optional().describe("Filter by created date (ISO 8601, inclusive upper bound)"),
        updated_after: z.string().optional().describe("Filter by updated date (ISO 8601, inclusive lower bound)"),
        updated_before: z.string().optional().describe("Filter by updated date (ISO 8601, inclusive upper bound)"),
      },
    },
    async ({ query, page, limit, email, sort_by, sort_order, created_after, created_before, updated_after, updated_before }) => {
      try {
        const data = await client.get("/v1/candidates", {
          query,
          page,
          limit,
          email,
          sort_by,
          sort_order,
          created_after,
          created_before,
          updated_after,
          updated_before,
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
    "update_candidate",
    {
      description: "Update an existing candidate's profile.",
      inputSchema: {
        id: z.string().describe("Candidate ID"),
        first_name: z.string().optional().describe("Candidate's first name"),
        last_name: z.string().optional().describe("Candidate's last name"),
        email: z.string().optional().describe("Candidate's email address"),
        phone_number: z.string().optional().describe("Candidate's phone number"),
        title: z.string().optional().describe("Candidate's job title"),
        tags: z.string().optional().describe("Comma-separated tags"),
        skills: z.string().optional().describe("Comma-separated skills"),
        source_id: z.string().optional().describe("Candidate source ID"),
        social_urls: z
          .array(
            z.object({
              kind: z.string().describe("Social network type (e.g. linkedin, github)"),
              url: z.string().describe("Profile URL"),
            })
          )
          .optional()
          .describe("Social profile URLs"),
        location: z
          .object({
            places_city_id: z.string().optional().describe("City ID"),
            places_state_id: z.string().optional().describe("State ID"),
            places_country_id: z.string().optional().describe("Country ID"),
          })
          .optional()
          .describe("Candidate location"),
        additional_info: z.record(z.unknown()).optional().describe("Additional custom fields"),
      },
    },
    async ({ id, first_name, last_name, email, phone_number, title, tags, skills, source_id, social_urls, location, additional_info }) => {
      try {
        const body: Record<string, unknown> = {};
        if (first_name !== undefined) body.first_name = first_name;
        if (last_name !== undefined) body.last_name = last_name;
        if (email !== undefined) body.email = email;
        if (phone_number !== undefined) body.phone_number = phone_number;
        if (title !== undefined) body.title = title;
        if (tags !== undefined) body.tags = tags.split(",").map((s) => s.trim()).filter(Boolean);
        if (skills !== undefined) body.skills = skills.split(",").map((s) => s.trim()).filter(Boolean);
        if (source_id !== undefined) body.source_id = Number(source_id);
        if (social_urls !== undefined) body.social_urls = social_urls;
        if (location !== undefined) {
          body.location = {
            ...(location.places_city_id !== undefined && { places_city_id: Number(location.places_city_id) }),
            ...(location.places_state_id !== undefined && { places_state_id: Number(location.places_state_id) }),
            ...(location.places_country_id !== undefined && { places_country_id: Number(location.places_country_id) }),
          };
        }
        if (additional_info !== undefined) body.additional_info = additional_info;

        const data = await client.patch(`/v1/candidates/${id}`, body);
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
    "get_candidate",
    {
      description: "Get details of a specific candidate. Only use when the user asks about a specific candidate.",
      inputSchema: {
        id: z.string().describe("Candidate ID"),
      },
    },
    async ({ id }) => {
      try {
        const data = await client.get(`/v1/candidates/${id}`);
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
