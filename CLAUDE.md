# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MCP (Model Context Protocol) server that provides Node-RED workflow management capabilities via stdio transport. Exposes 17 tools for AI agents to interact with Node-RED Admin API v2, covering flow management, runtime control, node module management, context store operations, runtime info, and node interaction.

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
- Registers 17 MCP tools with schemas across 6 categories: flow management, runtime control, node module management, context store, runtime info, and node interaction
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
- Flow management: `get-flows.ts`, `create-flow.ts` (POST /flow), `update-flow.ts` (PUT /flow/:id), `validate-flow.ts`, `delete-flow.ts` (DELETE /flow/:id)
- Runtime control: `get-flow-state.ts` (GET /flows/state), `set-flow-state.ts` (POST /flows/state)
- Node modules: `get-nodes.ts` (GET /nodes), `install-node.ts` (POST /nodes), `set-node-module-state.ts` (PUT /nodes/:module), `remove-node-module.ts` (DELETE /nodes/:module)
- Context store: `get-context.ts` (GET /context/:scope), `delete-context.ts` (DELETE /context/:scope/:id/:key)
- Runtime info: `get-settings.ts` (GET /settings), `get-diagnostics.ts` (GET /diagnostics)
- Node interaction: `trigger-inject.ts` (POST /inject/:id), `set-debug-state.ts` (POST /debug/:id/:state)

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

### Flow Management

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

**DELETE /flow/:id**:
- Deletes a flow and all its nodes
- Response: 204 (no content)
- 404 if flow not found

### Runtime Control

**GET /flows/state**:
- Returns runtime state: `{state: "start"|"stop"}`
- Requires `runtimeState.enabled: true` in Node-RED settings

**POST /flows/state**:
- Start or stop all flows
- Request: `{state: "start"|"stop"}`
- Response: 200 with `{state: "..."}`

### Node Module Management

**GET /nodes**:
- Returns array of installed node module objects with node sets

**POST /nodes**:
- Install a node module from npm
- Request: `{module: "node-red-contrib-foo"}`
- Response: 200 with node module object

**PUT /nodes/:module**:
- Enable or disable a node module
- Request: `{enabled: true|false}`
- Response: 200 with node module object

**DELETE /nodes/:module**:
- Remove an installed node module
- Response: 204
- 400 if core module, 404 if not found

### Context Store

**GET /context/global**, **GET /context/flow/:id**, **GET /context/node/:id**:
- Returns all context keys for the given scope
- Append `/:key` to get a specific value
- Optional `?store=` query param for specific context store

**DELETE /context/:scope/:id/:key**:
- Delete a context value
- Response: 204

### Runtime Info

**GET /settings**:
- Returns runtime settings: `{httpNodeRoot, version, user, ...}`

**GET /diagnostics**:
- Returns diagnostic info: `{nodejs, os, runtime, modules, ...}`

### Node Interaction

**POST /inject/:id**:
- Trigger an inject node (same as clicking the button in editor)
- Response: 200
- 404 if node not found

**POST /debug/:id/:state**:
- Enable or disable a debug node (`state` = "enable" or "disable")
- Response: 200 (enable) or 201 (disable)

## Testing

Tests use vitest with mocked `undici` requests. Each component has dedicated test files:
- `tests/client.test.ts` - HTTP client + auth modes + flow/node/context/runtime methods
- `tests/client-runtime.test.ts` - Runtime and node management client methods
- `tests/tools.test.ts` - Tool handlers for all 17 tools
- `tests/tools-runtime.test.ts` - Runtime and node management tool handlers
- `tests/server.test.ts` - MCP server setup and tool listing

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
- ALWAYS use the MCP tools: `get_flows`, `create_flow`, `update_flow`, `validate_flow`, `delete_flow`, `get_flow_state`, `set_flow_state`, `get_nodes`, `install_node`, `set_node_module_state`, `remove_node_module`, `get_context`, `delete_context`, `get_settings`, `get_diagnostics`, `trigger_inject`, `set_debug_state`

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

**Task Completion:** Every PR must mark completed task(s) as done (`- [x]`) in the relevant tracking file (`docs/PROJECT.md` or the spec file in `docs/specs/`). Include the task-list update in the PR.
