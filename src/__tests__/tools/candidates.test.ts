import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { register } from "../../tools/candidates.js";
import { createMockClient, setupMcpTest } from "../helpers.js";
import type { KulaClient } from "../../client.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

describe("candidates tools", () => {
  let client: Client;
  let mockKula: KulaClient;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    mockKula = createMockClient();
    const setup = await setupMcpTest(register, mockKula);
    client = setup.client;
    cleanup = setup.cleanup;
  });

  afterAll(async () => {
    await cleanup();
  });

  describe("create_candidate", () => {
    it("sends required and optional fields", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        id: "cand-1",
      });

      const result = await client.callTool({
        name: "create_candidate",
        arguments: {
          first_name: "Jane",
          last_name: "Doe",
          email: "jane@example.com",
          job_id: "123",
        },
      });

      expect(mockKula.post).toHaveBeenCalledWith("/v1/candidates", {
        first_name: "Jane",
        last_name: "Doe",
        email: "jane@example.com",
        job_id: 123,
      });
      expect(result.isError).toBeFalsy();
    });

    it("sends only required fields when optionals omitted", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        id: "cand-2",
      });

      await client.callTool({
        name: "create_candidate",
        arguments: { first_name: "John" },
      });

      expect(mockKula.post).toHaveBeenCalledWith("/v1/candidates", {
        first_name: "John",
      });
    });

    it("sends all optional fields when provided", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        id: "cand-4",
      });

      await client.callTool({
        name: "create_candidate",
        arguments: {
          first_name: "Full",
          last_name: "Test",
          email: "full@example.com",
          phone_number: "+1234567890",
          tags: "tag1,tag2",
          skills: "skill1,skill2",
          job_id: "1",
          job_stage_id: "2",
          source_id: "3",
          credited_to_user_id: "4",
          social_urls: [
            { kind: "linkedin", url: "https://linkedin.com/in/test" },
          ],
          location: { places_city_id: "123", places_state_id: "456", places_country_id: "789" },
          additional_info: { custom: "value" },
        },
      });

      expect(mockKula.post).toHaveBeenCalledWith("/v1/candidates", {
        first_name: "Full",
        last_name: "Test",
        email: "full@example.com",
        phone_number: "+1234567890",
        tags: "tag1,tag2",
        skills: "skill1,skill2",
        job_id: 1,
        job_stage_id: 2,
        source_id: 3,
        credited_to_user_id: 4,
        social_urls: [
          { kind: "linkedin", url: "https://linkedin.com/in/test" },
        ],
        location: { places_city_id: 123, places_state_id: 456, places_country_id: 789 },
        additional_info: { custom: "value" },
      });
    });

    it("converts numeric string fields to numbers", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        id: "cand-3",
      });

      await client.callTool({
        name: "create_candidate",
        arguments: {
          first_name: "Test",
          job_id: "10",
          job_stage_id: "20",
          source_id: "30",
          credited_to_user_id: "40",
        },
      });

      expect(mockKula.post).toHaveBeenCalledWith("/v1/candidates", {
        first_name: "Test",
        job_id: 10,
        job_stage_id: 20,
        source_id: 30,
        credited_to_user_id: 40,
      });
    });
  });

  describe("list_candidates", () => {
    it("passes filter params to client", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [{ id: "cand-1" }],
      });

      const result = await client.callTool({
        name: "list_candidates",
        arguments: { page: "1", limit: "10", email: "jane@example.com" },
      });

      expect(mockKula.get).toHaveBeenCalledWith("/v1/candidates", {
        page: "1",
        limit: "10",
        email: "jane@example.com",
        sort_by: undefined,
        sort_order: undefined,
        created_after: undefined,
        created_before: undefined,
        updated_after: undefined,
        updated_before: undefined,
      });
      expect(result.isError).toBeFalsy();
    });

    it("works with no params", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [],
      });

      const result = await client.callTool({
        name: "list_candidates",
        arguments: {},
      });
      expect(result.isError).toBeFalsy();
    });
  });

  describe("search_candidates", () => {
    it("posts to search endpoint with no filters", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [],
        meta: { total: 0 },
      });

      const result = await client.callTool({
        name: "search_candidates",
        arguments: {},
      });

      expect(mockKula.post).toHaveBeenCalledWith("/v1/candidates/search", {});
      expect(result.isError).toBeFalsy();
    });

    it("passes query for full-text search", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

      await client.callTool({ name: "search_candidates", arguments: { query: "Jane" } });

      const call = (mockKula.post as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[1].query).toBe("Jane");
    });

    it("converts comma-separated skill_ids, tag_ids, source_ids, job_ids to number arrays", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

      await client.callTool({
        name: "search_candidates",
        arguments: { skill_ids: "1,2", tag_ids: "3", source_ids: "4", job_ids: "5,6" },
      });

      const call = (mockKula.post as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[1].skill_ids).toEqual([1, 2]);
      expect(call[1].tag_ids).toEqual([3]);
      expect(call[1].source_ids).toEqual([4]);
      expect(call[1].job_ids).toEqual([5, 6]);
    });

    it("passes has_resume boolean", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

      await client.callTool({ name: "search_candidates", arguments: { has_resume: true } });

      const call = (mockKula.post as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[1].has_resume).toBe(true);
    });

    it("converts location IDs to numbers", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

      await client.callTool({
        name: "search_candidates",
        arguments: { country_id: "10", state_id: "20", city_id: "30" },
      });

      const call = (mockKula.post as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[1].country_id).toBe(10);
      expect(call[1].state_id).toBe(20);
      expect(call[1].city_id).toBe(30);
    });

    it("passes cursor and converts limit to number", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

      await client.callTool({
        name: "search_candidates",
        arguments: { cursor: "tok_abc123", limit: "50", page: "2" },
      });

      const call = (mockKula.post as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[1].cursor).toBe("tok_abc123");
      expect(call[1].limit).toBe(50);
      expect(call[1].page).toBe(2);
    });

    it("returns isError true on failure", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("search failed"));
      const result = await client.callTool({ name: "search_candidates", arguments: {} });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "search_candidates", arguments: {} });
      expect(result.isError).toBe(true);
    });
  });

  describe("get_candidate", () => {
    it("calls correct endpoint with ID", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        id: "cand-42",
        first_name: "Jane",
      });

      const result = await client.callTool({
        name: "get_candidate",
        arguments: { id: "cand-42" },
      });

      expect(mockKula.get).toHaveBeenCalledWith("/v1/candidates/cand-42");

      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;
      expect(JSON.parse(text).first_name).toBe("Jane");
    });
  });

  describe("update_candidate", () => {
    it("patches correct endpoint with optional fields", async () => {
      (mockKula.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: "cand-5" });

      const result = await client.callTool({
        name: "update_candidate",
        arguments: { id: "cand-5", first_name: "Updated", title: "Engineer", source_id: "8" },
      });

      expect(mockKula.patch).toHaveBeenCalledWith("/v1/candidates/cand-5", expect.objectContaining({
        first_name: "Updated",
        title: "Engineer",
        source_id: 8,
      }));
      expect(result.isError).toBeFalsy();
    });

    it("sends last_name, email, phone_number, tags, and additional_info when provided", async () => {
      (mockKula.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: "cand-9" });

      await client.callTool({
        name: "update_candidate",
        arguments: {
          id: "cand-9",
          last_name: "Smith",
          email: "smith@example.com",
          phone_number: "+9876543210",
          tags: "vip,sourced",
          additional_info: { custom_field: "value" },
        },
      });

      const call = (mockKula.patch as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[1].last_name).toBe("Smith");
      expect(call[1].email).toBe("smith@example.com");
      expect(call[1].phone_number).toBe("+9876543210");
      expect(call[1].tags).toBe("vip,sourced");
      expect(call[1].additional_info).toEqual({ custom_field: "value" });
    });

    it("converts all location sub-fields to integers", async () => {
      (mockKula.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: "cand-6" });

      await client.callTool({
        name: "update_candidate",
        arguments: {
          id: "cand-6",
          location: { places_city_id: "55", places_state_id: "66", places_country_id: "101" },
        },
      });

      const call = (mockKula.patch as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[1].location).toEqual({ places_city_id: 55, places_state_id: 66, places_country_id: 101 });
    });

    it("sends skills and social_urls when provided", async () => {
      (mockKula.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: "cand-7" });

      await client.callTool({
        name: "update_candidate",
        arguments: {
          id: "cand-7",
          skills: "TypeScript,React",
          social_urls: [{ kind: "linkedin", url: "https://linkedin.com/in/test" }],
        },
      });

      const call = (mockKula.patch as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[1].skills).toBe("TypeScript,React");
      expect(call[1].social_urls).toEqual([{ kind: "linkedin", url: "https://linkedin.com/in/test" }]);
    });

    it("handles partial location (city only) covering false branches for state and country", async () => {
      (mockKula.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: "cand-8" });

      await client.callTool({
        name: "update_candidate",
        arguments: { id: "cand-8", location: { places_city_id: "10" } },
      });

      const call = (mockKula.patch as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[1].location).toEqual({ places_city_id: 10 });
    });

    it("returns isError true on failure", async () => {
      (mockKula.patch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
      const result = await client.callTool({ name: "update_candidate", arguments: { id: "x" } });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws", async () => {
      (mockKula.patch as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "update_candidate", arguments: { id: "x" } });
      expect(result.isError).toBe(true);
    });
  });

  describe("error handling", () => {
    it("returns isError true when client throws", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error("Kula API error 400: Bad Request")
      );

      const result = await client.callTool({
        name: "create_candidate",
        arguments: { first_name: "Bad" },
      });

      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;
      expect(text).toContain("400");
    });

    it("handles Error in list_candidates", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
      const result = await client.callTool({ name: "list_candidates", arguments: {} });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws in create_candidate", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "create_candidate", arguments: { first_name: "X" } });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws in list_candidates", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "list_candidates", arguments: {} });
      expect(result.isError).toBe(true);
    });

    it("handles Error in search_candidates", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
      const result = await client.callTool({ name: "search_candidates", arguments: {} });
      expect(result.isError).toBe(true);
    });

    it("handles Error in get_candidate", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("not found"));
      const result = await client.callTool({ name: "get_candidate", arguments: { id: "x" } });
      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain("not found");
    });

    it("handles non-Error throws in get_candidate", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "get_candidate", arguments: { id: "x" } });
      expect(result.isError).toBe(true);
    });
  });
});
