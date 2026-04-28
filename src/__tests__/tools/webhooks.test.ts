import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { register } from "../../tools/webhooks.js";
import { createMockClient, setupMcpTest } from "../helpers.js";
import type { KulaClient } from "../../client.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

describe("webhooks tools", () => {
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

  describe("create_webhook", () => {
    it("sends required fields", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        id: "wh-1",
      });

      await client.callTool({
        name: "create_webhook",
        arguments: {
          url: "https://example.com/hook",
          name: "My Hook",
          subscribed_events: ["application.created"],
        },
      });

      expect(mockKula.post).toHaveBeenCalledWith("/v1/webhooks", {
        url: "https://example.com/hook",
        name: "My Hook",
        subscribed_events: ["application.created"],
      });
    });

    it("includes optional fields when provided", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        id: "wh-2",
      });

      await client.callTool({
        name: "create_webhook",
        arguments: {
          url: "https://example.com/hook",
          name: "My Hook",
          subscribed_events: ["application.created"],
          secret: "s3cret",
          description: "Test webhook",
          headers: { "X-Custom": "value" },
        },
      });

      expect(mockKula.post).toHaveBeenCalledWith("/v1/webhooks", {
        url: "https://example.com/hook",
        name: "My Hook",
        subscribed_events: ["application.created"],
        secret: "s3cret",
        description: "Test webhook",
        headers: { "X-Custom": "value" },
      });
    });
  });

  describe("update_webhook", () => {
    it("sends required fields via PATCH", async () => {
      (mockKula.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        id: "wh-1",
      });

      await client.callTool({
        name: "update_webhook",
        arguments: {
          id: "wh-1",
          url: "https://new.example.com",
          name: "Updated Hook",
          subscribed_events: ["application.updated"],
        },
      });

      expect(mockKula.patch).toHaveBeenCalledWith("/v1/webhooks/wh-1", {
        url: "https://new.example.com",
        name: "Updated Hook",
        subscribed_events: ["application.updated"],
      });
    });

    it("includes optional fields when provided", async () => {
      (mockKula.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        id: "wh-1",
      });

      await client.callTool({
        name: "update_webhook",
        arguments: {
          id: "wh-1",
          url: "https://new.example.com",
          name: "Updated Hook",
          subscribed_events: ["application.updated"],
          description: "Updated desc",
          headers: { "X-New": "header" },
        },
      });

      expect(mockKula.patch).toHaveBeenCalledWith("/v1/webhooks/wh-1", {
        url: "https://new.example.com",
        name: "Updated Hook",
        subscribed_events: ["application.updated"],
        description: "Updated desc",
        headers: { "X-New": "header" },
      });
    });
  });

  describe("list_webhooks", () => {
    it("passes pagination params", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [{ id: "wh-1" }],
      });

      await client.callTool({
        name: "list_webhooks",
        arguments: { page: "1", limit: "10" },
      });

      expect(mockKula.get).toHaveBeenCalledWith("/v1/webhooks", {
        page: "1",
        limit: "10",
      });
    });
  });

  describe("get_webhook", () => {
    it("calls correct endpoint", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        id: "wh-1",
        url: "https://example.com",
      });

      await client.callTool({
        name: "get_webhook",
        arguments: { id: "wh-1" },
      });

      expect(mockKula.get).toHaveBeenCalledWith("/v1/webhooks/wh-1");
    });
  });

  describe("delete_webhook", () => {
    it("calls delete endpoint", async () => {
      (mockKula.delete as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});

      await client.callTool({
        name: "delete_webhook",
        arguments: { id: "wh-1" },
      });

      expect(mockKula.delete).toHaveBeenCalledWith("/v1/webhooks/wh-1");
    });
  });

  describe("enable_webhook", () => {
    it("calls enable endpoint", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});

      await client.callTool({
        name: "enable_webhook",
        arguments: { id: "wh-1" },
      });

      expect(mockKula.post).toHaveBeenCalledWith("/v1/webhooks/wh-1/enable");
    });
  });

  describe("disable_webhook", () => {
    it("calls disable endpoint", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});

      await client.callTool({
        name: "disable_webhook",
        arguments: { id: "wh-1" },
      });

      expect(mockKula.post).toHaveBeenCalledWith("/v1/webhooks/wh-1/disable");
    });
  });

  describe("rotate_webhook_secret", () => {
    it("calls regenerate-secret endpoint", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        secret: "new-secret",
      });

      await client.callTool({
        name: "rotate_webhook_secret",
        arguments: { id: "wh-1" },
      });

      expect(mockKula.post).toHaveBeenCalledWith(
        "/v1/webhooks/wh-1/regenerate-secret"
      );
    });
  });

  describe("list_webhook_events", () => {
    it("calls webhooks/events endpoint", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [{ event: "application.created" }],
      });

      await client.callTool({
        name: "list_webhook_events",
        arguments: {},
      });

      expect(mockKula.get).toHaveBeenCalledWith("/v1/webhooks/events");
    });
  });

  describe("get_webhook_sample_payload", () => {
    it("calls sample endpoint with event type", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        event: "application.created",
        payload: { id: "sample" },
      });

      const result = await client.callTool({
        name: "get_webhook_sample_payload",
        arguments: { event_type: "application.created" },
      });

      expect(mockKula.get).toHaveBeenCalledWith(
        "/v1/webhooks/sample/application.created"
      );
      expect(result.isError).toBeFalsy();
    });
  });

  describe("error handling", () => {
    it("returns isError true when client throws", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error("Kula API error 403: Forbidden")
      );

      const result = await client.callTool({
        name: "create_webhook",
        arguments: {
          url: "https://example.com",
          name: "Test",
          subscribed_events: ["test"],
        },
      });

      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;
      expect(text).toContain("403");
    });

    it("handles non-Error throws via String()", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        "string error"
      );
      const result = await client.callTool({
        name: "list_webhooks",
        arguments: {},
      });
      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;
      expect(text).toContain("string error");
    });

    it("handles Error in list_webhooks", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
      const result = await client.callTool({ name: "list_webhooks", arguments: {} });
      expect(result.isError).toBe(true);
    });

    it("handles Error in get_webhook", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
      const result = await client.callTool({ name: "get_webhook", arguments: { id: "x" } });
      expect(result.isError).toBe(true);
    });

    it("handles Error in update_webhook", async () => {
      (mockKula.patch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
      const result = await client.callTool({ name: "update_webhook", arguments: { id: "x", url: "https://x.com", name: "X", subscribed_events: ["t"] } });
      expect(result.isError).toBe(true);
    });

    it("handles Error in delete_webhook", async () => {
      (mockKula.delete as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
      const result = await client.callTool({ name: "delete_webhook", arguments: { id: "x" } });
      expect(result.isError).toBe(true);
    });

    it("handles Error in enable_webhook", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
      const result = await client.callTool({ name: "enable_webhook", arguments: { id: "x" } });
      expect(result.isError).toBe(true);
    });

    it("handles Error in disable_webhook", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
      const result = await client.callTool({ name: "disable_webhook", arguments: { id: "x" } });
      expect(result.isError).toBe(true);
    });

    it("handles Error in rotate_webhook_secret", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
      const result = await client.callTool({ name: "rotate_webhook_secret", arguments: { id: "x" } });
      expect(result.isError).toBe(true);
    });

    it("handles Error in list_webhook_events", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
      const result = await client.callTool({ name: "list_webhook_events", arguments: {} });
      expect(result.isError).toBe(true);
    });

    it("handles Error in get_webhook_sample_payload", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
      const result = await client.callTool({ name: "get_webhook_sample_payload", arguments: { event_type: "x" } });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws in create_webhook", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "create_webhook", arguments: { url: "https://x.com", name: "T", subscribed_events: ["t"] } });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws in get_webhook", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "get_webhook", arguments: { id: "x" } });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws in update_webhook", async () => {
      (mockKula.patch as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "update_webhook", arguments: { id: "x", url: "https://x.com", name: "X", subscribed_events: ["t"] } });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws in delete_webhook", async () => {
      (mockKula.delete as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "delete_webhook", arguments: { id: "x" } });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws in enable_webhook", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "enable_webhook", arguments: { id: "x" } });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws in disable_webhook", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "disable_webhook", arguments: { id: "x" } });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws in rotate_webhook_secret", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "rotate_webhook_secret", arguments: { id: "x" } });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws in list_webhook_events", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "list_webhook_events", arguments: {} });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws in get_webhook_sample_payload", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "get_webhook_sample_payload", arguments: { event_type: "x" } });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws in test_webhook", async () => {
      (mockKula.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "test_webhook", arguments: { id: "x" } });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws in get_webhook_test_status", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "get_webhook_test_status", arguments: { id: "x", test_id: "t1" } });
      expect(result.isError).toBe(true);
    });

    it("handles non-Error throws in list_webhook_logs", async () => {
      (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce("fail");
      const result = await client.callTool({ name: "list_webhook_logs", arguments: { id: "x" } });
      expect(result.isError).toBe(true);
    });
  });
});

describe("test_webhook", () => {
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

  it("posts to the test endpoint", async () => {
    (mockKula.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ test_id: "t123" });

    const result = await client.callTool({ name: "test_webhook", arguments: { id: "wh-1" } });

    expect(mockKula.post).toHaveBeenCalledWith("/v1/webhooks/wh-1/test", {});
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(JSON.parse(text).test_id).toBe("t123");
  });

  it("returns isError on failure", async () => {
    (mockKula.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
    const result = await client.callTool({ name: "test_webhook", arguments: { id: "wh-1" } });
    expect(result.isError).toBe(true);
  });
});

describe("get_webhook_test_status", () => {
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

  it("calls the test status endpoint", async () => {
    (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ status: "delivered" });

    const result = await client.callTool({ name: "get_webhook_test_status", arguments: { id: "wh-1", test_id: "t123" } });

    const call = (mockKula.get as ReturnType<typeof vi.fn>).mock.calls.at(-1);
    expect(call[0]).toBe("/v1/webhooks/wh-1/test/t123");
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(JSON.parse(text).status).toBe("delivered");
  });

  it("returns isError on failure", async () => {
    (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
    const result = await client.callTool({ name: "get_webhook_test_status", arguments: { id: "wh-1", test_id: "t1" } });
    expect(result.isError).toBe(true);
  });
});

describe("list_webhook_logs", () => {
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

  it("calls the logs endpoint", async () => {
    (mockKula.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [{ id: "log-1", status: "success" }] });

    const result = await client.callTool({ name: "list_webhook_logs", arguments: { id: "wh-1" } });

    const call = (mockKula.get as ReturnType<typeof vi.fn>).mock.calls.at(-1);
    expect(call[0]).toBe("/v1/webhooks/wh-1/logs");
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(JSON.parse(text).data[0].status).toBe("success");
  });

  it("returns isError on failure", async () => {
    (mockKula.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("fail"));
    const result = await client.callTool({ name: "list_webhook_logs", arguments: { id: "wh-1" } });
    expect(result.isError).toBe(true);
  });
});
