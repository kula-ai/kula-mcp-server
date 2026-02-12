import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { register } from "../../tools/organization.js";
import { createMockClient, setupMcpTest } from "../helpers.js";
import type { KulaClient } from "../../client.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

describe("organization tools", () => {
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

  describe("list_departments", () => {
    it("calls departments endpoint", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [{ id: "d1", name: "Engineering" }],
      });

      const result = await client.callTool({
        name: "list_departments",
        arguments: {},
      });

      expect(mockKula.get).toHaveBeenCalledWith("/v1/departments");

      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;
      expect(JSON.parse(text).data[0].name).toBe("Engineering");
    });
  });

  describe("list_offices", () => {
    it("calls offices endpoint", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [{ id: "o1", name: "HQ" }],
      });

      const result = await client.callTool({
        name: "list_offices",
        arguments: {},
      });

      expect(mockKula.get).toHaveBeenCalledWith("/v1/offices");

      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;
      expect(JSON.parse(text).data[0].name).toBe("HQ");
    });
  });

  describe("error handling", () => {
    it("returns isError true when client throws", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error("Kula API error 500: Internal Server Error")
      );

      const result = await client.callTool({
        name: "list_departments",
        arguments: {},
      });

      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;
      expect(text).toContain("500");
    });

    it("handles Error in list_offices", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
      const result = await client.callTool({ name: "list_offices", arguments: {} });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws in list_departments", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce("string error");
      const result = await client.callTool({ name: "list_departments", arguments: {} });
      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain("string error");
    });

    it("handles non-Error throws in list_offices", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "list_offices", arguments: {} });
      expect(result.isError).toBe(true);
    });
  });
});
