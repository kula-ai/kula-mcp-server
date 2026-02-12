import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { KulaClient } from "../client.js";

export function createMockClient(): KulaClient {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    postFormData: vi.fn(),
  } as unknown as KulaClient;
}

export async function setupMcpTest(
  registerFn: (server: McpServer, client: KulaClient) => void,
  mockClient: KulaClient
) {
  const server = new McpServer({ name: "test", version: "0.0.1" });
  registerFn(server, mockClient);

  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();

  const client = new Client({ name: "test-client", version: "0.0.1" });

  await server.connect(serverTransport);
  await client.connect(clientTransport);

  return {
    client,
    async cleanup() {
      await client.close();
      await server.close();
    },
  };
}
