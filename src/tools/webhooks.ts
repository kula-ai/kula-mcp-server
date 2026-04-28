import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { KulaClient } from "../client.js";

export function register(server: McpServer, client: KulaClient) {
  server.registerTool(
    "list_webhooks",
    {
      description: "List all configured webhooks.",
      inputSchema: {
        page: z.string().optional().describe("Page number"),
        limit: z.string().optional().describe("Items per page"),
      },
    },
    async ({ page, limit }) => {
      try {
        const data = await client.get("/v1/webhooks", { page, limit });
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    "create_webhook",
    {
      description: "Create a new webhook subscription.",
      inputSchema: {
        url: z.string().describe("The URL to send webhook payloads to"),
        name: z.string().describe("Human-readable name for the webhook"),
        subscribed_events: z
          .array(z.string())
          .describe("List of event types to subscribe to (e.g. application.created)"),
        secret: z.string().optional().describe("Secret for signing payloads"),
        description: z.string().optional().describe("Description of the webhook"),
        headers: z.record(z.string()).optional().describe("Custom headers to include in webhook requests"),
      },
    },
    async ({ url, name, subscribed_events, secret, description, headers }) => {
      try {
        const body: Record<string, unknown> = { url, name, subscribed_events };
        if (secret !== undefined) body.secret = secret;
        if (description !== undefined) body.description = description;
        if (headers !== undefined) body.headers = headers;
        const data = await client.post("/v1/webhooks", body);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    "get_webhook",
    {
      description: "Get details of a specific webhook.",
      inputSchema: {
        id: z.string().describe("Webhook ID"),
      },
    },
    async ({ id }) => {
      try {
        const data = await client.get(`/v1/webhooks/${id}`);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    "update_webhook",
    {
      description: "Update an existing webhook configuration. Only include fields you want to change.",
      inputSchema: {
        id: z.string().describe("Webhook ID"),
        url: z.string().optional().describe("Updated URL"),
        name: z.string().optional().describe("Updated name"),
        subscribed_events: z
          .array(z.string())
          .optional()
          .describe("Updated list of event types to subscribe to"),
        description: z.string().optional().describe("Updated description"),
        headers: z.record(z.string()).optional().describe("Updated custom headers"),
      },
    },
    async ({ id, url, name, subscribed_events, description, headers }) => {
      try {
        const body: Record<string, unknown> = {};
        if (url !== undefined) body.url = url;
        if (name !== undefined) body.name = name;
        if (subscribed_events !== undefined) body.subscribed_events = subscribed_events;
        if (description !== undefined) body.description = description;
        if (headers !== undefined) body.headers = headers;
        const data = await client.patch(`/v1/webhooks/${id}`, body);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    "delete_webhook",
    {
      description: "Delete a webhook.",
      inputSchema: {
        id: z.string().describe("Webhook ID"),
      },
    },
    async ({ id }) => {
      try {
        const data = await client.delete(`/v1/webhooks/${id}`);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    "enable_webhook",
    {
      description: "Enable a disabled webhook.",
      inputSchema: {
        id: z.string().describe("Webhook ID"),
      },
    },
    async ({ id }) => {
      try {
        const data = await client.post(`/v1/webhooks/${id}/enable`);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    "disable_webhook",
    {
      description: "Disable an active webhook.",
      inputSchema: {
        id: z.string().describe("Webhook ID"),
      },
    },
    async ({ id }) => {
      try {
        const data = await client.post(`/v1/webhooks/${id}/disable`);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    "rotate_webhook_secret",
    {
      description: "Rotate the signing secret for a webhook.",
      inputSchema: {
        id: z.string().describe("Webhook ID"),
      },
    },
    async ({ id }) => {
      try {
        const data = await client.post(`/v1/webhooks/${id}/regenerate-secret`);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    "test_webhook",
    {
      description: "Send a test payload to a webhook endpoint to verify it is receiving events correctly.",
      inputSchema: {
        id: z.string().describe("Webhook ID"),
      },
    },
    async ({ id }) => {
      try {
        const data = await client.post(`/v1/webhooks/${id}/test`, {});
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    "get_webhook_test_status",
    {
      description: "Get the delivery status of a webhook test previously triggered via test_webhook.",
      inputSchema: {
        id: z.string().describe("Webhook ID"),
        test_id: z.string().describe("Test ID returned from test_webhook"),
      },
    },
    async ({ id, test_id }) => {
      try {
        const data = await client.get(`/v1/webhooks/${id}/test/${test_id}`);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    "list_webhook_logs",
    {
      description: "List recent delivery logs for a webhook, including status and response details for each attempt.",
      inputSchema: {
        id: z.string().describe("Webhook ID"),
        page: z.string().optional().describe("Page number"),
        limit: z.string().optional().describe("Items per page"),
      },
    },
    async ({ id, page, limit }) => {
      try {
        const data = await client.get(`/v1/webhooks/${id}/logs`, { page, limit });
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    "list_webhook_events",
    {
      description: "List all available webhook event types you can subscribe to.",
      inputSchema: {},
    },
    async () => {
      try {
        const data = await client.get("/v1/webhooks/events");
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    "get_webhook_sample_payload",
    {
      description: "Get a sample webhook payload for a specific event type.",
      inputSchema: {
        event_type: z.string().describe("Event type to get sample payload for (e.g. application.created)"),
      },
    },
    async ({ event_type }) => {
      try {
        const data = await client.get(`/v1/webhooks/sample/${event_type}`);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
