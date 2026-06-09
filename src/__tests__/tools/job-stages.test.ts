import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { register } from "../../tools/job-stages.js";
import { createMockClient, setupMcpTest } from "../helpers.js";
import type { KulaClient } from "../../client.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

describe("job-stages tools", () => {
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

  describe("list_job_stages", () => {
    it("calls the correct endpoint with job_id", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [{ id: 10, name: "Phone Screen" }],
      });

      const result = await client.callTool({
        name: "list_job_stages",
        arguments: { job_id: "42" },
      });

      const call = (mockKula.get as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[0]).toBe("/v1/jobs/42/stages");
      expect(result.isError).toBeFalsy();
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(JSON.parse(text).data[0].name).toBe("Phone Screen");
    });

    it("returns isError true on failure", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("not found"));
      const result = await client.callTool({ name: "list_job_stages", arguments: { job_id: "99" } });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "list_job_stages", arguments: { job_id: "1" } });
      expect(result.isError).toBe(true);
    });
  });

  describe("create_job_stage", () => {
    it("posts stage with required name", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 20, name: "Technical" });

      const result = await client.callTool({
        name: "create_job_stage",
        arguments: { job_id: "42", name: "Technical" },
      });

      const call = (mockKula.post as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[0]).toBe("/v1/jobs/42/stages");
      expect(call[1].name).toBe("Technical");
      expect(call[1].milestone_id).toBeUndefined();
      expect(result.isError).toBeFalsy();
    });

    it("passes optional fields as numbers", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 21, name: "Offer" });

      await client.callTool({
        name: "create_job_stage",
        arguments: { job_id: "42", name: "Offer", milestone_id: "5", position: "3", candidate_review_time: "2" },
      });

      const call = (mockKula.post as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[1].milestone_id).toBe(5);
      expect(call[1].position).toBe(3);
      expect(call[1].candidate_review_time).toBe(2);
    });

    it("returns isError true on failure", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
      const result = await client.callTool({ name: "create_job_stage", arguments: { job_id: "1", name: "X" } });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "create_job_stage", arguments: { job_id: "1", name: "X" } });
      expect(result.isError).toBe(true);
    });
  });

  describe("list_stage_activities", () => {
    it("calls the correct endpoint with job_id and stage_id", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [{ id: 30, kind: "send_email" }],
      });

      const result = await client.callTool({
        name: "list_stage_activities",
        arguments: { job_id: "42", stage_id: "10" },
      });

      const call = (mockKula.get as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[0]).toBe("/v1/jobs/42/stages/10/activities");
      expect(result.isError).toBeFalsy();
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(JSON.parse(text).data[0].kind).toBe("send_email");
    });

    it("returns isError true on failure", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
      const result = await client.callTool({ name: "list_stage_activities", arguments: { job_id: "1", stage_id: "2" } });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "list_stage_activities", arguments: { job_id: "1", stage_id: "2" } });
      expect(result.isError).toBe(true);
    });
  });

  describe("list_job_stage_activities", () => {
    it("calls the job-level endpoint with only job_id", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [{ id: 30, kind: "send_email", stage_id: 10 }],
      });

      const result = await client.callTool({
        name: "list_job_stage_activities",
        arguments: { job_id: "42" },
      });

      const call = (mockKula.get as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[0]).toBe("/v1/jobs/42/stage-activities");
      expect(result.isError).toBeFalsy();
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(JSON.parse(text).data[0].stage_id).toBe(10);
    });

    it("returns isError true on failure", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
      const result = await client.callTool({ name: "list_job_stage_activities", arguments: { job_id: "1" } });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "list_job_stage_activities", arguments: { job_id: "1" } });
      expect(result.isError).toBe(true);
    });
  });
});
