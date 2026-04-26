import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { register } from "../../tools/requisitions.js";
import { createMockClient, setupMcpTest } from "../helpers.js";
import type { KulaClient } from "../../client.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

describe("requisitions tools", () => {
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

  describe("list_requisitions", () => {
    it("calls correct endpoint with no params", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [{ id: "req-1" }],
      });

      const result = await client.callTool({
        name: "list_requisitions",
        arguments: {},
      });

      expect(mockKula.get).toHaveBeenCalledWith("/v1/requisitions", expect.any(Object));
      expect(result.isError).toBeFalsy();
    });

    it("splits and converts array filter params", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

      await client.callTool({
        name: "list_requisitions",
        arguments: {
          status: "open,filled",
          department_ids: "1,2",
          office_ids: "10",
          job_ids: "5,6",
        },
      });

      const call = (mockKula.get as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[0]).toBe("/v1/requisitions");
      expect(call[1].status).toEqual(["open", "filled"]);
      expect(call[1].department_ids).toEqual([1, 2]);
      expect(call[1].office_ids).toEqual([10]);
      expect(call[1].job_ids).toEqual([5, 6]);
    });

    it("splits employment_type, requisition_type, recruiter_ids, hiring_manager_ids, created_by_ids", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

      await client.callTool({
        name: "list_requisitions",
        arguments: {
          employment_type: "full_time,contract",
          requisition_type: "new_hire,backfill",
          recruiter_ids: "1,2",
          hiring_manager_ids: "3,4",
          created_by_ids: "5",
        },
      });

      const call = (mockKula.get as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[1].employment_type).toEqual(["full_time", "contract"]);
      expect(call[1].requisition_type).toEqual(["new_hire", "backfill"]);
      expect(call[1].recruiter_ids).toEqual([1, 2]);
      expect(call[1].hiring_manager_ids).toEqual([3, 4]);
      expect(call[1].created_by_ids).toEqual([5]);
    });

    it("passes scalar filter params", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

      await client.callTool({
        name: "list_requisitions",
        arguments: {
          q: "engineer",
          sort_by: "opened_at",
          sort_order: "desc",
          created_after: "2024-01-01T00:00:00Z",
          updated_after: "2024-06-01T00:00:00Z",
          target_hire_date_after: "2024-09-01",
        },
      });

      const call = (mockKula.get as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[1].q).toBe("engineer");
      expect(call[1].sort_by).toBe("opened_at");
      expect(call[1].sort_order).toBe("desc");
      expect(call[1].created_after).toBe("2024-01-01T00:00:00Z");
      expect(call[1].updated_after).toBe("2024-06-01T00:00:00Z");
      expect(call[1].target_hire_date_after).toBe("2024-09-01");
    });

    it("returns isError true on failure", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
      const result = await client.callTool({ name: "list_requisitions", arguments: {} });
      expect(result.isError).toBe(true);
    });
  });

  describe("get_requisition", () => {
    it("calls correct endpoint with ID", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        id: "req-42",
        title: "Senior Engineer",
      });

      const result = await client.callTool({
        name: "get_requisition",
        arguments: { id: "req-42" },
      });

      expect(mockKula.get).toHaveBeenCalledWith("/v1/requisitions/req-42");

      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;
      expect(JSON.parse(text).title).toBe("Senior Engineer");
    });
  });

  describe("list_requisition_fields", () => {
    it("passes filter params to client", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [{ id: "field-1", name: "Priority" }],
      });

      const result = await client.callTool({
        name: "list_requisition_fields",
        arguments: { department_id: "dept-1", office_ids: "off-1,off-2" },
      });

      expect(mockKula.get).toHaveBeenCalledWith("/v1/requisitions/fields", {
        department_id: "dept-1",
        office_ids: "off-1,off-2",
      });
      expect(result.isError).toBeFalsy();
    });

    it("works with no params", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [],
      });

      const result = await client.callTool({
        name: "list_requisition_fields",
        arguments: {},
      });
      expect(result.isError).toBeFalsy();
    });
  });

  describe("create_requisition", () => {
    it("posts body to correct endpoint", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        id: "req-new",
      });

      const result = await client.callTool({
        name: "create_requisition",
        arguments: { head_count: 2, additional_info: { field_1: "value" } },
      });

      expect(mockKula.post).toHaveBeenCalledWith("/v1/requisitions", {
        head_count: 2,
        additional_info: { field_1: "value" },
      });
      expect(result.isError).toBeFalsy();
    });

    it("works with no params", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        id: "req-new",
      });

      const result = await client.callTool({
        name: "create_requisition",
        arguments: {},
      });

      expect(mockKula.post).toHaveBeenCalledWith("/v1/requisitions", {});
      expect(result.isError).toBeFalsy();
    });
  });

  describe("update_requisition", () => {
    it("puts body to correct endpoint", async () => {
      (mockKula.put as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        id: "req-1",
      });

      const result = await client.callTool({
        name: "update_requisition",
        arguments: {
          id: "req-1",
          additional_info: { field_1: "updated" },
          apply_to_group: true,
          reapproval_note: "Updated priority",
          job_id: "job-5",
        },
      });

      expect(mockKula.put).toHaveBeenCalledWith("/v1/requisitions/req-1", {
        additional_info: { field_1: "updated" },
        apply_to_group: true,
        reapproval_note: "Updated priority",
        job_id: "job-5",
      });
      expect(result.isError).toBeFalsy();
    });

    it("supports null job_id to remove association", async () => {
      (mockKula.put as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        id: "req-1",
      });

      const result = await client.callTool({
        name: "update_requisition",
        arguments: { id: "req-1", job_id: null },
      });

      expect(mockKula.put).toHaveBeenCalledWith("/v1/requisitions/req-1", {
        job_id: null,
      });
      expect(result.isError).toBeFalsy();
    });
  });

  describe("close_requisition", () => {
    it("posts to close endpoint", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        id: "req-1",
        status: "closed",
      });

      const result = await client.callTool({
        name: "close_requisition",
        arguments: { id: "req-1", apply_to_group: true },
      });

      expect(mockKula.post).toHaveBeenCalledWith(
        "/v1/requisitions/req-1/close",
        { apply_to_group: true }
      );
      expect(result.isError).toBeFalsy();
    });

    it("works without apply_to_group", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        id: "req-1",
        status: "closed",
      });

      const result = await client.callTool({
        name: "close_requisition",
        arguments: { id: "req-1" },
      });

      expect(mockKula.post).toHaveBeenCalledWith(
        "/v1/requisitions/req-1/close",
        {}
      );
      expect(result.isError).toBeFalsy();
    });
  });

  describe("error handling", () => {
    it("returns isError true when client throws on get_requisition", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error("Kula API error 404: Not Found")
      );

      const result = await client.callTool({
        name: "get_requisition",
        arguments: { id: "bad" },
      });

      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;
      expect(text).toContain("404");
    });

    it("handles Error in list_requisitions", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
      const result = await client.callTool({ name: "list_requisitions", arguments: {} });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws in list_requisitions", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "list_requisitions", arguments: {} });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws in get_requisition", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "get_requisition", arguments: { id: "x" } });
      expect(result.isError).toBe(true);
    });

    it("handles Error in list_requisition_fields", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
      const result = await client.callTool({ name: "list_requisition_fields", arguments: {} });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws in list_requisition_fields", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "list_requisition_fields", arguments: {} });
      expect(result.isError).toBe(true);
    });

    it("handles Error in create_requisition", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
      const result = await client.callTool({ name: "create_requisition", arguments: {} });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws in create_requisition", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "create_requisition", arguments: {} });
      expect(result.isError).toBe(true);
    });

    it("handles Error in update_requisition", async () => {
      (mockKula.put as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
      const result = await client.callTool({ name: "update_requisition", arguments: { id: "x" } });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws in update_requisition", async () => {
      (mockKula.put as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "update_requisition", arguments: { id: "x" } });
      expect(result.isError).toBe(true);
    });

    it("handles Error in close_requisition", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
      const result = await client.callTool({ name: "close_requisition", arguments: { id: "x" } });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws in close_requisition", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "close_requisition", arguments: { id: "x" } });
      expect(result.isError).toBe(true);
    });
  });
});
