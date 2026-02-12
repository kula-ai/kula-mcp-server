import { z } from "zod";

// Shared pagination parameters
export const PaginationParams = {
  page: z.string().optional().describe("Page number (1-based)"),
  per_page: z.string().optional().describe("Number of items per page"),
};

// Webhook event subscription schema
export const WebhookEventSchema = z.object({
  event: z.string().describe("Event type to subscribe to"),
  version: z.string().optional().describe("Event version"),
});

// Common ID parameter
export const IdParam = {
  id: z.string().describe("Unique identifier"),
};
