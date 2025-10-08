# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MCP (Model Context Protocol) server that provides Node-RED workflow management capabilities via stdio transport. Exposes 4 tools for AI agents to interact with Node-RED Admin API v2: get flows, create flow, update flow, and validate flow.

## Commands

```bash
# Build (required after any code changes)
npm run build

# Development with auto-rebuild
npm run dev

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run single test file
npx vitest tests/client.test.ts

# Lint
npm run lint

# Fix lint issues
npm run lint:fix

# Format code
npm run format
```

## Architecture

### Core Components

**Server Layer** (`src/server.ts`):
- Creates MCP server using `@modelcontextprotocol/sdk`
- Reads config from env vars: `NODE_RED_URL` (required), `NODE_RED_TOKEN` (optional)
- Registers 4 MCP tools with schemas (get_flows, create_flow, update_flow, validate_flow)
- Routes tool calls to individual tool handlers
- Catches errors and returns MCP-formatted error responses

**HTTP Client** (`src/client.ts`):
- `NodeRedClient` class wraps Node-RED Admin API v2
- Handles two auth modes:
  - Bearer token via `NODE_RED_TOKEN` env var
  - Basic auth extracted from URL credentials (e.g., `http://user:pass@host:1880`)
- Always sets `Node-RED-API-Version: v2` header
- Uses `undici` for HTTP requests

**Tools** (`src/tools/*.ts`):
- Each tool is a standalone async function
- Takes `NodeRedClient` instance and tool arguments
- Returns MCP tool response format: `{ content: [{ type: 'text', text: '...' }] }`
- `create-flow.ts` uses POST /flow to create new flows
- `update-flow.ts` uses PUT /flow/:id to update individual flows safely

**Schemas** (`src/schemas.ts`):
- Zod schemas for validation
- `NodeRedItemSchema` is a union of flows (type: "tab") and nodes (other types)
- All items have `id` and `type`, flows also require `label`
- Node references to parent flows via `z` property
- `UpdateFlowRequestSchema` defines structure for PUT /flow/:id requests

### Key Design Decisions

**Stdio Transport**: Uses stdin/stdout for MCP communication, not HTTP. Server runs as child process.

**API v2 with Optimistic Locking**: Uses `rev` field in responses to prevent conflicts.

**Authentication Flexibility**: Supports both Bearer tokens (standalone Node-RED) and Basic auth (Home Assistant add-on).

**JSON String Parameters**: MCP tool parameters receive flows as JSON strings, not objects. Tools parse and validate them.

**Individual Flow Updates**: Uses PUT /flow/:id to update one flow at a time, preventing accidental destruction of other flows.

## Node-RED Admin API v2

**GET /flows**:
- Returns all flows: `{rev: "...", flows: [...]}`

**POST /flow**:
- Creates a new flow
- Request: `{id, label, nodes: [], configs: []}`
- Response: 200 or 204 with `{id: "..."}` in body
- Flow ID is optional - auto-generated if not provided

**PUT /flow/:id**:
- Updates a single flow by ID
- Request: `{id, label, nodes: [], configs: []}`
- Response: 204 with `{id: "..."}` in body
- Only affects the specified flow, all other flows remain untouched

## Testing

Tests use vitest with mocked `undici` requests. Each component has dedicated test file:
- `tests/client.test.ts` - HTTP client + auth modes
- `tests/tools.test.ts` - Tool handlers
- `tests/server.test.ts` - MCP server setup

## CRITICAL: Flow Update Safety

**Always use PUT /flow/:id for individual flow updates**

The MCP server uses `PUT /flow/:id` which:
- Updates ONLY the specified flow
- Leaves all other flows completely untouched
- No risk of destroying unrelated workflows
- Simpler and safer than POST /flows

**Flow update format**:
```json
{
  "id": "flow-id",
  "label": "Flow Name",
  "nodes": [...],
  "configs": [...]
}
```

## CRITICAL: ALWAYS Use MCP Tools

**NEVER bypass MCP tools to interact with Node-RED directly**

- NEVER use `curl` to call Node-RED API directly
- NEVER use Bash to make HTTP requests to Node-RED
- ALWAYS use the MCP tools: `get_flows`, `create_flow`, `update_flow`, `validate_flow`

The entire purpose of this MCP server is to provide safe, validated access to Node-RED through MCP tools. Bypassing them defeats the purpose and removes safety checks.

If MCP tools appear to fail:
1. Debug the MCP tool issue
2. Fix the tool implementation
3. Test the fix
4. NEVER work around it with direct API calls

## Configuration

Required env var: `NODE_RED_URL`
Optional env var: `NODE_RED_TOKEN`

For Home Assistant add-on deployments, embed credentials in URL: `http://username:password@host:1880`
