import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { register } from "../../tools/rejection-reasons.js";
import { createMockClient, setupMcpTest } from "../helpers.js";
import type { KulaClient } from "../../client.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

describe("rejection-reasons tools", () => {
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

  describe("list_rejection_reasons", () => {
    it("passes filter params to client", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [{ id: 1, label: "Not qualified" }],
      });

      const result = await client.callTool({
        name: "list_rejection_reasons",
        arguments: { page: "1", limit: "10", sort_by: "created_at", sort_order: "desc" },
      });

      expect(mockKula.get).toHaveBeenCalledWith("/v1/rejection-reasons", expect.objectContaining({
        page: "1",
        limit: "10",
        sort_by: "created_at",
        sort_order: "desc",
      }));
      expect(result.isError).toBeFalsy();
    });

    it("converts enabled to boolean true", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

      await client.callTool({
        name: "list_rejection_reasons",
        arguments: { enabled: "true" },
      });

      const call = (mockKula.get as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[1].enabled).toBe(true);
    });

    it("converts enabled to boolean false", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

      await client.callTool({
        name: "list_rejection_reasons",
        arguments: { enabled: "false" },
      });

      const call = (mockKula.get as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[1].enabled).toBe(false);
    });

    it("passes group filter as string", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

      await client.callTool({
        name: "list_rejection_reasons",
        arguments: { group: "candidate_experience" },
      });

      const call = (mockKula.get as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[1].group).toBe("candidate_experience");
    });

    it("works with no params", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

      const result = await client.callTool({ name: "list_rejection_reasons", arguments: {} });
      expect(result.isError).toBeFalsy();
    });

    it("returns isError true on Error failure", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error("Kula API error 500: Internal Server Error")
      );

      const result = await client.callTool({ name: "list_rejection_reasons", arguments: {} });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "list_rejection_reasons", arguments: {} });
      expect(result.isError).toBe(true);
    });
  });
});
