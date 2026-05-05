import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { KulaClient } from "../client.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function textResponse(text: string, status = 200) {
  return new Response(text, {
    status,
    headers: { "content-type": "text/plain" },
  });
}

describe("KulaClient", () => {
  let client: KulaClient;

  beforeEach(() => {
    mockFetch.mockReset();
    client = new KulaClient("test-api-key");
  });

  describe("headers", () => {
    it("sends correct Authorization and Content-Type headers", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ ok: true }));
      await client.get("/v1/test");

      const [, init] = mockFetch.mock.calls[0];
      expect(init.headers).toEqual({
        Authorization: "Bearer test-api-key",
        "Content-Type": "application/json",
      });
    });
  });

  describe("get()", () => {
    it("builds the correct URL with base URL", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}));
      await client.get("/v1/job-posts");

      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.kula.ai/v1/job-posts");
    });

    it("appends query params", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}));
      await client.get("/v1/job-posts", { page: "1", per_page: "10" });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("page=1");
      expect(url).toContain("per_page=10");
    });

    it("serializes array params with bracket notation", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}));
      await client.get("/v1/jobs", { department_ids: [1, 2, 3] });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("department_ids%5B%5D=1");
      expect(url).toContain("department_ids%5B%5D=2");
      expect(url).toContain("department_ids%5B%5D=3");
    });

    it("serializes boolean params as strings", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}));
      await client.get("/v1/sources", { enabled: true });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("enabled=true");
    });

    it("skips undefined params", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}));
      await client.get("/v1/job-posts", {
        page: "1",
        status: undefined,
      });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("page=1");
      expect(url).not.toContain("status");
    });

    it("uses GET method", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}));
      await client.get("/v1/test");

      const [, init] = mockFetch.mock.calls[0];
      expect(init.method).toBe("GET");
    });
  });

  describe("post()", () => {
    it("sends POST with JSON body", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ id: "1" }));
      await client.post("/v1/webhooks", { url: "https://example.com" });

      const [, init] = mockFetch.mock.calls[0];
      expect(init.method).toBe("POST");
      expect(init.body).toBe(JSON.stringify({ url: "https://example.com" }));
    });

    it("sends POST without body", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}));
      await client.post("/v1/webhooks/123/enable");

      const [, init] = mockFetch.mock.calls[0];
      expect(init.method).toBe("POST");
      expect(init.body).toBeUndefined();
    });
  });

  describe("put()", () => {
    it("sends PUT with JSON body", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}));
      await client.put("/v1/webhooks/123", { name: "updated" });

      const [, init] = mockFetch.mock.calls[0];
      expect(init.method).toBe("PUT");
      expect(init.body).toBe(JSON.stringify({ name: "updated" }));
    });
  });

  describe("patch()", () => {
    it("sends PATCH with JSON body", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}));
      await client.patch("/v1/webhooks/123", { name: "patched" });

      const [, init] = mockFetch.mock.calls[0];
      expect(init.method).toBe("PATCH");
      expect(init.body).toBe(JSON.stringify({ name: "patched" }));
    });
  });

  describe("delete()", () => {
    it("sends DELETE", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}));
      await client.delete("/v1/webhooks/123");

      const [, init] = mockFetch.mock.calls[0];
      expect(init.method).toBe("DELETE");
    });
  });

  describe("postFormData()", () => {
    it("sends FormData without Content-Type header", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ id: "file-1" }));
      const formData = new FormData();
      formData.append("file", new Blob(["test"]), "test.pdf");

      await client.postFormData("/v1/attachments", formData);

      const [, init] = mockFetch.mock.calls[0];
      expect(init.method).toBe("POST");
      expect(init.headers).toEqual({
        Authorization: "Bearer test-api-key",
      });
      expect(init.headers["Content-Type"]).toBeUndefined();
      expect(init.body).toBe(formData);
    });

    it("throws on non-ok response", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response("Bad Request", {
          status: 400,
          headers: { "content-type": "text/plain" },
        })
      );
      const formData = new FormData();
      formData.append("file", new Blob(["test"]), "test.pdf");

      await expect(
        client.postFormData("/v1/attachments", formData)
      ).rejects.toThrow("Kula API error 400: Bad Request");
    });

    it("returns text for non-JSON responses", async () => {
      mockFetch.mockResolvedValueOnce(textResponse("ok"));
      const formData = new FormData();
      formData.append("file", new Blob(["test"]), "test.pdf");

      const result = await client.postFormData("/v1/attachments", formData);
      expect(result).toBe("ok");
    });
  });

  describe("error handling", () => {
    it("throws on non-ok response with status and body", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response("Not Found", {
          status: 404,
          headers: { "content-type": "text/plain" },
        })
      );

      await expect(client.get("/v1/missing")).rejects.toThrow(
        "Kula API error 404: Not Found"
      );
    });

    it("throws on 500 error", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response("Internal Server Error", {
          status: 500,
          headers: { "content-type": "text/plain" },
        })
      );

      await expect(client.post("/v1/test", {})).rejects.toThrow(
        "Kula API error 500: Internal Server Error"
      );
    });
  });

  describe("content-type detection", () => {
    it("parses JSON responses", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ data: [1, 2, 3] }));
      const result = await client.get("/v1/test");
      expect(result).toEqual({ data: [1, 2, 3] });
    });

    it("returns text for non-JSON responses", async () => {
      mockFetch.mockResolvedValueOnce(textResponse("ok"));
      const result = await client.get("/v1/test");
      expect(result).toBe("ok");
    });
  });

  describe("base URL", () => {
    it("uses default base URL", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}));
      await client.get("/v1/test");

      const [url] = mockFetch.mock.calls[0];
      expect(url).toMatch(/^https:\/\/api\.kula\.ai/);
    });

    it("uses custom base URL", async () => {
      const customClient = new KulaClient("key", "https://custom.api.com");
      mockFetch.mockResolvedValueOnce(jsonResponse({}));
      await customClient.get("/v1/test");

      const [url] = mockFetch.mock.calls[0];
      expect(url).toMatch(/^https:\/\/custom\.api\.com/);
    });
  });
});
