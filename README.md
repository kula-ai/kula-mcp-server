# @kula/mcp-server

[![CI](https://github.com/kula-ai/kula-mcp-server/actions/workflows/ci.yml/badge.svg)](https://github.com/kula-ai/kula-mcp-server/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@kula/mcp-server)](https://www.npmjs.com/package/@kula/mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node](https://img.shields.io/badge/node-%3E%3D22-brightgreen)](https://nodejs.org)
[![Coverage](https://raw.githubusercontent.com/kula-ai/kula-mcp-server/coverage-badges/badges/coverage-total.svg)](https://github.com/kula-ai/kula-mcp-server/actions/workflows/ci.yml)

An MCP (Model Context Protocol) server for the [Kula](https://www.kula.ai) recruiting API. Connect AI assistants like Claude to your Kula account to list jobs, manage applications, configure webhooks, and more.

## Quick Start

### With Claude Desktop / Cursor

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json`) or Cursor MCP config (`~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "kula": {
      "command": "npx",
      "args": ["-y", "@kula/mcp-server"],
      "env": {
        "KULA_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### With Claude Code

```bash
claude mcp add kula -- npx -y @kula/mcp-server
```

Then set `KULA_API_KEY` in your environment.

### Manual

```bash
npx @kula/mcp-server
```

## Configuration

| Environment Variable | Required | Description |
|---------------------|----------|-------------|
| `KULA_API_KEY` | Yes | Your Kula API key |

Get your API key from [Kula Developer Settings](https://developers.kula.ai).

## Available Tools

26 tools across 7 categories:

<details>
<summary>Organization (2 tools)</summary>

| Tool | Description |
|------|-------------|
| `list_departments` | List all departments in the organization as a nested tree structure |
| `list_offices` | List all offices in the organization |

</details>

<details>
<summary>Jobs (2 tools)</summary>

| Tool | Description |
|------|-------------|
| `list_jobs` | List jobs |
| `get_job` | Get details of a specific job |

</details>

<details>
<summary>Job Posts (2 tools)</summary>

| Tool | Description |
|------|-------------|
| `list_job_posts` | List published job posts on the job board |
| `get_job_post` | Get details of a specific job post from the job board |

</details>

<details>
<summary>Candidates (3 tools)</summary>

| Tool | Description |
|------|-------------|
| `create_candidate` | Create a new candidate in the system |
| `list_candidates` | List candidates |
| `get_candidate` | Get details of a specific candidate |

</details>

<details>
<summary>Applications (3 tools)</summary>

| Tool | Description |
|------|-------------|
| `list_applications` | List job applications |
| `get_application` | Get details of a specific application |
| `update_application_stage` | Update the stage of a specific application |

</details>

<details>
<summary>Webhooks (10 tools)</summary>

| Tool | Description |
|------|-------------|
| `list_webhooks` | List all configured webhooks |
| `create_webhook` | Create a new webhook subscription |
| `get_webhook` | Get details of a specific webhook |
| `update_webhook` | Update an existing webhook configuration |
| `delete_webhook` | Delete a webhook |
| `enable_webhook` | Enable a disabled webhook |
| `disable_webhook` | Disable an active webhook |
| `rotate_webhook_secret` | Rotate the signing secret for a webhook |
| `list_webhook_events` | List all available webhook event types you can subscribe to |
| `get_webhook_sample_payload` | Get a sample webhook payload for a specific event type |

</details>

<details>
<summary>Autocomplete (6 tools)</summary>

| Tool | Description |
|------|-------------|
| `search_companies` | Search companies by name |
| `list_industries` | List all available industries |
| `search_locations` | Search locations by query |
| `search_institutions` | Search academic institutions by name |
| `search_disciplines` | Search academic disciplines by name |
| `list_degrees` | List all available academic degrees |

</details>

## Development

```bash
# Use correct Node version
nvm use

# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Run tests
npm test

# Test with MCP Inspector
npx @modelcontextprotocol/inspector node build/index.js
```

### Connecting locally

To test your local build with an AI client instead of the published package:

#### Claude Desktop / Cursor

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (or `~/.cursor/mcp.json` for Cursor):

```json
{
  "mcpServers": {
    "kula": {
      "command": "node",
      "args": ["/absolute/path/to/kula-mcp/build/index.js"],
      "env": {
        "KULA_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

#### Claude Code

```bash
claude mcp add kula -- node /absolute/path/to/kula-mcp/build/index.js
```

Then set `KULA_API_KEY` in your environment.

> **Note:** The server uses STDIO transport, so there's no hot-reload. After rebuilding (`npm run build` or via `npm run dev`), restart the MCP client to pick up changes.

## License

MIT
