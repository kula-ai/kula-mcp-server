import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { register } from "../../tools/roles.js";
import { createMockClient, setupMcpTest } from "../helpers.js";
import type { KulaClient } from "../../client.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

describe("roles tools", () => {
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

  describe("list_roles", () => {
    it("calls GET /v1/roles", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });
      const result = await client.callTool({ name: "list_roles", arguments: {} });
      expect(mockKula.get).toHaveBeenCalledWith("/v1/roles", expect.any(Object));
      expect(result.isError).toBeFalsy();
    });

    it("returns isError on failure", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
      const result = await client.callTool({ name: "list_roles", arguments: {} });
      expect(result.isError).toBe(true);
    });
  });

  describe("get_role", () => {
    it("calls GET /v1/roles/:id", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: { id: 3, permissions: {} } });
      await client.callTool({ name: "get_role", arguments: { id: "3" } });
      expect(mockKula.get).toHaveBeenCalledWith("/v1/roles/3");
    });
  });
});
