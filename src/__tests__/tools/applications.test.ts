import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { register } from "../../tools/applications.js";
import { createMockClient, setupMcpTest } from "../helpers.js";
import type { KulaClient } from "../../client.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

describe("applications tools", () => {
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

  describe("list_applications", () => {
    it("passes filter params to client", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [{ id: "app-1" }],
      });

      const result = await client.callTool({
        name: "list_applications",
        arguments: { page: "1", limit: "10", job_id: "5", status: "submitted" },
      });

      expect(mockKula.get).toHaveBeenCalledWith("/v1/applications", {
        page: "1",
        limit: "10",
        job_id: 5,
        status: ["submitted"],
        sort_by: undefined,
        sort_order: undefined,
        created_after: undefined,
        created_before: undefined,
        updated_after: undefined,
        updated_before: undefined,
      });
      expect(result.isError).toBeFalsy();
    });
  });

  describe("get_application", () => {
    it("calls correct endpoint with ID", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        id: "app-42",
        status: "reviewed",
      });

      const result = await client.callTool({
        name: "get_application",
        arguments: { id: "app-42" },
      });

      expect(mockKula.get).toHaveBeenCalledWith("/v1/applications/app-42");

      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;
      expect(JSON.parse(text).status).toBe("reviewed");
    });
  });

  describe("update_application_stage", () => {
    it("posts stage_id as number to correct endpoint", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        id: "app-1",
        stage_id: 5,
      });

      const result = await client.callTool({
        name: "update_application_stage",
        arguments: { id: "app-1", stage_id: "5" },
      });

      expect(mockKula.post).toHaveBeenCalledWith(
        "/v1/applications/app-1/update-stage",
        { stage_id: 5 }
      );
      expect(result.isError).toBeFalsy();
    });
  });

  describe("error handling", () => {
    it("returns isError true when client throws", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error("Kula API error 500: Internal Server Error")
      );

      const result = await client.callTool({
        name: "get_application",
        arguments: { id: "bad" },
      });

      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;
      expect(text).toContain("500");
    });

    it("handles Error in list_applications", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
      const result = await client.callTool({ name: "list_applications", arguments: {} });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws in list_applications", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "list_applications", arguments: {} });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws in get_application", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "get_application", arguments: { id: "x" } });
      expect(result.isError).toBe(true);
    });

    it("handles Error in update_application_stage", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
      const result = await client.callTool({ name: "update_application_stage", arguments: { id: "x", stage_id: "1" } });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws in update_application_stage", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "update_application_stage", arguments: { id: "x", stage_id: "1" } });
      expect(result.isError).toBe(true);
    });
  });
});
