# Kula MCP Server

MCP server wrapping the Kula recruiting API (https://api.kula.ai/v1).

## Quick Reference

- **Language**: TypeScript (ESM, strict mode)
- **Runtime**: Node 22 LTS (see `.nvmrc`)
- **MCP SDK**: `@modelcontextprotocol/sdk` with STDIO transport
- **Validation**: Zod schemas for all tool inputs

## Commands

- `nvm use` — switch to project Node version
- `npm run build` — compile TypeScript to `build/`
- `npm run dev` — watch mode compilation
- `npm start` — run the compiled server
- `npm test` — run tests (vitest)
- `npx @modelcontextprotocol/inspector` — test tools interactively

## Architecture

```
src/index.ts        → Entry point. Creates McpServer, registers tools, starts StdioServerTransport.
src/client.ts       → KulaClient class. Thin fetch() wrapper with auth headers and error handling.
src/tools/*.ts      → Each file exports register(server, client). One file per API domain.
src/types.ts        → Shared Zod schemas reused across tool modules.
```

### Tool Registration Pattern

Every tool file follows this pattern:

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { KulaClient } from "../client.js";

export function register(server: McpServer, client: KulaClient) {
  server.tool("tool_name", "Description for LLM", { param: z.string() }, async ({ param }) => {
    const data = await client.get(`/v1/endpoint/${param}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });
}
```

### Key Conventions

- **NEVER use `console.log`** — STDIO transport uses stdout for JSON-RPC. Use `console.error` for logging.
- Tool names use `snake_case` (MCP convention).
- All tool handlers return `{ content: [{ type: "text", text: string }] }`.
- API errors are caught and returned as `{ content: [...], isError: true }`.
- Auth via `KULA_API_KEY` env var — validated at startup.
- Import paths must include `.js` extension (ESM requirement).

### API Domains → Tool Files (26 tools)

| Domain | File | Tools |
|--------|------|-------|
| Job Posts | `tools/job-posts.ts` | `list_job_posts`, `get_job_post` |
| Jobs | `tools/jobs.ts` | `list_jobs`, `get_job` |
| Applications | `tools/applications.ts` | `list_applications`, `get_application`, `update_application_stage` |
| Candidates | `tools/candidates.ts` | `create_candidate`, `list_candidates`, `get_candidate` |
| Webhooks | `tools/webhooks.ts` | 10 tools for CRUD, enable/disable, rotate secret, list events, sample payload |
| Autocomplete | `tools/autocomplete.ts` | `search_companies`, `list_industries`, `search_locations`, etc. |
| Organization | `tools/organization.ts` | `list_departments`, `list_offices` |
