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

  describe("list_milestones", () => {
    it("calls milestones endpoint", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [{ id: 1, name: "Screening" }],
      });

      const result = await client.callTool({ name: "list_milestones", arguments: {} });

      const call = (mockKula.get as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[0]).toBe("/v1/milestones");
      expect(result.isError).toBeFalsy();
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(JSON.parse(text).data[0].name).toBe("Screening");
    });

    it("passes pagination and filter params", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

      await client.callTool({
        name: "list_milestones",
        arguments: { page: "2", limit: "10", sort_by: "created_at", sort_order: "asc", created_after: "2024-01-01T00:00:00Z" },
      });

      const call = (mockKula.get as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[1].page).toBe("2");
      expect(call[1].sort_by).toBe("created_at");
      expect(call[1].created_after).toBe("2024-01-01T00:00:00Z");
    });

    it("returns isError true on failure", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
      const result = await client.callTool({ name: "list_milestones", arguments: {} });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "list_milestones", arguments: {} });
      expect(result.isError).toBe(true);
    });
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

      expect(mockKula.get).toHaveBeenCalledWith("/v1/departments", expect.any(Object));

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

      expect(mockKula.get).toHaveBeenCalledWith("/v1/offices", expect.any(Object));

      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;
      expect(JSON.parse(text).data[0].name).toBe("HQ");
    });
  });

  describe("list_users", () => {
    it("calls users endpoint with no params", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [{ id: "u1", name: "Jane Smith", email: "jane@example.com", role: "recruiter" }],
      });

      const result = await client.callTool({ name: "list_users", arguments: {} });

      expect(mockKula.get).toHaveBeenCalledWith("/v1/users", expect.any(Object));
      expect(result.isError).toBeFalsy();
    });

    it("passes filter params", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

      await client.callTool({
        name: "list_users",
        arguments: { sort_by: "updated_at", sort_order: "asc", updated_after: "2024-01-01T00:00:00Z" },
      });

      const call = (mockKula.get as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[0]).toBe("/v1/users");
      expect(call[1].sort_by).toBe("updated_at");
      expect(call[1].sort_order).toBe("asc");
      expect(call[1].updated_after).toBe("2024-01-01T00:00:00Z");
    });

    it("passes status filter as array", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

      await client.callTool({
        name: "list_users",
        arguments: { status: "active,deactivated" },
      });

      const call = (mockKula.get as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[1]["status[]"]).toEqual(["active", "deactivated"]);
    });

    it("returns isError true on failure", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
      const result = await client.callTool({ name: "list_users", arguments: {} });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "list_users", arguments: {} });
      expect(result.isError).toBe(true);
    });
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
      await client.callTool({ name: "list_rejection_reasons", arguments: { enabled: "true" } });
      const call = (mockKula.get as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[1].enabled).toBe(true);
    });

    it("converts enabled to boolean false", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });
      await client.callTool({ name: "list_rejection_reasons", arguments: { enabled: "false" } });
      const call = (mockKula.get as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[1].enabled).toBe(false);
    });

    it("passes group filter as string", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });
      await client.callTool({ name: "list_rejection_reasons", arguments: { group: "candidate_experience" } });
      const call = (mockKula.get as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[1].group).toBe("candidate_experience");
    });

    it("works with no params", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });
      const result = await client.callTool({ name: "list_rejection_reasons", arguments: {} });
      expect(result.isError).toBeFalsy();
    });

    it("returns isError true on Error failure", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Kula API error 500: Internal Server Error"));
      const result = await client.callTool({ name: "list_rejection_reasons", arguments: {} });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "list_rejection_reasons", arguments: {} });
      expect(result.isError).toBe(true);
    });
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
        arguments: { sort_by: "created_at", sort_order: "desc", created_after: "2024-01-01T00:00:00Z", updated_before: "2024-12-31T23:59:59Z" },
      });
      const call = (mockKula.get as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[1].sort_by).toBe("created_at");
      expect(call[1].created_after).toBe("2024-01-01T00:00:00Z");
      expect(call[1].updated_before).toBe("2024-12-31T23:59:59Z");
    });

    it("converts enabled to boolean true", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });
      await client.callTool({ name: "list_sources", arguments: { enabled: "true" } });
      const call = (mockKula.get as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[1].enabled).toBe(true);
    });

    it("converts enabled to boolean false", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });
      await client.callTool({ name: "list_sources", arguments: { enabled: "false" } });
      const call = (mockKula.get as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[1].enabled).toBe(false);
    });

    it("works with no params", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });
      const result = await client.callTool({ name: "list_sources", arguments: {} });
      expect(result.isError).toBeFalsy();
    });

    it("returns isError true on Error failure", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Kula API error 500: Internal Server Error"));
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

  describe("list_custom_fields", () => {
    it("passes page, limit, and subject_type to client", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [{ id: 1, label: "Years of Experience" }],
      });

      const result = await client.callTool({
        name: "list_custom_fields",
        arguments: { page: "1", limit: "10", type: "candidate" },
      });

      const call = (mockKula.get as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[0]).toBe("/v1/custom-fields");
      expect(call[1].page).toBe("1");
      expect(call[1].limit).toBe("10");
      expect(call[1].type).toBe("candidate");
      expect(result.isError).toBeFalsy();
    });

    it("passes sort and date filter params", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

      await client.callTool({
        name: "list_custom_fields",
        arguments: {
          type: "job",
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

    it("works with only required type param", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

      const result = await client.callTool({ name: "list_custom_fields", arguments: { type: "candidate" } });
      expect(result.isError).toBeFalsy();
    });

    it("passes department_ids and office_ids as array params", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

      await client.callTool({
        name: "list_custom_fields",
        arguments: { type: "job", department_ids: "1,2", office_ids: "10" },
      });

      const call = (mockKula.get as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[1]["department_ids[]"]).toEqual([1, 2]);
      expect(call[1]["office_ids[]"]).toEqual([10]);
    });

    it("returns isError true on Error failure", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error("Kula API error 500: Internal Server Error")
      );

      const result = await client.callTool({ name: "list_custom_fields", arguments: { type: "job" } });
      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain("500");
    });

    it("handles non-Error throws", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "list_custom_fields", arguments: { type: "job" } });
      expect(result.isError).toBe(true);
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
