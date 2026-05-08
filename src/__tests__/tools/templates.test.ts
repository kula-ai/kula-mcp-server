import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { register } from "../../tools/templates.js";
import { createMockClient, setupMcpTest } from "../helpers.js";
import type { KulaClient } from "../../client.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

describe("templates tools", () => {
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

  describe("list_scorecard_templates", () => {
    it("splits department_ids/office_ids/employment_types and forwards filters", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

      await client.callTool({
        name: "list_scorecard_templates",
        arguments: {
          query: "engineering",
          department_ids: "3,4",
          office_ids: "10",
          employment_types: "full_time,contract",
        },
      });

      expect(mockKula.get).toHaveBeenCalledWith(
        "/v1/scorecard_templates",
        expect.objectContaining({
          query: "engineering",
          department_ids: [3, 4],
          office_ids: [10],
          employment_types: ["full_time", "contract"],
        })
      );
    });

    it("returns isError on client failure", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("boom"));
      const result = await client.callTool({ name: "list_scorecard_templates", arguments: {} });
      expect(result.isError).toBe(true);
    });

    it("drops invalid CSV entries (NaN numbers, empty strings)", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });
      await client.callTool({
        name: "list_scorecard_templates",
        arguments: { department_ids: "3,bad,4", employment_types: "full_time,,contract" },
      });
      expect(mockKula.get).toHaveBeenCalledWith(
        "/v1/scorecard_templates",
        expect.objectContaining({
          department_ids: [3, 4],
          employment_types: ["full_time", "contract"],
        })
      );
    });

    it("works with no filters (all optional)", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });
      const result = await client.callTool({ name: "list_scorecard_templates", arguments: {} });
      expect(result.isError).toBeFalsy();
    });
  });

  describe("get_scorecard_template", () => {
    it("calls GET /v1/scorecard_templates/:id", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: { id: 7 } });
      await client.callTool({ name: "get_scorecard_template", arguments: { id: "7" } });
      expect(mockKula.get).toHaveBeenCalledWith("/v1/scorecard_templates/7");
    });
  });

  describe("list_email_templates", () => {
    it("splits categories and owner_ids, passes channel through", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

      await client.callTool({
        name: "list_email_templates",
        arguments: {
          channel: "calendar_invite",
          categories: "interview_coordination,interviewer_coordination",
          owner_ids: "1,2",
        },
      });

      expect(mockKula.get).toHaveBeenCalledWith(
        "/v1/email_templates",
        expect.objectContaining({
          channel: "calendar_invite",
          categories: ["interview_coordination", "interviewer_coordination"],
          owner_ids: [1, 2],
        })
      );
    });

    it("works with no filters (all optional)", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });
      const result = await client.callTool({ name: "list_email_templates", arguments: {} });
      expect(result.isError).toBeFalsy();
    });
  });

  describe("get_email_template", () => {
    it("calls GET /v1/email_templates/:id", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: { id: 88 } });
      await client.callTool({ name: "get_email_template", arguments: { id: "88" } });
      expect(mockKula.get).toHaveBeenCalledWith("/v1/email_templates/88");
    });
  });

  describe("error paths", () => {
    it.each([
      ["get_scorecard_template", { id: "1" }],
      ["list_email_templates", {}],
      ["get_email_template", { id: "1" }],
    ] as const)("%s returns isError on client failure", async (name, args) => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("boom"));
      const result = await client.callTool({ name, arguments: args });
      expect(result.isError).toBe(true);
    });
  });
});
