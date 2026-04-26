import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { register } from "../../tools/custom-fields.js";
import { createMockClient, setupMcpTest } from "../helpers.js";
import type { KulaClient } from "../../client.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

describe("custom-fields tools", () => {
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

  describe("list_custom_fields", () => {
    it("passes page, limit, and subject_type to client", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [{ id: 1, label: "Years of Experience" }],
      });

      const result = await client.callTool({
        name: "list_custom_fields",
        arguments: { page: "1", limit: "10", subject_type: "candidate" },
      });

      const call = (mockKula.get as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[0]).toBe("/v1/custom-fields");
      expect(call[1].page).toBe("1");
      expect(call[1].limit).toBe("10");
      expect(call[1].subject_type).toBe("candidate");
      expect(result.isError).toBeFalsy();
    });

    it("passes sort and date filter params", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

      await client.callTool({
        name: "list_custom_fields",
        arguments: {
          sort_by: "updated_at",
          sort_order: "asc",
          updated_after: "2024-06-01T00:00:00Z",
        },
      });

      const call = (mockKula.get as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[1].sort_by).toBe("updated_at");
      expect(call[1].sort_order).toBe("asc");
      expect(call[1].updated_after).toBe("2024-06-01T00:00:00Z");
    });

    it("works with no params", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

      const result = await client.callTool({ name: "list_custom_fields", arguments: {} });
      expect(result.isError).toBeFalsy();
    });

    it("returns isError true on failure", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error("Kula API error 500: Internal Server Error")
      );

      const result = await client.callTool({ name: "list_custom_fields", arguments: {} });
      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain("500");
    });
  });
});
