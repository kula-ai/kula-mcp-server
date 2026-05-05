import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { register } from "../../tools/job-posts.js";
import { createMockClient, setupMcpTest } from "../helpers.js";
import type { KulaClient } from "../../client.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

describe("job-posts tools", () => {
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

  describe("list_job_posts", () => {
    it("passes pagination and filter params to client", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [{ id: "1", title: "Engineer" }],
      });

      const result = await client.callTool({
        name: "list_job_posts",
        arguments: { page: "2", limit: "5", department_ids: "1,2", office_ids: "10" },
      });

      const call = (mockKula.get as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[0]).toBe("/v1/job-boards/job-posts");
      expect(call[1].page).toBe("2");
      expect(call[1].limit).toBe("5");
      expect(call[1].department_ids).toEqual([1, 2]);
      expect(call[1].office_ids).toEqual([10]);

      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;
      const parsed = JSON.parse(text);
      expect(parsed.data[0].title).toBe("Engineer");
    });

    it("works with no params", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [],
      });

      const result = await client.callTool({
        name: "list_job_posts",
        arguments: {},
      });
      expect(result.isError).toBeFalsy();
    });
  });

  describe("get_job_post", () => {
    it("calls correct endpoint with ID", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        id: "jp-42",
        title: "Designer",
      });

      const result = await client.callTool({
        name: "get_job_post",
        arguments: { id: "jp-42" },
      });

      expect(mockKula.get).toHaveBeenCalledWith(
        "/v1/job-boards/job-posts/jp-42"
      );

      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;
      expect(JSON.parse(text).title).toBe("Designer");
    });
  });

  describe("error handling", () => {
    it("returns isError true when client throws", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error("Kula API error 500: Internal Server Error")
      );

      const result = await client.callTool({
        name: "get_job_post",
        arguments: { id: "bad" },
      });

      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;
      expect(text).toContain("500");
    });

    it("handles Error in list_job_posts", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
      const result = await client.callTool({ name: "list_job_posts", arguments: {} });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws in list_job_posts", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "list_job_posts", arguments: {} });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws in get_job_post", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "get_job_post", arguments: { id: "x" } });
      expect(result.isError).toBe(true);
    });
  });
});
