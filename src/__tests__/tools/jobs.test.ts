import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { register } from "../../tools/jobs.js";
import { createMockClient, setupMcpTest } from "../helpers.js";
import type { KulaClient } from "../../client.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

describe("jobs tools", () => {
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

  describe("list_jobs", () => {
    it("passes filter params to client", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [{ id: "job-1" }],
      });

      const result = await client.callTool({
        name: "list_jobs",
        arguments: { page: "1", limit: "10", status: "published" },
      });

      expect(mockKula.get).toHaveBeenCalledWith("/v1/jobs", {
        page: "1",
        limit: "10",
        status: ["published"],
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
        name: "list_jobs",
        arguments: {},
      });
      expect(result.isError).toBeFalsy();
    });
  });

  describe("get_job", () => {
    it("calls correct endpoint with ID", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        id: "job-42",
        title: "Engineer",
      });

      const result = await client.callTool({
        name: "get_job",
        arguments: { id: "job-42" },
      });

      expect(mockKula.get).toHaveBeenCalledWith("/v1/jobs/job-42");

      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;
      expect(JSON.parse(text).title).toBe("Engineer");
    });
  });

  describe("search_jobs", () => {
    it("passes query and filters to client", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

      const result = await client.callTool({
        name: "search_jobs",
        arguments: { query: "engineer", status: "published", department_ids: "1,2" },
      });

      const call = (mockKula.get as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[0]).toBe("/v1/jobs/search");
      expect(call[1].query).toBe("engineer");
      expect(call[1].status).toEqual(["published"]);
      expect(call[1].department_ids).toEqual([1, 2]);
      expect(result.isError).toBeFalsy();
    });
  });

  describe("create_job", () => {
    it("posts name and converts typed fields", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: "job-new" });

      const result = await client.callTool({
        name: "create_job",
        arguments: {
          name: "Senior Engineer",
          department_id: "3",
          office_ids: "10,11",
          confidential: "true",
          requisition_codes: "REQ-1,REQ-2",
        },
      });

      expect(mockKula.post).toHaveBeenCalledWith("/v1/jobs", expect.objectContaining({
        name: "Senior Engineer",
        department_id: 3,
        office_ids: [10, 11],
        confidential: true,
        requisition_codes: ["REQ-1", "REQ-2"],
      }));
      expect(result.isError).toBeFalsy();
    });

    it("includes compensation when provided", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: "job-new" });

      await client.callTool({
        name: "create_job",
        arguments: {
          name: "Engineer",
          compensation: { currency_country_id: "101", min_amount: 50000, max_amount: 80000, interval: "yearly" },
        },
      });

      const call = (mockKula.post as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[1].compensation).toMatchObject({
        currency_country_id: 101,
        min_amount: 50000,
        max_amount: 80000,
        interval: "yearly",
      });
    });

    it("returns isError true on failure", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
      const result = await client.callTool({ name: "create_job", arguments: { name: "x" } });
      expect(result.isError).toBe(true);
    });
  });

  describe("update_job", () => {
    it("patches correct endpoint with optional fields", async () => {
      (mockKula.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: "job-5" });

      const result = await client.callTool({
        name: "update_job",
        arguments: { id: "job-5", name: "Updated Title", confidential: "false" },
      });

      expect(mockKula.patch).toHaveBeenCalledWith("/v1/jobs/job-5", expect.objectContaining({
        name: "Updated Title",
        confidential: false,
      }));
      expect(result.isError).toBeFalsy();
    });

    it("returns isError true on failure", async () => {
      (mockKula.patch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
      const result = await client.callTool({ name: "update_job", arguments: { id: "x" } });
      expect(result.isError).toBe(true);
    });
  });

  describe("error handling", () => {
    it("returns isError true when client throws", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error("Kula API error 500: Internal Server Error")
      );

      const result = await client.callTool({
        name: "get_job",
        arguments: { id: "bad" },
      });

      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;
      expect(text).toContain("500");
    });

    it("handles Error in list_jobs", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
      const result = await client.callTool({ name: "list_jobs", arguments: {} });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws in list_jobs", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "list_jobs", arguments: {} });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws in get_job", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "get_job", arguments: { id: "x" } });
      expect(result.isError).toBe(true);
    });
  });
});
