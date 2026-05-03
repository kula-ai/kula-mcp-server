import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { register } from "../../tools/sources.js";
import { createMockClient, setupMcpTest } from "../helpers.js";
import type { KulaClient } from "../../client.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

describe("sources tools", () => {
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

  describe("list_sources", () => {
    it("passes page and limit to client", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [{ id: 1, name: "LinkedIn" }],
      });

      const result = await client.callTool({
        name: "list_sources",
        arguments: { page: "1", limit: "20" },
      });

      const call = (mockKula.get as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[0]).toBe("/v1/candidate-sources");
      expect(call[1].page).toBe("1");
      expect(call[1].limit).toBe("20");
      expect(result.isError).toBeFalsy();
    });

    it("passes sort and date filter params", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

      await client.callTool({
        name: "list_sources",
        arguments: {
          sort_by: "created_at",
          sort_order: "desc",
          created_after: "2024-01-01T00:00:00Z",
          updated_before: "2024-12-31T23:59:59Z",
        },
      });

      const call = (mockKula.get as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[1].sort_by).toBe("created_at");
      expect(call[1].sort_order).toBe("desc");
      expect(call[1].created_after).toBe("2024-01-01T00:00:00Z");
      expect(call[1].updated_before).toBe("2024-12-31T23:59:59Z");
    });

    it("converts enabled to boolean", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [],
      });

      await client.callTool({
        name: "list_sources",
        arguments: { enabled: "true" },
      });

      const call = (mockKula.get as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[1].enabled).toBe(true);
    });

    it("converts enabled=false to boolean false", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [],
      });

      await client.callTool({
        name: "list_sources",
        arguments: { enabled: "false" },
      });

      const call = (mockKula.get as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[1].enabled).toBe(false);
    });

    it("works with no params", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [],
      });

      const result = await client.callTool({ name: "list_sources", arguments: {} });
      expect(result.isError).toBeFalsy();
    });

    it("returns isError true on Error failure", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error("Kula API error 500: Internal Server Error")
      );

      const result = await client.callTool({ name: "list_sources", arguments: {} });
      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain("500");
    });

    it("handles non-Error throws", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "list_sources", arguments: {} });
      expect(result.isError).toBe(true);
    });
  });
});
