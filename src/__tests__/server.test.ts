import { describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { buildServer, READ_ONLY_TOOLS } from "../server.js";
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
  it("read-only exposes exactly the allowlist", async () => {
    const readOnly = await toolNames(true);
    const all = new Set(await toolNames(false));

    // Everything exposed is allowlisted.
    expect(readOnly.every((n) => READ_ONLY_TOOLS.has(n))).toBe(true);
    // The exposed set is exactly the allowlist (no drift).
    expect(new Set(readOnly)).toEqual(READ_ONLY_TOOLS);
    // Every allowlist entry is a real tool (no stale names / typos).
    for (const name of READ_ONLY_TOOLS) {
      expect(all.has(name)).toBe(true);
    }
  });

  it("excludes write tools in read-only mode", async () => {
    const readOnly = await toolNames(true);
    for (const write of [
      "create_user",
      "deactivate_user",
      "update_candidate",
      "cancel_interview",
      "delete_webhook",
      "close_requisition",
    ]) {
      expect(readOnly).not.toContain(write);
    }
  });

  it("exposes write tools by default (stdio)", async () => {
    const all = await toolNames(false);
    expect(all).toContain("create_user");
    expect(all).toContain("list_jobs");
    // Full build has tools beyond the read-only allowlist (the writes).
    expect(all.length).toBeGreaterThan(READ_ONLY_TOOLS.size);
  });

  it("defaults to all tools when no options are passed", async () => {
    const server = buildServer(createMockClient());
    const [ct, st] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: "t", version: "0.0.0" });
    await server.connect(st);
    await client.connect(ct);
    const { tools } = await client.listTools();
    await client.close();
    await server.close();
    expect(tools.map((t) => t.name)).toContain("create_user");
  });
});
