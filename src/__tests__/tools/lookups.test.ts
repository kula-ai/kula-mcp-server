import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { register } from "../../tools/lookups.js";
import { createMockClient, setupMcpTest } from "../helpers.js";
import type { KulaClient } from "../../client.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

describe("lookups tools", () => {
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

  describe("find_locations", () => {
    it("hits /v1/locations with query", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [{ id: 1, type: "city", name: "San Francisco" }],
      });

      const result = await client.callTool({
        name: "find_locations",
        arguments: { query: "san fran" },
      });

      expect(mockKula.get).toHaveBeenCalledWith("/v1/locations", {
        query: "san fran",
        page: undefined,
        limit: undefined,
      });
      expect(result.isError).toBeFalsy();
    });

    it("forwards pagination params", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

      await client.callTool({
        name: "find_locations",
        arguments: { query: "san", page: "2", limit: "10" },
      });

      expect(mockKula.get).toHaveBeenCalledWith("/v1/locations", {
        query: "san",
        page: "2",
        limit: "10",
      });
    });

    it("returns isError on client failure", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error("boom"),
      );

      const result = await client.callTool({
        name: "find_locations",
        arguments: { query: "x" },
      });

      expect(result.isError).toBe(true);
    });
  });

  describe("find_companies", () => {
    it("hits /v1/companies with query", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [{ id: 1, name: "Acme" }],
      });

      const result = await client.callTool({
        name: "find_companies",
        arguments: { query: "acme" },
      });

      expect(mockKula.get).toHaveBeenCalledWith("/v1/companies", {
        query: "acme",
        page: undefined,
        limit: undefined,
      });
      expect(result.isError).toBeFalsy();
    });

    it("forwards pagination params", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

      await client.callTool({
        name: "find_companies",
        arguments: { query: "acme", page: "3", limit: "5" },
      });

      expect(mockKula.get).toHaveBeenCalledWith("/v1/companies", {
        query: "acme",
        page: "3",
        limit: "5",
      });
    });

    it("returns isError on client failure", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("boom"));

      const result = await client.callTool({
        name: "find_companies",
        arguments: { query: "x" },
      });

      expect(result.isError).toBe(true);
    });
  });

  describe("find_industries", () => {
    it("hits /v1/industries with pagination", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [{ id: 1, name: "Technology" }],
      });

      const result = await client.callTool({
        name: "find_industries",
        arguments: { page: "1", limit: "20" },
      });

      expect(mockKula.get).toHaveBeenCalledWith("/v1/industries", {
        page: "1",
        limit: "20",
      });
      expect(result.isError).toBeFalsy();
    });

    it("works with no params", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [],
      });

      await client.callTool({ name: "find_industries", arguments: {} });

      expect(mockKula.get).toHaveBeenCalledWith("/v1/industries", {
        page: undefined,
        limit: undefined,
      });
    });
  });

  describe("find_institutions", () => {
    it("hits /v1/institutions with query", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [{ id: 1, name: "Stanford" }],
      });

      const result = await client.callTool({
        name: "find_institutions",
        arguments: { query: "stanford", page: "1", limit: "5" },
      });

      expect(mockKula.get).toHaveBeenCalledWith("/v1/institutions", {
        query: "stanford",
        page: "1",
        limit: "5",
      });
      expect(result.isError).toBeFalsy();
    });

    it("returns isError on client failure", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("boom"));

      const result = await client.callTool({ name: "find_institutions", arguments: { query: "x" } });
      expect(result.isError).toBe(true);
    });
  });

  describe("find_disciplines", () => {
    it("hits /v1/disciplines with query", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [{ id: 1, name: "CS" }],
      });

      const result = await client.callTool({
        name: "find_disciplines",
        arguments: { query: "computer", page: "1", limit: "5" },
      });

      expect(mockKula.get).toHaveBeenCalledWith("/v1/disciplines", {
        query: "computer",
        page: "1",
        limit: "5",
      });
      expect(result.isError).toBeFalsy();
    });

    it("returns isError on client failure", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("boom"));

      const result = await client.callTool({ name: "find_disciplines", arguments: { query: "x" } });
      expect(result.isError).toBe(true);
    });
  });

  describe("find_degrees", () => {
    it("hits /v1/degrees paginated", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [{ id: 1, name: "BSc" }],
      });

      const result = await client.callTool({
        name: "find_degrees",
        arguments: { page: "2", limit: "50" },
      });

      expect(mockKula.get).toHaveBeenCalledWith("/v1/degrees", {
        query: undefined,
        page: "2",
        limit: "50",
      });
      expect(result.isError).toBeFalsy();
    });

    it("forwards the optional query filter", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

      await client.callTool({ name: "find_degrees", arguments: { query: "bach" } });

      expect(mockKula.get).toHaveBeenCalledWith("/v1/degrees", {
        query: "bach",
        page: undefined,
        limit: undefined,
      });
    });

    it("returns isError on client failure", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("boom"));

      const result = await client.callTool({ name: "find_degrees", arguments: {} });
      expect(result.isError).toBe(true);
    });
  });

  describe("find_tags", () => {
    it("hits /v1/tags with query and pagination", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [{ id: 1, name: "high-priority" }],
      });

      const result = await client.callTool({
        name: "find_tags",
        arguments: { query: "high", page: "1", limit: "5" },
      });

      expect(mockKula.get).toHaveBeenCalledWith("/v1/tags", {
        query: "high",
        page: "1",
        limit: "5",
      });
      expect(result.isError).toBeFalsy();
    });

    it("returns isError on client failure", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("boom"));

      const result = await client.callTool({ name: "find_tags", arguments: { query: "x" } });
      expect(result.isError).toBe(true);
    });
  });

  describe("find_skills", () => {
    it("hits /v1/skills with query and pagination", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [{ id: 1, name: "ruby" }],
      });

      const result = await client.callTool({
        name: "find_skills",
        arguments: { query: "rub", page: "1", limit: "5" },
      });

      expect(mockKula.get).toHaveBeenCalledWith("/v1/skills", {
        query: "rub",
        page: "1",
        limit: "5",
      });
      expect(result.isError).toBeFalsy();
    });

    it("returns isError on client failure", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("boom"));

      const result = await client.callTool({ name: "find_skills", arguments: { query: "x" } });
      expect(result.isError).toBe(true);
    });
  });

  describe("find_currencies", () => {
    it("hits /v1/currencies paginated", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [{ id: 1, code: "USD", name: "United States Dollar" }],
      });

      const result = await client.callTool({
        name: "find_currencies",
        arguments: { page: "1", limit: "10" },
      });

      expect(mockKula.get).toHaveBeenCalledWith("/v1/currencies", {
        page: "1",
        limit: "10",
      });
      expect(result.isError).toBeFalsy();
    });

    it("returns isError on client failure", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("boom"));

      const result = await client.callTool({ name: "find_currencies", arguments: {} });
      expect(result.isError).toBe(true);
    });
  });

  describe("find_industries", () => {
    it("returns isError on client failure", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("boom"));

      const result = await client.callTool({ name: "find_industries", arguments: {} });
      expect(result.isError).toBe(true);
    });
  });

  describe("non-Error rejection handling", () => {
    const cases: Array<{ name: string; arguments: Record<string, unknown> }> = [
      { name: "find_locations", arguments: { query: "x" } },
      { name: "find_companies", arguments: { query: "x" } },
      { name: "find_industries", arguments: {} },
      { name: "find_institutions", arguments: { query: "x" } },
      { name: "find_disciplines", arguments: { query: "x" } },
      { name: "find_degrees", arguments: {} },
      { name: "find_tags", arguments: { query: "x" } },
      { name: "find_skills", arguments: { query: "x" } },
      { name: "find_currencies", arguments: {} },
    ];

    cases.forEach(({ name, arguments: args }) => {
      it(`${name} handles non-Error throws via String()`, async () => {
        (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce("string error");

        const result = await client.callTool({ name, arguments: args });
        expect(result.isError).toBe(true);
      });
    });
  });
});
