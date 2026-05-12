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
    it("splits CSV id filters into number arrays and forwards them", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

      await client.callTool({
        name: "list_interviews",
        arguments: {
          job_ids: "13,42",
          candidate_ids: "1001",
          meeting_status: "ended,cancelled",
          ai_note_taker_enabled: "true",
        },
      });

      expect(mockKula.get).toHaveBeenCalledWith(
        "/v1/interviews",
        expect.objectContaining({
          job_ids: [13, 42],
          candidate_ids: [1001],
          meeting_status: ["ended", "cancelled"],
          ai_note_taker_enabled: true,
        })
      );
    });

    it("works with no params", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });
      const result = await client.callTool({ name: "list_interviews", arguments: {} });
      expect(result.isError).toBeFalsy();
    });

    it("returns isError on client failure", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("boom"));
      const result = await client.callTool({ name: "list_interviews", arguments: {} });
      expect(result.isError).toBe(true);
    });

    it("drops non-numeric values when CSV contains garbage", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });
      await client.callTool({
        name: "list_interviews",
        arguments: { job_ids: "1,not-a-number,2" },
      });
      expect(mockKula.get).toHaveBeenCalledWith(
        "/v1/interviews",
        expect.objectContaining({ job_ids: [1, 2] })
      );
    });

    it("forwards every optional filter when all are provided", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

      await client.callTool({
        name: "list_interviews",
        arguments: {
          page: "1", limit: "20",
          job_ids: "1", application_ids: "2", candidate_ids: "3",
          interviewer_ids: "4", organizer_ids: "5", recruiter_ids: "6",
          department_ids: "7", office_ids: "8",
          meeting_status: "ended", kind: "panel", location: "zoom",
          ai_note_taker_enabled: "false",
          start_time_after: "2026-05-01T00:00:00Z",
          start_time_before: "2026-05-31T00:00:00Z",
          created_after: "2026-01-01T00:00:00Z",
          created_before: "2026-12-31T00:00:00Z",
          updated_after: "2026-01-01T00:00:00Z",
          updated_before: "2026-12-31T00:00:00Z",
          sort_by: "start_time", sort_order: "asc",
        },
      });

      expect(mockKula.get).toHaveBeenCalledWith(
        "/v1/interviews",
        expect.objectContaining({
          job_ids: [1], organizer_ids: [5], recruiter_ids: [6], department_ids: [7],
          location: ["zoom"], kind: ["panel"], ai_note_taker_enabled: false,
          interviewer_ids: [4], application_ids: [2], office_ids: [8],
        })
      );
    });
  });

  describe("list_application_interviews", () => {
    it("calls GET /v1/applications/:application_id/interviews forwarding every optional filter", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });
      await client.callTool({
        name: "list_application_interviews",
        arguments: {
          application_id: 16966,
          page: "1", limit: "10",
          interviewer_ids: "4,5", organizer_ids: "9",
          meeting_status: "ended,cancelled", kind: "panel", location: "zoom",
          ai_note_taker_enabled: "true",
          start_time_after: "2026-05-01T00:00:00Z", start_time_before: "2026-05-31T00:00:00Z",
          created_after: "2026-01-01T00:00:00Z", created_before: "2026-12-31T00:00:00Z",
          updated_after: "2026-01-01T00:00:00Z", updated_before: "2026-12-31T00:00:00Z",
          sort_by: "start_time", sort_order: "asc",
        },
      });
      expect(mockKula.get).toHaveBeenCalledWith(
        "/v1/applications/16966/interviews",
        expect.objectContaining({
          interviewer_ids: [4, 5], organizer_ids: [9],
          meeting_status: ["ended", "cancelled"], kind: ["panel"], location: ["zoom"],
          ai_note_taker_enabled: true, limit: "10",
        })
      );
    });

    it("returns isError on client failure", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("boom"));
      const result = await client.callTool({ name: "list_application_interviews", arguments: { application_id: 1 } });
      expect(result.isError).toBe(true);
    });

    it("stringifies a non-Error rejection", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce("plain failure");
      const result = await client.callTool({ name: "list_application_interviews", arguments: { application_id: 1 } });
      expect(result.isError).toBe(true);
      expect((result.content as Array<{ text: string }>)[0].text).toContain("plain failure");
    });
  });

  describe("get_interview", () => {
    it("calls GET /v1/interviews/:id", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: { id: 7 } });
      await client.callTool({ name: "get_interview", arguments: { id: "7" } });
      expect(mockKula.get).toHaveBeenCalledWith("/v1/interviews/7");
    });
  });

  describe("create_interview", () => {
    it("posts to /v1/applications/:application_id/interviews", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: { id: 99 } });
      const args = {
        organizer_id: 1,
        application_id: 16966,
        start_time: "2026-05-12T17:00:00Z",
        duration_minutes: 30,
        timezone: "America/Los_Angeles",
        kind: "one_on_one",
        location: "google_meet",
        interviewer_ids: [1],
      };
      await client.callTool({ name: "create_interview", arguments: args });
      const { application_id, ...body } = args;
      expect(mockKula.post).toHaveBeenCalledWith(`/v1/applications/${application_id}/interviews`, body);
    });
  });

  describe("update_interview", () => {
    it("PATCHes /v1/interviews/:id without including id in body", async () => {
      (mockKula.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: {} });
      await client.callTool({
        name: "update_interview",
        arguments: { id: "7", duration_minutes: 60 },
      });
      expect(mockKula.patch).toHaveBeenCalledWith("/v1/interviews/7", { duration_minutes: 60 });
    });
  });

  describe("cancel_interview / mark_candidate_no_show / undo_candidate_no_show", () => {
    it("cancel posts to /cancel", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: {} });
      await client.callTool({ name: "cancel_interview", arguments: { id: "7" } });
      expect(mockKula.post).toHaveBeenCalledWith("/v1/interviews/7/cancel");
    });

    it("mark_candidate_no_show posts to the right path", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: {} });
      await client.callTool({ name: "mark_candidate_no_show", arguments: { id: "7" } });
      expect(mockKula.post).toHaveBeenCalledWith("/v1/interviews/7/mark_candidate_no_show");
    });

    it("undo_candidate_no_show posts to the right path", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: {} });
      await client.callTool({ name: "undo_candidate_no_show", arguments: { id: "7" } });
      expect(mockKula.post).toHaveBeenCalledWith("/v1/interviews/7/undo_candidate_no_show");
    });
  });

  describe("availability flow", () => {
    it("check_interviewers_availability posts the body", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: { poll_id: "abc123def456abc123def456" } });
      await client.callTool({
        name: "check_interviewers_availability",
        arguments: {
          organizer_id: 1,
          interviewer_ids: [2, 3],
          start_time: "2026-05-12T00:00:00Z",
          duration_minutes: 30,
          interview_kind: "panel",
          timezone: "UTC",
        },
      });
      expect(mockKula.post).toHaveBeenCalledWith(
        "/v1/interviews/interviewers_availability",
        expect.objectContaining({ organizer_id: 1, interviewer_ids: [2, 3] })
      );
    });

    it("get_interviewers_availability_result GETs the polling endpoint", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: { status: "succeeded" } });
      await client.callTool({
        name: "get_interviewers_availability_result",
        arguments: { poll_id: "abc123def456abc123def456" },
      });
      expect(mockKula.get).toHaveBeenCalledWith("/v1/interviews/interviewers_availability/abc123def456abc123def456");
    });
  });

  describe("list_valid_organizers / list_conference_hosts", () => {
    it("list_valid_organizers passes job_id + query", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });
      await client.callTool({
        name: "list_valid_organizers",
        arguments: { job_id: 42, query: "sai" },
      });
      expect(mockKula.get).toHaveBeenCalledWith(
        "/v1/interviews/valid_organizers",
        expect.objectContaining({ job_id: 42, query: "sai" })
      );
    });

    it("list_conference_hosts passes provider", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });
      await client.callTool({
        name: "list_conference_hosts",
        arguments: { provider: "zoom" },
      });
      expect(mockKula.get).toHaveBeenCalledWith(
        "/v1/interviews/conference_hosts",
        expect.objectContaining({ provider: "zoom" })
      );
    });
  });

  describe("get_interview_plan", () => {
    it("GETs the plan for a job", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: { job_id: 88, stages: [] } });
      await client.callTool({ name: "get_interview_plan", arguments: { job_id: "88" } });
      expect(mockKula.get).toHaveBeenCalledWith("/v1/jobs/88/interview_plan");
    });
  });

  describe("error paths", () => {
    const fail = (method: "get" | "post" | "patch") => () => {
      (mockKula[method] as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("boom"));
    };

    it.each([
      ["get_interview", "get", { id: "1" }],
      ["create_interview", "post", {
        organizer_id: 1, application_id: 1, start_time: "2026-05-12T17:00:00Z",
        duration_minutes: 30, timezone: "UTC", kind: "one_on_one", location: "google_meet",
        interviewer_ids: [1],
      }],
      ["update_interview", "patch", { id: "1", duration_minutes: 60 }],
      ["cancel_interview", "post", { id: "1" }],
      ["mark_candidate_no_show", "post", { id: "1" }],
      ["undo_candidate_no_show", "post", { id: "1" }],
      ["check_interviewers_availability", "post", {
        organizer_id: 1, interviewer_ids: [1], start_time: "2026-05-12T00:00:00Z",
        duration_minutes: 30, interview_kind: "panel", timezone: "UTC",
      }],
      ["get_interviewers_availability_result", "get", { poll_id: "abc" }],
      ["list_valid_organizers", "get", { job_id: 1 }],
      ["list_conference_hosts", "get", { provider: "zoom" }],
      ["get_interview_plan", "get", { job_id: "1" }],
    ] as const)("%s returns isError on client failure", async (name, method, args) => {
      fail(method)();
      const result = await client.callTool({ name, arguments: args });
      expect(result.isError).toBe(true);
    });
  });
});
