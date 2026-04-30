import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { KulaClient } from "../client.js";

export function register(server: McpServer, client: KulaClient) {
  server.registerTool(
    "create_candidate",
    {
      description:
        "Create a new candidate in Kula. At least one of email or linkedin_url (in social_urls) is required. " +
        "Optionally link to a job pipeline via job_id and job_stage_id. Returns the created candidate object.",
      inputSchema: {
        first_name: z.string().describe("Candidate's first name (required)"),
        last_name: z.string().optional().describe("Candidate's last name"),
        email: z.string().optional().describe("Candidate's email address. Required unless linkedin_url is provided."),
        phone_number: z.string().optional().describe("Candidate's phone number"),
        tags: z.string().optional().describe("Comma-separated tag names to attach"),
        skills: z.string().optional().describe("Comma-separated skill names to attach"),
        job_id: z.string().optional().describe("Job ID to add this candidate to a pipeline"),
        job_stage_id: z.string().optional().describe("Stage ID within the job pipeline (use with job_id)"),
        source_id: z.string().optional().describe("Source ID — get IDs from list_sources"),
        credited_to_user_id: z.string().optional().describe("User ID to credit for this candidate"),
        social_urls: z
          .array(
            z.object({
              kind: z.string().describe("Network type: linkedin, github, twitter, etc."),
              url: z.string().describe("Profile URL"),
            })
          )
          .optional()
          .describe("Social profile URLs. Include linkedin here if not providing email."),
        location: z
          .object({
            places_city_id: z.string().optional().describe("City ID"),
            places_state_id: z.string().optional().describe("State ID"),
            places_country_id: z.string().optional().describe("Country ID"),
          })
          .optional()
          .describe("Candidate location using places IDs"),
        additional_info: z.record(z.unknown()).optional().describe("Custom field values as key-value pairs"),
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
        if (tags !== undefined) body.tags = tags;
        if (skills !== undefined) body.skills = skills;
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
      description:
        "List candidates with simple filters: email, date ranges, and sorting. " +
        "Use this for browsing or filtering by exact email. " +
        "For full-text search or filtering by skills, tags, location, job pipeline, or resume presence — use search_candidates instead.",
      inputSchema: {
        page: z.string().optional().describe("Page number (default: 1)"),
        limit: z.string().optional().describe("Items per page (default: 20, max: 100)"),
        email: z.string().optional().describe("Filter by exact email address"),
        sort_by: z.enum(["created_at", "updated_at"]).optional().describe("Field to sort by (default: created_at)"),
        sort_order: z.enum(["asc", "desc"]).optional().describe("Sort direction (default: desc)"),
        created_after: z.string().optional().describe("Return candidates created on or after this ISO 8601 datetime"),
        created_before: z.string().optional().describe("Return candidates created on or before this ISO 8601 datetime"),
        updated_after: z.string().optional().describe("Return candidates updated on or after this ISO 8601 datetime"),
        updated_before: z.string().optional().describe("Return candidates updated on or before this ISO 8601 datetime"),
      },
    },
    async ({ page, limit, email, sort_by, sort_order, created_after, created_before, updated_after, updated_before }) => {
      try {
        const data = await client.get("/v1/candidates", {
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
    "search_candidates",
    {
      description:
        "Search candidates using Elasticsearch with rich filters and cursor-based pagination. " +
        "Preferred over list_candidates when you need: full-text search (name, email, resume), " +
        "filtering by skills, tags, sources, job pipeline, location, or resume presence. " +
        "Pagination: pass cursor from the previous response meta.next_cursor to get the next page. " +
        "IMPORTANT: if you change any filter or search parameter, omit cursor and start a new request — " +
        "cursors are tied to a specific search context and will return wrong results if filters change.",
      inputSchema: {
        cursor: z
          .string()
          .optional()
          .describe(
            "Pagination cursor from the previous response meta.next_cursor. " +
            "Omit this field entirely when changing any filter — cursors are bound to a specific search context."
          ),
        query: z.string().optional().describe("Full-text search across name, email, phone number, and resume text"),
        skill_ids: z.array(z.string()).optional().describe("Filter by skill IDs — returns candidates who have ALL of these skills"),
        tag_ids: z.array(z.string()).optional().describe("Filter by tag IDs — returns candidates who have ANY of these tags"),
        source_ids: z.array(z.string()).optional().describe("Filter by source IDs — get IDs from list_sources"),
        job_ids: z.array(z.string()).optional().describe("Filter by job IDs — returns candidates who have applied to these jobs"),
        has_resume: z.boolean().optional().describe("true = only candidates with a resume; false = only without"),
        country_id: z.string().optional().describe("Filter by country ID"),
        state_id: z.string().optional().describe("Filter by state/province ID"),
        city_id: z.string().optional().describe("Filter by city ID"),
        page: z.string().optional().describe("Page number (default: 1)"),
        limit: z.enum(["20", "50", "100"]).optional().describe("Items per page — must be 20, 50, or 100 (default: 20)"),
      },
    },
    async ({ cursor, query, skill_ids, tag_ids, source_ids, job_ids, has_resume, country_id, state_id, city_id, page, limit }) => {
      try {
        const body: Record<string, unknown> = {};
        if (cursor !== undefined) body.cursor = cursor;
        if (query !== undefined) body.query = query;
        if (skill_ids !== undefined) body.skill_ids = skill_ids.map(Number).filter((n) => !isNaN(n));
        if (tag_ids !== undefined) body.tag_ids = tag_ids.map(Number).filter((n) => !isNaN(n));
        if (source_ids !== undefined) body.source_ids = source_ids.map(Number).filter((n) => !isNaN(n));
        if (job_ids !== undefined) body.job_ids = job_ids.map(Number).filter((n) => !isNaN(n));
        if (has_resume !== undefined) body.has_resume = has_resume;
        if (country_id !== undefined) body.country_id = Number(country_id);
        if (state_id !== undefined) body.state_id = Number(state_id);
        if (city_id !== undefined) body.city_id = Number(city_id);
        if (page !== undefined) body.page = Number(page);
        if (limit !== undefined) body.limit = Number(limit);

        const data = await client.post("/v1/candidates/search", body);
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
      description:
        "Retrieve full details of a specific candidate by ID, including all applications, tags, skills, and location. " +
        "Use this when you already have the candidate ID. To find a candidate by name or attributes, use search_candidates first.",
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

  server.registerTool(
    "update_candidate",
    {
      description:
        "Update an existing candidate's profile. All fields are optional — only send the fields you want to change. " +
        "Returns the updated candidate object.",
      inputSchema: {
        id: z.string().describe("Candidate ID to update"),
        first_name: z.string().optional().describe("Candidate's first name"),
        last_name: z.string().optional().describe("Candidate's last name"),
        email: z.string().optional().describe("Candidate's email address"),
        phone_number: z.string().optional().describe("Candidate's phone number"),
        title: z.string().optional().describe("Candidate's current job title"),
        tags: z.string().optional().describe("Comma-separated tag names (replaces existing tags)"),
        skills: z.string().optional().describe("Comma-separated skill names (replaces existing skills)"),
        source_id: z.string().optional().describe("Source ID — get IDs from list_sources"),
        social_urls: z
          .array(
            z.object({
              kind: z.string().describe("Network type: linkedin, github, twitter, etc."),
              url: z.string().describe("Profile URL"),
            })
          )
          .optional()
          .describe("Social profile URLs (replaces existing social URLs)"),
        location: z
          .object({
            places_city_id: z.string().optional().describe("City ID"),
            places_state_id: z.string().optional().describe("State ID"),
            places_country_id: z.string().optional().describe("Country ID"),
          })
          .optional()
          .describe("Candidate location using places IDs"),
        additional_info: z.record(z.unknown()).optional().describe("Custom field values as key-value pairs"),
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
        if (tags !== undefined) body.tags = tags;
        if (skills !== undefined) body.skills = skills;
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
}
