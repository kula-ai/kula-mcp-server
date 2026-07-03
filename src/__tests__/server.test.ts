import { describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { buildServer } from "../server.js";
import { createMockClient } from "./helpers.js";

async function toolNames(readOnly: boolean): Promise<string[]> {
  const server = buildServer(createMockClient(), { readOnly });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "t", version: "0.0.0" });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  const { tools } = await client.listTools();
  await client.close();
  await server.close();
  return tools.map((t) => t.name);
}

describe("buildServer read-only mode", () => {
  it("exposes only read tools (list_/get_/find_/search_)", async () => {
    const names = await toolNames(true);
    expect(names.length).toBeGreaterThan(0);
    expect(names.every((n) => /^(list|get|find|search)_/.test(n))).toBe(true);
    expect(names).not.toContain("create_user");
    expect(names).not.toContain("delete_webhook");
  });

  it("exposes write tools by default (stdio)", async () => {
    const names = await toolNames(false);
    expect(names).toContain("create_user");
    expect(names).toContain("list_jobs");
  });
});
