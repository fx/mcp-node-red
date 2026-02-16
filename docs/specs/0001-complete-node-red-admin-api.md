# Complete Node-RED Admin API Coverage

## Overview

Extend the MCP Node-RED server from 4 tools to full coverage of the Node-RED Admin HTTP API. This adds flow lifecycle management (delete flow), node/module management (list, install, uninstall, enable/disable), runtime introspection (settings, diagnostics, flow state), context store operations (read/delete at global/flow/node scope), and node-specific triggers (inject nodes, debug node toggling). Together these tools give AI agents everything needed to fully develop, maintain, debug, and test Node-RED workflows.

## Background

The current MCP server exposes 4 tools:
- `get_flows` — `GET /flows` (fetch all flows)
- `create_flow` — `POST /flow` (create a new flow)
- `update_flow` — `PUT /flow/:id` (update a single flow)
- `validate_flow` — client-side structural validation

This covers basic flow CRUD but leaves agents unable to:
- Delete flows
- Install, remove, or manage node modules (e.g. `node-red-contrib-mqtt`)
- Trigger inject nodes to test flows or toggle debug nodes for troubleshooting
- Inspect runtime context data that flows produce
- Check runtime health, settings, or start/stop flows
- Get diagnostic info about the Node-RED instance

The Node-RED Admin HTTP API (v2) provides all of these capabilities. The editor itself uses these same endpoints. This spec covers implementing all missing high-priority endpoints.

## Goals

- Add flow lifecycle tools: delete flow, get/set flow runtime state
- Add node module management tools: list, install, uninstall, enable/disable modules
- Add context store tools: read and delete context at global, flow, and node scopes
- Add runtime info tools: get settings, get diagnostics
- Add node-specific tools: trigger inject nodes, enable/disable debug nodes
- Follow existing codebase patterns exactly (tool file per feature, Zod schemas, client methods, test coverage)
- Maintain the safety-first design: individual flow operations over bulk, clear error messages

## Non-Goals

- **Auth endpoints** (`GET /auth/login`, `POST /auth/token`, `POST /auth/revoke`) — auth is configured via env vars ahead of time
- **Bulk flow deployment** (`POST /flows`) — the existing per-flow approach (`POST /flow`, `PUT /flow/:id`) is safer; bulk deploy risks overwriting unrelated flows
- **Plugin management** (`GET /plugins`) — low priority, rarely needed by agents
- **Node set granularity** (`GET /nodes/:module/:set`, `PUT /nodes/:module/:set`) — module-level enable/disable is sufficient; set-level control is rarely needed
- **UDP port inspection** (`GET /udp-ports/:id`) — niche, only relevant for UDP nodes

## Design

### Client Layer Extensions (`src/client.ts`)

All new methods follow the existing pattern: call `request()` from `undici`, check status code, parse response. The `getHeaders()` method is already shared and handles auth + API versioning.

#### New Client Methods

```typescript
// --- Flow Management ---

async deleteFlow(flowId: string): Promise<void> {
  // DELETE /flow/:id → 204 (no content)
  // 404 if flow not found
}

async getFlowState(): Promise<{ state: string }> {
  // GET /flows/state → 200 with {state: "start"|"stop"}
  // Requires runtimeState.enabled=true in Node-RED settings
}

async setFlowState(state: 'start' | 'stop'): Promise<{ state: string }> {
  // POST /flows/state → 200 with {state}
  // Body: {state: "start"} or {state: "stop"}
}

// --- Node/Module Management ---

async getNodes(): Promise<NodeModule[]> {
  // GET /nodes → 200 with array of node module objects
  // Accept: application/json header required
}

async installNode(module: string): Promise<NodeModule> {
  // POST /nodes → 200 with node module object
  // Body: {module: "node-red-contrib-foo"}
}

async setNodeModuleState(module: string, enabled: boolean): Promise<NodeModule> {
  // PUT /nodes/:module → 200 with node module object
  // Body: {enabled: true|false}
}

async removeNodeModule(module: string): Promise<void> {
  // DELETE /nodes/:module → 204
  // 400 if module cannot be removed, 404 if not found
}

// --- Context Store ---

async getContext(
  scope: 'global' | 'flow' | 'node',
  id?: string,
  key?: string,
  store?: string
): Promise<unknown> {
  // GET /context/global → keys for global context
  // GET /context/global/:key → specific global context value
  // GET /context/flow/:id → keys for flow context
  // GET /context/flow/:id/:key → specific flow context value
  // GET /context/node/:id → keys for node context
  // GET /context/node/:id/:key → specific node context value
  // Optional ?store= query param for specific context store
}

async deleteContext(
  scope: 'global' | 'flow' | 'node',
  id: string,
  key: string,
  store?: string
): Promise<void> {
  // DELETE /context/:scope/:id/:key → 204
  // DELETE /context/global/:key → 204
}

// --- Runtime Info ---

async getSettings(): Promise<NodeRedSettings> {
  // GET /settings → 200 with {httpNodeRoot, version, user?, ...}
}

async getDiagnostics(): Promise<NodeRedDiagnostics> {
  // GET /diagnostics → 200 with {report, scope, nodejs, os, runtime, ...}
}

// --- Node-Specific Triggers ---

async triggerInject(nodeId: string): Promise<void> {
  // POST /inject/:id → 200
  // Optional body with __user_inject_props__ for property overrides
  // 404 if node not found, 500 on error
}

async setDebugNodeState(nodeId: string, enabled: boolean): Promise<void> {
  // POST /debug/:id/:state → 200 (enable) or 201 (disable)
  // state = "enable" or "disable"
}
```

### Schema Extensions (`src/schemas.ts`)

New Zod schemas for API responses and tool argument validation:

```typescript
// --- Flow state ---
export const FlowStateSchema = z.object({
  state: z.enum(['start', 'stop']),
});

// --- Node module info ---
export const NodeSetSchema = z.object({
  id: z.string(),
  types: z.array(z.string()),
  enabled: z.boolean(),
  module: z.string().optional(),
  version: z.string().optional(),
}).passthrough();

export const NodeModuleSchema = z.object({
  name: z.string(),
  version: z.string(),
  local: z.boolean().optional(),
  user: z.boolean().optional(),
  nodes: z.array(NodeSetSchema),
}).passthrough();

// --- Settings ---
export const NodeRedSettingsSchema = z.object({
  httpNodeRoot: z.string().optional(),
  version: z.string().optional(),
  user: z.object({
    username: z.string(),
    permissions: z.string(),
  }).optional(),
}).passthrough();

// --- Diagnostics ---
export const NodeRedDiagnosticsSchema = z.object({
  report: z.string().optional(),
  scope: z.string().optional(),
  nodejs: z.unknown().optional(),
  os: z.unknown().optional(),
  runtime: z.unknown().optional(),
  modules: z.unknown().optional(),
  settings: z.unknown().optional(),
}).passthrough();
```

### Tool Implementations (`src/tools/`)

Each new tool follows the established pattern:
1. Define a Zod schema for MCP tool arguments
2. Export an async function taking `(client: NodeRedClient, args?: unknown)`
3. Parse args with Zod, call client method, return `{content: [{type: 'text', text: JSON.stringify(...)}]}`

#### New Tool Files

**`src/tools/delete-flow.ts`** — Delete a flow by ID
```typescript
// Args: {flowId: string}
// Returns: confirmation message with deleted flow ID
```

**`src/tools/get-flow-state.ts`** — Get flow runtime state
```typescript
// Args: none
// Returns: {state: "start"|"stop"}
```

**`src/tools/set-flow-state.ts`** — Start or stop flows
```typescript
// Args: {state: "start"|"stop"}
// Returns: confirmed state
```

**`src/tools/get-nodes.ts`** — List installed node modules
```typescript
// Args: none
// Returns: array of node module objects
```

**`src/tools/install-node.ts`** — Install a node module from npm
```typescript
// Args: {module: string}  e.g. "node-red-contrib-mqtt"
// Returns: installed module info
```

**`src/tools/set-node-module-state.ts`** — Enable or disable a module
```typescript
// Args: {module: string, enabled: boolean}
// Returns: updated module info
```

**`src/tools/remove-node-module.ts`** — Uninstall a node module
```typescript
// Args: {module: string}
// Returns: confirmation message
```

**`src/tools/get-context.ts`** — Read context store values
```typescript
// Args: {scope: "global"|"flow"|"node", id?: string, key?: string, store?: string}
// id required for flow/node scope
// key optional — omit to get all keys, provide to get specific value
// Returns: context data
```

**`src/tools/delete-context.ts`** — Delete context store values
```typescript
// Args: {scope: "global"|"flow"|"node", id?: string, key: string, store?: string}
// Returns: confirmation message
```

**`src/tools/get-settings.ts`** — Get Node-RED runtime settings
```typescript
// Args: none
// Returns: settings object (version, httpNodeRoot, user info)
```

**`src/tools/get-diagnostics.ts`** — Get runtime diagnostics
```typescript
// Args: none
// Returns: diagnostics object (nodejs, os, runtime, modules info)
```

**`src/tools/trigger-inject.ts`** — Trigger an inject node
```typescript
// Args: {nodeId: string}
// This calls POST /inject/:id which is the same endpoint the Node-RED
// editor uses when you click the inject button
// Returns: confirmation message
```

**`src/tools/set-debug-state.ts`** — Enable or disable a debug node
```typescript
// Args: {nodeId: string, enabled: boolean}
// Calls POST /debug/:id/enable or POST /debug/:id/disable
// Returns: confirmation with new state
```

### Server Registration (`src/server.ts`)

Each new tool must be registered in both the `ListToolsRequestSchema` handler (tool definition with name, description, inputSchema) and the `CallToolRequestSchema` handler (routing to the tool function).

#### MCP Tool Definitions

| Tool Name | Description | Input Schema |
|---|---|---|
| `delete_flow` | Delete a flow from Node-RED by ID. Removes the flow and all its nodes. | `{flowId: string}` |
| `get_flow_state` | Get the runtime state of flows (started or stopped). Requires runtimeState enabled in Node-RED settings. | `{}` |
| `set_flow_state` | Start or stop all flows in the Node-RED runtime. | `{state: "start"\|"stop"}` |
| `get_nodes` | List all installed node modules with their types, versions, and enabled status. | `{}` |
| `install_node` | Install a node module from the npm registry. | `{module: string}` |
| `set_node_module_state` | Enable or disable an installed node module. | `{module: string, enabled: boolean}` |
| `remove_node_module` | Uninstall a node module from Node-RED. | `{module: string}` |
| `get_context` | Read context store data at global, flow, or node scope. Omit key to list all keys. | `{scope: "global"\|"flow"\|"node", id?: string, key?: string, store?: string}` |
| `delete_context` | Delete a context store value at global, flow, or node scope. | `{scope: "global"\|"flow"\|"node", id?: string, key: string, store?: string}` |
| `get_settings` | Get Node-RED runtime settings including version and configuration. | `{}` |
| `get_diagnostics` | Get Node-RED runtime diagnostics including Node.js version, OS info, and memory usage. | `{}` |
| `trigger_inject` | Trigger an inject node to fire, same as clicking the inject button in the editor. | `{nodeId: string}` |
| `set_debug_state` | Enable or disable a debug node's output. | `{nodeId: string, enabled: boolean}` |

### Error Handling

All new client methods follow the existing error pattern:

```typescript
if (response.statusCode !== expectedStatus) {
  const body = await response.body.text();
  throw new Error(`Failed to <action>: ${response.statusCode}\n${body}`);
}
```

Tool handlers inherit the server-level try/catch in `server.ts` which wraps all errors into MCP error responses:

```typescript
{
  content: [{ type: 'text', text: `Error: ${error.message}` }],
  isError: true,
}
```

Specific error cases to handle:
- **404** on `delete_flow`, `remove_node_module`: "not found" error
- **400** on `remove_node_module`: module cannot be removed (e.g., core module)
- **400** on `get_flow_state`/`set_flow_state`: runtimeState not enabled in Node-RED config
- **500** on `trigger_inject`: node error during injection

### Testing Strategy

Tests follow the existing pattern with two layers:

**Client tests** (`tests/client.test.ts`):
- Mock `undici.request` at the module level with `vi.mock('undici')`
- Test each new client method for: success case, error status codes (404, 400, 500), correct URL/method/headers/body sent
- Test auth variations (Bearer token, Basic auth from URL, no auth)

**Tool tests** (`tests/tools.test.ts`):
- Mock the `NodeRedClient` instance with `vi.fn()` for each method
- Test each tool for: correct args parsing, correct client method called with right params, response formatting, invalid JSON handling (where applicable), Zod validation errors

**Server tests** (`tests/server.test.ts`):
- Verify new tools appear in tool listing
- Verify unknown tool names still throw errors

Estimated new tests: ~60-80 test cases across the three test files.

## Tasks

- [x] Add `delete_flow` tool
  - [x] Add `deleteFlow(flowId)` method to `src/client.ts`
  - [x] Create `src/tools/delete-flow.ts` with Zod args schema and MCP response format
  - [x] Register `delete_flow` tool in `src/server.ts` (ListTools + CallTool)
  - [x] Add client tests for `deleteFlow` (success, 404)
  - [x] Add tool handler tests for `delete_flow`
  - [x] Update server test to verify new tool appears in tool listing
- [ ] Add flow state tools: `get_flow_state`, `set_flow_state`
  - [ ] Add `FlowStateSchema` to `src/schemas.ts`
  - [ ] Add `getFlowState()` and `setFlowState(state)` methods to `src/client.ts`
  - [ ] Create `src/tools/get-flow-state.ts` and `src/tools/set-flow-state.ts`
  - [ ] Register both tools in `src/server.ts`
  - [ ] Add client tests (success, runtimeState-disabled 400 error)
  - [ ] Add tool handler tests
- [ ] Add node module management tools: `get_nodes`, `install_node`, `set_node_module_state`, `remove_node_module`
  - [ ] Add `NodeSetSchema`, `NodeModuleSchema` to `src/schemas.ts`
  - [ ] Add `getNodes()`, `installNode(module)`, `setNodeModuleState(module, enabled)`, `removeNodeModule(module)` to `src/client.ts`
  - [ ] Create `src/tools/get-nodes.ts`
  - [ ] Create `src/tools/install-node.ts`
  - [ ] Create `src/tools/set-node-module-state.ts`
  - [ ] Create `src/tools/remove-node-module.ts`
  - [ ] Register all 4 tools in `src/server.ts`
  - [ ] Add client tests for all 4 methods (success, 404, 400 errors)
  - [ ] Add tool handler tests for all 4 tools
- [ ] Add context store tools: `get_context`, `delete_context`
  - [ ] Add `getContext(scope, id?, key?, store?)` and `deleteContext(scope, id?, key, store?)` to `src/client.ts`
  - [ ] Create `src/tools/get-context.ts` with scope/id/key arg validation
  - [ ] Create `src/tools/delete-context.ts` with scope/id/key arg validation
  - [ ] Register both tools in `src/server.ts`
  - [ ] Add client tests for all scope variants (global, global/key, flow/:id, flow/:id/key, node/:id, node/:id/key) and delete variants
  - [ ] Add tool handler tests including arg validation (id required for flow/node scope)
- [ ] Add runtime info tools: `get_settings`, `get_diagnostics`
  - [ ] Add `NodeRedSettingsSchema` and `NodeRedDiagnosticsSchema` to `src/schemas.ts`
  - [ ] Add `getSettings()` and `getDiagnostics()` to `src/client.ts`
  - [ ] Create `src/tools/get-settings.ts` and `src/tools/get-diagnostics.ts`
  - [ ] Register both tools in `src/server.ts`
  - [ ] Add client and tool handler tests
- [ ] Add node-specific trigger tools: `trigger_inject`, `set_debug_state`
  - [ ] Add `triggerInject(nodeId)` and `setDebugNodeState(nodeId, enabled)` to `src/client.ts`
  - [ ] Create `src/tools/trigger-inject.ts`
  - [ ] Create `src/tools/set-debug-state.ts`
  - [ ] Register both tools in `src/server.ts`
  - [ ] Add client tests (success, 404 not found, 500 node error for inject)
  - [ ] Add tool handler tests
- [ ] Update documentation and CLAUDE.md
  - [ ] Update CLAUDE.md project overview to reflect new tool count
  - [ ] Update CLAUDE.md architecture section with new tools and API endpoints
  - [ ] Update CLAUDE.md "ALWAYS Use MCP Tools" section with full tool list
  - [ ] Update README.md with new tool descriptions and usage examples

## Open Questions

### 1. Context store `keysOnly` parameter

The `GET /context/*` endpoints support a `?keysOnly=true` query parameter. Should we expose this as a separate boolean argument on the `get_context` tool, or always return full values?

- **Option A (Recommended):** Always return full values. If the context is large, the agent can parse what it needs. Simpler API surface.
- **Option B:** Add an optional `keysOnly: boolean` parameter. More flexible but adds complexity.

### 2. Inject node property overrides

The `POST /inject/:id` endpoint supports an optional `__user_inject_props__` body to override the inject node's configured payload/topic. Should we expose this?

- **Option A (Recommended):** Start without it — just trigger with configured values. This matches the "click the button" use case.
- **Option B:** Add an optional `properties` parameter for overrides. More powerful but more complex to validate.

### 3. Flow state endpoint availability

`GET /flows/state` and `POST /flows/state` require `runtimeState.enabled: true` in Node-RED's `settings.js`. If not enabled, they return 400. Should the tools gracefully handle this?

- **Option A (Recommended):** Return a clear error message explaining that runtimeState must be enabled. The existing error handling pattern already surfaces status codes.
- **Option B:** Have the tools check `/settings` first to detect if runtimeState is available. Adds an extra HTTP call.

## References

- [Node-RED Admin API Methods](https://nodered.org/docs/api/admin/methods/) — official endpoint documentation
- [Node-RED Admin API Overview](https://nodered.org/docs/api/admin/) — auth and general API info
- [Node-RED GitHub: editor-api routes](https://github.com/node-red/node-red/blob/master/packages/node_modules/%40node-red/editor-api/lib/admin/index.js) — source of truth for all admin routes
- [Node-RED GitHub: inject node](https://github.com/node-red/node-red/blob/master/packages/node_modules/%40node-red/nodes/core/common/20-inject.js) — inject trigger endpoint source
- [Node-RED GitHub: debug node](https://github.com/node-red/node-red/blob/master/packages/node_modules/%40node-red/nodes/core/common/21-debug.js) — debug state endpoint source
- [MCP SDK](https://github.com/modelcontextprotocol/sdk) — Model Context Protocol server SDK
