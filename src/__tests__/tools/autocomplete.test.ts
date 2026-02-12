import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { register } from "../../tools/autocomplete.js";
import { createMockClient, setupMcpTest } from "../helpers.js";
import type { KulaClient } from "../../client.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

describe("autocomplete tools", () => {
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

  describe("search_companies", () => {
    it("passes query param to client", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [{ name: "Acme Corp" }],
      });

      const result = await client.callTool({
        name: "search_companies",
        arguments: { query: "acme" },
      });

      expect(mockKula.get).toHaveBeenCalledWith(
        "/v1/autocomplete/companies",
        { query: "acme" }
      );

      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;
      expect(JSON.parse(text).data[0].name).toBe("Acme Corp");
    });
  });

  describe("list_industries", () => {
    it("calls industries endpoint with no params", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [{ name: "Technology" }],
      });

      const result = await client.callTool({
        name: "list_industries",
        arguments: {},
      });

      expect(mockKula.get).toHaveBeenCalledWith(
        "/v1/autocomplete/industries"
      );
      expect(result.isError).toBeFalsy();
    });
  });

  describe("search_locations", () => {
    it("passes query param to client", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [{ name: "San Francisco, CA" }],
      });

      const result = await client.callTool({
        name: "search_locations",
        arguments: { query: "san fran" },
      });

      expect(mockKula.get).toHaveBeenCalledWith(
        "/v1/autocomplete/locations",
        { query: "san fran" }
      );

      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;
      expect(JSON.parse(text).data[0].name).toBe("San Francisco, CA");
    });
  });

  describe("search_institutions", () => {
    it("passes query param to client", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [{ name: "MIT" }],
      });

      const result = await client.callTool({
        name: "search_institutions",
        arguments: { query: "mit" },
      });

      expect(mockKula.get).toHaveBeenCalledWith(
        "/v1/autocomplete/institutions",
        { query: "mit" }
      );

      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;
      expect(JSON.parse(text).data[0].name).toBe("MIT");
    });
  });

  describe("search_disciplines", () => {
    it("passes query param to client", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [{ name: "Computer Science" }],
      });

      const result = await client.callTool({
        name: "search_disciplines",
        arguments: { query: "comp" },
      });

      expect(mockKula.get).toHaveBeenCalledWith(
        "/v1/autocomplete/disciplines",
        { query: "comp" }
      );

      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;
      expect(JSON.parse(text).data[0].name).toBe("Computer Science");
    });
  });

  describe("list_degrees", () => {
    it("calls degrees endpoint with no params", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [{ name: "Bachelor of Science" }],
      });

      const result = await client.callTool({
        name: "list_degrees",
        arguments: {},
      });

      expect(mockKula.get).toHaveBeenCalledWith(
        "/v1/autocomplete/degrees"
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
        name: "search_companies",
        arguments: { query: "fail" },
      });

      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;
      expect(text).toContain("500");
    });

    it("handles non-Error throws via String()", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        "string error"
      );

      const result = await client.callTool({
        name: "search_companies",
        arguments: { query: "fail" },
      });

      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;
      expect(text).toContain("string error");
    });

    it("handles Error in list_industries", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
      const result = await client.callTool({ name: "list_industries", arguments: {} });
      expect(result.isError).toBe(true);
    });

    it("handles Error in search_locations", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
      const result = await client.callTool({ name: "search_locations", arguments: { query: "x" } });
      expect(result.isError).toBe(true);
    });

    it("handles Error in search_institutions", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
      const result = await client.callTool({ name: "search_institutions", arguments: { query: "x" } });
      expect(result.isError).toBe(true);
    });

    it("handles Error in search_disciplines", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
      const result = await client.callTool({ name: "search_disciplines", arguments: { query: "x" } });
      expect(result.isError).toBe(true);
    });

    it("handles Error in list_degrees", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
      const result = await client.callTool({ name: "list_degrees", arguments: {} });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws in list_industries", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "list_industries", arguments: {} });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws in search_locations", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "search_locations", arguments: { query: "x" } });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws in search_institutions", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "search_institutions", arguments: { query: "x" } });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws in search_disciplines", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "search_disciplines", arguments: { query: "x" } });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws in list_degrees", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "list_degrees", arguments: {} });
      expect(result.isError).toBe(true);
    });
  });
});
