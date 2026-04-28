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
        query: undefined,
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

    it("splits department_ids and office_ids into integer arrays", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

      await client.callTool({
        name: "list_jobs",
        arguments: { department_ids: "3,4", office_ids: "10,11" },
      });

      const call = (mockKula.get as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[1].department_ids).toEqual([3, 4]);
      expect(call[1].office_ids).toEqual([10, 11]);
    });

    it("passes query param for keyword search", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

      await client.callTool({ name: "list_jobs", arguments: { query: "engineer" } });

      const call = (mockKula.get as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[1].query).toBe("engineer");
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
