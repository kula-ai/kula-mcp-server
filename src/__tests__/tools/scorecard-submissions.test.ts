import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { register } from "../../tools/scorecard-submissions.js";
import { createMockClient, setupMcpTest } from "../helpers.js";
import type { KulaClient } from "../../client.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

describe("scorecard-submissions tools", () => {
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

  describe("list_scorecard_submissions", () => {
    it("calls correct endpoint with application_id in path", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [{ id: 1, status: "submitted" }],
      });

      const result = await client.callTool({
        name: "list_scorecard_submissions",
        arguments: { application_id: "42", page: "1", limit: "10" },
      });

      expect(mockKula.get).toHaveBeenCalledWith(
        "/v1/applications/42/scorecards",
        expect.objectContaining({ page: "1", limit: "10" })
      );
      expect(result.isError).toBeFalsy();
    });

    it("passes sort and date filter params", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

      await client.callTool({
        name: "list_scorecard_submissions",
        arguments: {
          application_id: "10",
          sort_by: "created_at",
          sort_order: "asc",
          created_after: "2024-01-01T00:00:00Z",
        },
      });

      const call = (mockKula.get as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[0]).toBe("/v1/applications/10/scorecards");
      expect(call[1]).toMatchObject({
        sort_by: "created_at",
        sort_order: "asc",
        created_after: "2024-01-01T00:00:00Z",
      });
    });

    it("splits status into array", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

      await client.callTool({
        name: "list_scorecard_submissions",
        arguments: { application_id: "5", status: "submitted,pending" },
      });

      const call = (mockKula.get as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[1].status).toEqual(["submitted", "pending"]);
    });

    it("returns isError true on Error failure", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error("Kula API error 404: Not Found")
      );

      const result = await client.callTool({
        name: "list_scorecard_submissions",
        arguments: { application_id: "999" },
      });

      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain("404");
    });

    it("handles non-Error throws", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({
        name: "list_scorecard_submissions",
        arguments: { application_id: "1" },
      });
      expect(result.isError).toBe(true);
    });
  });
});
