# Contributing

Thanks for your interest in contributing to the Kula MCP Server!

## Dev Setup

```bash
nvm use          # Node 22 LTS
npm install      # installs deps and runs build via prepare
```

## Running Tests

```bash
npm test                # run all tests
npm run test:coverage   # with coverage report
```

## Linting

```bash
npm run lint      # check
npm run lint:fix  # auto-fix
```

## Code Conventions

- Tool names use `snake_case` (MCP convention).
- **Never use `console.log`** — STDIO transport uses stdout for JSON-RPC. Use `console.error` for debug logging.
- ESM imports must include the `.js` extension (e.g. `import { KulaClient } from "../client.js"`).
- Tool handlers return `{ content: [{ type: "text", text: string }] }`.
- API errors are caught and returned with `isError: true` — not thrown.

## Adding a New Tool

1. Create or edit a file in `src/tools/`.
2. Export a `register(server, client)` function that calls `server.tool(...)`.
3. Define input validation with Zod schemas.
4. Register the file in `src/index.ts`.
5. Add tests covering success and error cases.

## Pull Requests

- Keep PRs focused on a single change.
- All tests must pass (`npm test`).
- Lint must pass (`npm run lint`).
- Include a brief description of the change and why it's needed.
