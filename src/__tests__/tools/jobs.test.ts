import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { register } from "../../tools/jobs.js";
import { createMockClient, setupMcpTest } from "../helpers.js";
import type { KulaClient } from "../../client.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

describe("jobs tools", () => {
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

  describe("list_jobs", () => {
    it("passes filter params to client", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [{ id: "job-1" }],
      });

      const result = await client.callTool({
        name: "list_jobs",
        arguments: { page: "1", limit: "10", status: "published" },
      });

      expect(mockKula.get).toHaveBeenCalledWith("/v1/jobs", expect.objectContaining({
        page: "1",
        limit: "10",
        status: ["published"],
      }));
      expect(result.isError).toBeFalsy();
    });

    it("works with no params", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [],
      });

      const result = await client.callTool({
        name: "list_jobs",
        arguments: {},
      });
      expect(result.isError).toBeFalsy();
    });

    it("splits department_ids and office_ids into integer arrays", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

      await client.callTool({
        name: "list_jobs",
        arguments: { department_ids: "3,4", office_ids: "10,11" },
      });

      const call = (mockKula.get as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[1].department_ids).toEqual([3, 4]);
      expect(call[1].office_ids).toEqual([10, 11]);
    });

  });

  describe("search_jobs", () => {
    it("posts query to search endpoint", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

      await client.callTool({
        name: "search_jobs",
        arguments: { query: "engineer" },
      });

      const call = (mockKula.post as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[0]).toBe("/v1/jobs/search");
      expect(call[1].query).toBe("engineer");
    });

    it("works with no params", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

      const result = await client.callTool({ name: "search_jobs", arguments: {} });
      expect(result.isError).toBeFalsy();
    });

    it("splits department_ids and office_ids into integer arrays", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

      await client.callTool({
        name: "search_jobs",
        arguments: { department_ids: "3,4", office_ids: "10,11" },
      });

      const call = (mockKula.post as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[1].department_ids).toEqual([3, 4]);
      expect(call[1].office_ids).toEqual([10, 11]);
    });

    it("passes employment_types, workplace, confidential, job_post_listed, recruiter/hiring manager IDs", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

      await client.callTool({
        name: "search_jobs",
        arguments: {
          employment_types: "full_time,part_time",
          workplace: "remote,hybrid",
          confidential: true,
          job_post_listed: false,
          primary_recruiter_ids: "1,2",
          primary_hiring_manager_ids: "3",
        },
      });

      const call = (mockKula.post as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[1].employment_types).toEqual(["full_time", "part_time"]);
      expect(call[1].workplace).toEqual(["remote", "hybrid"]);
      expect(call[1].confidential).toBe(true);
      expect(call[1].job_post_listed).toBe(false);
      expect(call[1].primary_recruiter_ids).toEqual([1, 2]);
      expect(call[1].primary_hiring_manager_ids).toEqual([3]);
    });

    it("splits status and passes page and limit when provided", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

      await client.callTool({
        name: "search_jobs",
        arguments: { status: "published,closed", page: "2", limit: "10" },
      });

      const call = (mockKula.post as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(call[1].status).toEqual(["published", "closed"]);
      expect(call[1].page).toBe(2);
      expect(call[1].limit).toBe(10);
    });

    it("returns job fields from populated response", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [
          {
            id: 1,
            name: "Senior Engineer",
            status: "published",
            department: { id: 10, name: "Engineering" },
            offices: [{ id: 5, name: "London" }],
            stages: [{ id: 2, name: "Phone Screen", position: 1 }],
          },
        ],
        meta: { total: 1, page: 1, limit: 20 },
      });

      const result = await client.callTool({ name: "search_jobs", arguments: { query: "engineer" } });

      expect(result.isError).toBeFalsy();
      const json = JSON.parse((result.content as Array<{ type: string; text: string }>)[0].text);
      expect(json.data[0].id).toBe(1);
      expect(json.data[0].name).toBe("Senior Engineer");
      expect(json.data[0].status).toBe("published");
      expect(json.data[0].department.name).toBe("Engineering");
      expect(json.data[0].offices[0].name).toBe("London");
      expect(json.data[0].stages[0].name).toBe("Phone Screen");
    });

    it("returns isError true when client throws", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
      const result = await client.callTool({ name: "search_jobs", arguments: {} });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws in search_jobs", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce("string error");
      const result = await client.callTool({ name: "search_jobs", arguments: {} });
      expect(result.isError).toBe(true);
    });
  });

  describe("get_job", () => {
    it("calls correct endpoint with ID", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        id: "job-42",
        title: "Engineer",
      });

      const result = await client.callTool({
        name: "get_job",
        arguments: { id: "job-42" },
      });

      expect(mockKula.get).toHaveBeenCalledWith("/v1/jobs/job-42");

      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;
      expect(JSON.parse(text).title).toBe("Engineer");
    });
  });

  describe("get_job_hiring_team", () => {
    it("calls the hiring-team endpoint with job ID", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        hiring_managers: [{ id: 1, name: "Ada", is_primary: true }],
        recruiters: [],
        coordinators: [],
        external_recruiters: [],
      });

      const result = await client.callTool({
        name: "get_job_hiring_team",
        arguments: { job_id: "job-42" },
      });

      expect(mockKula.get).toHaveBeenCalledWith("/v1/jobs/job-42/hiring-team");

      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;
      expect(JSON.parse(text).hiring_managers[0].is_primary).toBe(true);
    });

    it("handles non-Error throws in get_job_hiring_team", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "get_job_hiring_team", arguments: { job_id: "x" } });
      expect(result.isError).toBe(true);
    });
  });

  describe("error handling", () => {
    it("returns isError true when client throws", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error("Kula API error 500: Internal Server Error")
      );

      const result = await client.callTool({
        name: "get_job",
        arguments: { id: "bad" },
      });

      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;
      expect(text).toContain("500");
    });

    it("handles Error in list_jobs", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
      const result = await client.callTool({ name: "list_jobs", arguments: {} });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws in list_jobs", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "list_jobs", arguments: {} });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws in get_job", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "get_job", arguments: { id: "x" } });
      expect(result.isError).toBe(true);
    });
  });
});
