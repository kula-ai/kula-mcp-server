import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { register } from "../../tools/users.js";
import { createMockClient, setupMcpTest } from "../helpers.js";
import type { KulaClient } from "../../client.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

describe("users tools", () => {
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

  describe("list_users", () => {
    it("calls users endpoint with no params", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });
      const result = await client.callTool({ name: "list_users", arguments: {} });
      expect(mockKula.get).toHaveBeenCalledWith("/v1/users", expect.any(Object));
      expect(result.isError).toBeFalsy();
    });

    it("passes status, role_id, department_id, office_id, permission, and query filters", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });
      await client.callTool({
        name: "list_users",
        arguments: {
          status: "active,pending",
          role_id: "1,2",
          department_id: "10",
          office_id: "20,30",
          permission: "manage_jobs,manage_org_users",
          query: "ada",
        },
      });
      const call = (mockKula.get as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[0]).toBe("/v1/users");
      expect(call[1]["status[]"]).toEqual(["active", "pending"]);
      expect(call[1]["role_id[]"]).toEqual([1, 2]);
      expect(call[1]["department_id[]"]).toEqual([10]);
      expect(call[1]["office_id[]"]).toEqual([20, 30]);
      expect(call[1]["permission[]"]).toEqual(["manage_jobs", "manage_org_users"]);
      expect(call[1].query).toBe("ada");
    });

    it("returns isError true on failure", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
      const result = await client.callTool({ name: "list_users", arguments: {} });
      expect(result.isError).toBe(true);
    });
  });

  describe("get_user", () => {
    it("calls GET /v1/users/:id", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: { id: 7 } });
      await client.callTool({ name: "get_user", arguments: { id: "7" } });
      expect(mockKula.get).toHaveBeenCalledWith("/v1/users/7");
    });
  });

  describe("create_user", () => {
    it("calls POST /v1/users with body", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: { id: 1 } });
      await client.callTool({
        name: "create_user",
        arguments: { email: "a@b.com", first_name: "Ada", org_role_id: 3, department_id: 5 },
      });
      const call = (mockKula.post as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[0]).toBe("/v1/users");
      expect(call[1]).toMatchObject({ email: "a@b.com", first_name: "Ada", org_role_id: 3, department_id: 5 });
    });
  });

  describe("update_user", () => {
    it("calls PATCH /v1/users/:id with body excluding id", async () => {
      (mockKula.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: { id: 7 } });
      await client.callTool({
        name: "update_user",
        arguments: { id: "7", first_name: "Ada", org_role_id: 4 },
      });
      const call = (mockKula.patch as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[0]).toBe("/v1/users/7");
      expect(call[1]).toEqual({ first_name: "Ada", org_role_id: 4 });
    });
  });

  describe("deactivate_user", () => {
    it("calls POST /v1/users/:id/deactivate", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: { id: 7 } });
      await client.callTool({ name: "deactivate_user", arguments: { id: "7" } });
      const call = (mockKula.post as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[0]).toBe("/v1/users/7/deactivate");
    });
  });

  describe("reactivate_user", () => {
    it("calls POST /v1/users/:id/reactivate", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: { id: 7 } });
      await client.callTool({ name: "reactivate_user", arguments: { id: "7" } });
      const call = (mockKula.post as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[0]).toBe("/v1/users/7/reactivate");
    });
  });
});
