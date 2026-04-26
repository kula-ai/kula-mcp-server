import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { register } from "../../tools/interviews.js";
import { createMockClient, setupMcpTest } from "../helpers.js";
import type { KulaClient } from "../../client.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

describe("interviews tools", () => {
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

  describe("list_interviews", () => {
    it("converts application_id to integer", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

      await client.callTool({
        name: "list_interviews",
        arguments: { application_id: "7" },
      });

      const call = (mockKula.get as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[0]).toBe("/v1/interviews");
      expect(call[1].application_id).toBe(7);
    });

    it("passes start_time filters", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

      await client.callTool({
        name: "list_interviews",
        arguments: {
          start_time_after: "2024-06-01T00:00:00Z",
          start_time_before: "2024-06-30T23:59:59Z",
        },
      });

      const call = (mockKula.get as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[1].start_time_after).toBe("2024-06-01T00:00:00Z");
      expect(call[1].start_time_before).toBe("2024-06-30T23:59:59Z");
    });

    it("works with no params", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

      const result = await client.callTool({ name: "list_interviews", arguments: {} });
      expect(result.isError).toBeFalsy();
    });

    it("returns isError true on failure", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
      const result = await client.callTool({ name: "list_interviews", arguments: {} });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "list_interviews", arguments: {} });
      expect(result.isError).toBe(true);
    });
  });

  describe("get_interview", () => {
    it("calls correct endpoint with ID", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        id: "int-99",
        start_time: "2024-06-01T10:00:00Z",
      });

      const result = await client.callTool({
        name: "get_interview",
        arguments: { id: "int-99" },
      });

      expect(mockKula.get).toHaveBeenCalledWith("/v1/interviews/int-99");
      expect(result.isError).toBeFalsy();
    });

    it("returns isError true on failure", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
      const result = await client.callTool({ name: "get_interview", arguments: { id: "x" } });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "get_interview", arguments: { id: "x" } });
      expect(result.isError).toBe(true);
    });
  });

  describe("create_interview", () => {
    it("posts required fields with correct types", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: "int-1" });

      const result = await client.callTool({
        name: "create_interview",
        arguments: {
          application_id: "5",
          start_time: "2024-07-01T10:00:00Z",
          end_time: "2024-07-01T11:00:00Z",
        },
      });

      expect(mockKula.post).toHaveBeenCalledWith("/v1/interviews", expect.objectContaining({
        application_id: 5,
        start_time: "2024-07-01T10:00:00Z",
        end_time: "2024-07-01T11:00:00Z",
      }));
      expect(result.isError).toBeFalsy();
    });

    it("converts interviewer_user_ids to integer array", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: "int-2" });

      await client.callTool({
        name: "create_interview",
        arguments: {
          application_id: "5",
          start_time: "2024-07-01T10:00:00Z",
          end_time: "2024-07-01T11:00:00Z",
          interviewer_user_ids: "10,20,30",
        },
      });

      const call = (mockKula.post as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[1].interviewer_user_ids).toEqual([10, 20, 30]);
    });

    it("converts scorecard_required to boolean", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: "int-3" });

      await client.callTool({
        name: "create_interview",
        arguments: {
          application_id: "5",
          start_time: "2024-07-01T10:00:00Z",
          end_time: "2024-07-01T11:00:00Z",
          scorecard_required: "true",
          note_taker_enabled: "false",
        },
      });

      const call = (mockKula.post as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[1].scorecard_required).toBe(true);
      expect(call[1].note_taker_enabled).toBe(false);
    });

    it("sends name, timezone, location, kind in create_interview", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: "int-5" });

      await client.callTool({
        name: "create_interview",
        arguments: {
          application_id: "5",
          start_time: "2024-07-01T10:00:00Z",
          end_time: "2024-07-01T11:00:00Z",
          name: "Culture Fit",
          timezone: "America/Los_Angeles",
          location: "Zoom",
          kind: "video",
        },
      });

      const call = (mockKula.post as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[1].name).toBe("Culture Fit");
      expect(call[1].timezone).toBe("America/Los_Angeles");
      expect(call[1].location).toBe("Zoom");
      expect(call[1].kind).toBe("video");
    });

    it("sends candidate_description, interviewer_description, calendar_visibility, scorecard_feedback_description, scorecard_rating_description", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: "int-4" });

      await client.callTool({
        name: "create_interview",
        arguments: {
          application_id: "5",
          start_time: "2024-07-01T10:00:00Z",
          end_time: "2024-07-01T11:00:00Z",
          candidate_description: "Bring your portfolio",
          interviewer_description: "Ask about architecture",
          calendar_visibility: "private",
          scorecard_feedback_description: "Be specific",
          scorecard_rating_description: "1 to 5 scale",
        },
      });

      const call = (mockKula.post as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[1].candidate_description).toBe("Bring your portfolio");
      expect(call[1].interviewer_description).toBe("Ask about architecture");
      expect(call[1].calendar_visibility).toBe("private");
      expect(call[1].scorecard_feedback_description).toBe("Be specific");
      expect(call[1].scorecard_rating_description).toBe("1 to 5 scale");
    });

    it("returns isError true on failure", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
      const result = await client.callTool({
        name: "create_interview",
        arguments: {
          application_id: "1",
          start_time: "2024-07-01T10:00:00Z",
          end_time: "2024-07-01T11:00:00Z",
        },
      });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({
        name: "create_interview",
        arguments: {
          application_id: "1",
          start_time: "2024-07-01T10:00:00Z",
          end_time: "2024-07-01T11:00:00Z",
        },
      });
      expect(result.isError).toBe(true);
    });
  });

  describe("update_interview", () => {
    it("patches correct endpoint with optional fields", async () => {
      (mockKula.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: "int-5" });

      const result = await client.callTool({
        name: "update_interview",
        arguments: {
          id: "int-5",
          start_time: "2024-07-02T09:00:00Z",
          scorecard_required: "true",
        },
      });

      expect(mockKula.patch).toHaveBeenCalledWith("/v1/interviews/int-5", expect.objectContaining({
        start_time: "2024-07-02T09:00:00Z",
        scorecard_required: true,
      }));
      expect(result.isError).toBeFalsy();
    });

    it("converts interviewer_user_ids to integer array", async () => {
      (mockKula.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: "int-6" });

      await client.callTool({
        name: "update_interview",
        arguments: { id: "int-6", interviewer_user_ids: "5,6,7" },
      });

      const call = (mockKula.patch as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[1].interviewer_user_ids).toEqual([5, 6, 7]);
    });

    it("sends name, timezone, location, candidate_description, interviewer_description, calendar_visibility", async () => {
      (mockKula.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: "int-7" });

      await client.callTool({
        name: "update_interview",
        arguments: {
          id: "int-7",
          end_time: "2024-07-02T10:00:00Z",
          name: "Technical Round",
          timezone: "America/New_York",
          location: "Room 5",
          candidate_description: "Prepare algorithm questions",
          interviewer_description: "Focus on system design",
          calendar_visibility: "public",
        },
      });

      const call = (mockKula.patch as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[1].end_time).toBe("2024-07-02T10:00:00Z");
      expect(call[1].name).toBe("Technical Round");
      expect(call[1].timezone).toBe("America/New_York");
      expect(call[1].location).toBe("Room 5");
      expect(call[1].candidate_description).toBe("Prepare algorithm questions");
      expect(call[1].interviewer_description).toBe("Focus on system design");
      expect(call[1].calendar_visibility).toBe("public");
    });

    it("sends note_taker_enabled, scorecard_feedback_description, scorecard_rating_description", async () => {
      (mockKula.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: "int-8" });

      await client.callTool({
        name: "update_interview",
        arguments: {
          id: "int-8",
          note_taker_enabled: "true",
          scorecard_feedback_description: "Please be detailed",
          scorecard_rating_description: "Rate 1-5",
        },
      });

      const call = (mockKula.patch as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[1].note_taker_enabled).toBe(true);
      expect(call[1].scorecard_feedback_description).toBe("Please be detailed");
      expect(call[1].scorecard_rating_description).toBe("Rate 1-5");
    });

    it("returns isError true on failure", async () => {
      (mockKula.patch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
      const result = await client.callTool({ name: "update_interview", arguments: { id: "x" } });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws", async () => {
      (mockKula.patch as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "update_interview", arguments: { id: "x" } });
      expect(result.isError).toBe(true);
    });
  });

  describe("cancel_interview", () => {
    it("calls delete endpoint and returns success message", async () => {
      (mockKula.delete as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);

      const result = await client.callTool({
        name: "cancel_interview",
        arguments: { id: "int-7" },
      });

      expect(mockKula.delete).toHaveBeenCalledWith("/v1/interviews/int-7");
      expect(result.isError).toBeFalsy();
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain("cancelled");
    });

    it("returns isError true on failure", async () => {
      (mockKula.delete as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
      const result = await client.callTool({ name: "cancel_interview", arguments: { id: "x" } });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws", async () => {
      (mockKula.delete as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "cancel_interview", arguments: { id: "x" } });
      expect(result.isError).toBe(true);
    });
  });
});
