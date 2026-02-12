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
          ats_candidate_source_id: "3",
          credited_to_user_id: "4",
          social_urls: [
            { kind: "linkedin", url: "https://linkedin.com/in/test" },
          ],
          location: { places_city_id: "city-1" },
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
        ats_candidate_source_id: 3,
        credited_to_user_id: 4,
        social_urls: [
          { kind: "linkedin", url: "https://linkedin.com/in/test" },
        ],
        location: { places_city_id: "city-1" },
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
          ats_candidate_source_id: "30",
          credited_to_user_id: "40",
        },
      });

      expect(mockKula.post).toHaveBeenCalledWith("/v1/candidates", {
        first_name: "Test",
        job_id: 10,
        job_stage_id: 20,
        ats_candidate_source_id: 30,
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
