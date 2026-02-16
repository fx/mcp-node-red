# Development Guide

## Installation

```bash
npm install
npm run build
```

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

## Node-RED Admin API v2

The server uses Admin API v2 endpoints. All requests include `Node-RED-API-Version: v2` and `Authorization` headers.

### Flow Management

**GET /flows** - Returns all flows: `{rev: "...", flows: [...]}`

**POST /flow** - Creates a new flow. Request: `{id, label, nodes: [], configs: []}`. Response: 200/204 with `{id: "..."}`.

**PUT /flow/:id** - Updates a single flow by ID. Only affects the specified flow. Request: `{id, label, nodes: [], configs: []}`. Response: 204 with `{id: "..."}`.

**DELETE /flow/:id** - Deletes a flow and all its nodes. Response: 204.

### Runtime Control

**GET /flows/state** - Returns runtime state: `{state: "start"|"stop"}`. Requires `runtimeState.enabled: true`.

**POST /flows/state** - Start or stop flows. Request: `{state: "start"|"stop"}`.

### Node Module Management

**GET /nodes** - Returns array of installed node module objects.

**POST /nodes** - Install a module from npm. Request: `{module: "node-red-contrib-foo"}`.

**PUT /nodes/:module** - Enable/disable a module. Request: `{enabled: true|false}`.

**DELETE /nodes/:module** - Remove an installed module. Response: 204.

### Context Store

**GET /context/global[/:key]** - Read global context keys or a specific value.

**GET /context/flow/:id[/:key]** - Read flow context keys or a specific value.

**GET /context/node/:id[/:key]** - Read node context keys or a specific value.

**DELETE /context/:scope/:id/:key** - Delete a context value. Response: 204.

### Runtime Info

**GET /settings** - Returns runtime settings: `{httpNodeRoot, version, user, ...}`.

**GET /diagnostics** - Returns diagnostic info: `{nodejs, os, runtime, modules, ...}`.

### Node Interaction

**POST /inject/:id** - Trigger an inject node to fire.

**POST /debug/:id/:state** - Enable or disable a debug node (state = "enable"|"disable").

## Testing

Tests use vitest with mocked `undici` requests. Each component has dedicated test files:
- `tests/client.test.ts` - HTTP client + auth modes + flow/node/context/runtime methods
- `tests/client-runtime.test.ts` - Runtime and node management client methods
- `tests/tools.test.ts` - Tool handlers for all 17 tools
- `tests/tools-runtime.test.ts` - Runtime and node management tool handlers
- `tests/server.test.ts` - MCP server setup and tool listing

## Error Handling

All tools return errors in content:

```json
{
  "content": [{
    "type": "text",
    "text": "Error: ..."
  }],
  "isError": true
}
```

Common errors:
- Invalid JSON in request
- Flow not found
- Validation failures
- Network/API errors

## Contributing

Pull requests are welcome! Please ensure:
- Tests pass (`npm test`)
- Code is formatted (`npm run format`)
- Linting passes (`npm run lint`)
