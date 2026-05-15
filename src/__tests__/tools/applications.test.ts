import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { register } from "../../tools/applications.js";
import { createMockClient, setupMcpTest } from "../helpers.js";
import type { KulaClient } from "../../client.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

describe("applications tools", () => {
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

  describe("list_applications", () => {
    it("passes filter params to client", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [{ id: "app-1" }],
      });

      const result = await client.callTool({
        name: "list_applications",
        arguments: { page: "1", limit: "10", job_id: "5", status: "submitted" },
      });

      expect(mockKula.get).toHaveBeenCalledWith("/v1/applications", {
        page: "1",
        limit: "10",
        job_id: 5,
        status: ["submitted"],
        sort_by: undefined,
        sort_order: undefined,
        created_after: undefined,
        created_before: undefined,
        updated_after: undefined,
        updated_before: undefined,
      });
      expect(result.isError).toBeFalsy();
    });

    it("splits stage_ids and credited_to_user_ids into integer arrays", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

      await client.callTool({
        name: "list_applications",
        arguments: { stage_ids: "1,2,3", credited_to_user_ids: "10,20" },
      });

      const call = (mockKula.get as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[1].stage_ids).toEqual([1, 2, 3]);
      expect(call[1].credited_to_user_ids).toEqual([10, 20]);
    });
  });

  describe("get_application", () => {
    it("calls correct endpoint with ID", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        id: "app-42",
        status: "reviewed",
      });

      const result = await client.callTool({
        name: "get_application",
        arguments: { id: "app-42" },
      });

      expect(mockKula.get).toHaveBeenCalledWith("/v1/applications/app-42");

      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;
      expect(JSON.parse(text).status).toBe("reviewed");
    });
  });

  describe("update_application_stage", () => {
    it("patches stage_id as number to correct endpoint", async () => {
      (mockKula.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        id: "app-1",
        stage_id: 5,
      });

      const result = await client.callTool({
        name: "update_application_stage",
        arguments: { id: "app-1", stage_id: "5" },
      });

      expect(mockKula.patch).toHaveBeenCalledWith(
        "/v1/applications/app-1/stage",
        { stage_id: 5 }
      );
      expect(result.isError).toBeFalsy();
    });

    it("includes requisition_code when provided", async () => {
      (mockKula.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: "app-1" });

      await client.callTool({
        name: "update_application_stage",
        arguments: { id: "app-1", stage_id: "5", requisition_code: "REQ-42" },
      });

      expect(mockKula.patch).toHaveBeenCalledWith(
        "/v1/applications/app-1/stage",
        { stage_id: 5, requisition_code: "REQ-42" }
      );
    });
  });

  describe("list_application_notes", () => {
    it("calls correct endpoint with application_id", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });
      await client.callTool({ name: "list_application_notes", arguments: { application_id: "5", page: "1" } });
      expect(mockKula.get).toHaveBeenCalledWith("/v1/applications/5/notes", { page: "1", limit: undefined });
    });
  });

  describe("create_application_note", () => {
    it("posts note body to correct endpoint", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: "n-1" });
      await client.callTool({ name: "create_application_note", arguments: { application_id: "5", body: "Great candidate" } });
      expect(mockKula.post).toHaveBeenCalledWith("/v1/applications/5/notes", { body: "Great candidate" });
    });

    it("passes notify_recruiter boolean to client", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: "n-1" });
      await client.callTool({ name: "create_application_note", arguments: { application_id: "5", body: "Note", notify_recruiter: true } });
      const call = (mockKula.post as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[1].notify_recruiter).toBe(true);
    });
  });

  describe("upload_application_resume", () => {
    it("posts multipart form data with file blob", async () => {
      const fs = await import("node:fs/promises");
      const os = await import("node:os");
      const path = await import("node:path");
      const tmpFile = path.join(os.tmpdir(), `mcp-app-resume-${Date.now()}.pdf`);
      await fs.writeFile(tmpFile, "%PDF-1.4 minimal");

      (mockKula.postFormData as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        contact_resume_id: 42,
      });

      const result = await client.callTool({
        name: "upload_application_resume",
        arguments: { application_id: "7", resume_path: tmpFile },
      });

      const call = (mockKula.postFormData as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[0]).toBe("/v1/applications/7/resume");
      const fd = call[1] as FormData;
      expect(fd.get("file")).toBeInstanceOf(Blob);
      expect(result.isError).toBeFalsy();

      await fs.unlink(tmpFile);
    });

    it("returns isError when resume_path does not exist", async () => {
      const result = await client.callTool({
        name: "upload_application_resume",
        arguments: { application_id: "7", resume_path: "/tmp/does-not-exist-mcp-app.pdf" },
      });
      expect(result.isError).toBe(true);
    });
  });

  describe("update_application_note", () => {
    it("patches note body to correct endpoint", async () => {
      (mockKula.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: "n-1" });
      await client.callTool({ name: "update_application_note", arguments: { application_id: "5", id: "n-1", body: "Updated" } });
      expect(mockKula.patch).toHaveBeenCalledWith("/v1/applications/5/notes/n-1", { body: "Updated" });
    });

    it("passes notify_recruiter boolean to client", async () => {
      (mockKula.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: "n-1" });
      await client.callTool({ name: "update_application_note", arguments: { application_id: "5", id: "n-1", notify_recruiter: true } });
      expect(mockKula.patch).toHaveBeenCalledWith("/v1/applications/5/notes/n-1", { notify_recruiter: true });
    });
  });

  describe("error handling", () => {
    it("returns isError true when client throws", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error("Kula API error 500: Internal Server Error")
      );

      const result = await client.callTool({
        name: "get_application",
        arguments: { id: "bad" },
      });

      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;
      expect(text).toContain("500");
    });

    it("handles Error in list_applications", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
      const result = await client.callTool({ name: "list_applications", arguments: {} });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws in list_applications", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "list_applications", arguments: {} });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws in get_application", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "get_application", arguments: { id: "x" } });
      expect(result.isError).toBe(true);
    });

    it("handles Error in update_application_stage", async () => {
      (mockKula.patch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
      const result = await client.callTool({ name: "update_application_stage", arguments: { id: "x", stage_id: "1" } });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws in update_application_stage", async () => {
      (mockKula.patch as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "update_application_stage", arguments: { id: "x", stage_id: "1" } });
      expect(result.isError).toBe(true);
    });

    it("handles errors in list_application_notes", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
      const result = await client.callTool({ name: "list_application_notes", arguments: { application_id: "5" } });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws in list_application_notes", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce("string error");
      const result = await client.callTool({ name: "list_application_notes", arguments: { application_id: "5" } });
      expect(result.isError).toBe(true);
    });

    it("handles errors in create_application_note", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
      const result = await client.callTool({ name: "create_application_note", arguments: { application_id: "5", body: "Note" } });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws in create_application_note", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce("string error");
      const result = await client.callTool({ name: "create_application_note", arguments: { application_id: "5", body: "Note" } });
      expect(result.isError).toBe(true);
    });

    it("handles errors in update_application_note", async () => {
      (mockKula.patch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
      const result = await client.callTool({ name: "update_application_note", arguments: { application_id: "5", id: "n-1", body: "Updated" } });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws in update_application_note", async () => {
      (mockKula.patch as ReturnType<typeof vi.fn>).mockRejectedValueOnce("string error");
      const result = await client.callTool({ name: "update_application_note", arguments: { application_id: "5", id: "n-1", body: "Updated" } });
      expect(result.isError).toBe(true);
    });

  });
});
