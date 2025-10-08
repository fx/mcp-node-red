# Node-RED MCP Server

MCP server for Node-RED workflow management using stdio transport. Provides tools to get, update, and validate individual Node-RED flows through the Admin API v2.

## Features

- **get_flows**: Retrieve all flows from Node-RED instance
- **create_flow**: Create new flow using POST /flow
- **update_flow**: Update specific flow by ID using PUT /flow/:id
- **validate_flow**: Validate flow configuration without deploying

## Installation

```bash
npm install
npm run build
```

## Configuration

Set environment variables:

```bash
export NODE_RED_URL=http://localhost:1880
export NODE_RED_TOKEN=your-api-token  # Optional
```

### Node-RED Setup

#### Standalone Node-RED

1. Enable Admin API in Node-RED `settings.js`:
```javascript
adminAuth: {
  type: "credentials",
  users: [{
    username: "admin",
    password: "$2a$08$...",  // bcrypt hash
    permissions: "*"
  }]
}
```

2. Generate API token (if auth enabled):
```bash
curl -X POST http://localhost:1880/auth/token \
  -H "Content-Type: application/json" \
  -d '{"client_id":"node-red-admin","grant_type":"password","scope":"*","username":"admin","password":"your-password"}'
```

#### Home Assistant Add-on (hassio-addons/addon-node-red)

When running Node-RED via Home Assistant add-on, authentication uses Home Assistant credentials with Basic Auth:

```bash
# Test connection with HA credentials
curl http://USERNAME:PASSWORD@homeassistant.local:1880/flows
```

**Configuration**:
```bash
# Use basic auth in URL
export NODE_RED_URL=http://admin:your-ha-password@192.168.0.232:1880
# No NODE_RED_TOKEN needed for HA add-on
```

**Note**: Home Assistant add-on does not use `/auth/token` endpoint. API authentication is handled via HTTP Basic Auth using your Home Assistant credentials.

## Clients

<details>
<summary>Claude Code</summary>

Create `.mcp.json` in your project (copy from `.mcp.json.example`):

```json
{
  "mcpServers": {
    "node-red": {
      "command": "node",
      "args": ["/path/to/mcp-node-red/dist/index.js"],
      "env": {
        "NODE_RED_URL": "http://localhost:1880",
        "NODE_RED_TOKEN": "your-api-token"
      }
    }
  }
}
```

Load the config:
```bash
claude --mcp-config .mcp.json
```

</details>

<details>
<summary>Claude Desktop</summary>

Add to `~/.config/claude-code/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "node-red": {
      "command": "node",
      "args": ["/path/to/mcp-node-red/dist/index.js"],
      "env": {
        "NODE_RED_URL": "http://localhost:1880",
        "NODE_RED_TOKEN": "your-api-token"
      }
    }
  }
}
```

Or using npx:

```json
{
  "mcpServers": {
    "node-red": {
      "command": "npx",
      "args": ["-y", "mcp-node-red"],
      "env": {
        "NODE_RED_URL": "http://localhost:1880",
        "NODE_RED_TOKEN": "your-api-token"
      }
    }
  }
}
```

Restart Claude Desktop to apply changes.

</details>

## Usage

### Get Flows

```
Get all flows from my Node-RED instance
```

Returns current flows with revision number for optimistic locking.

### Create Flow

```
Create a new flow with label "My New Flow"
```

Creates a new flow using POST /flow endpoint. Flow ID can be provided or will be auto-generated.

**Flow format**:
```json
{
  "id": "optional-id",
  "label": "My Flow",
  "nodes": [],
  "configs": []
}
```

### Update Flow

```
Update flow "flow1" with label "New Name"
```

Updates specific flow using PUT /flow/:id endpoint. Only affects the specified flow, leaving all other flows untouched.

**Flow format**:
```json
{
  "id": "flow1",
  "label": "My Flow",
  "nodes": [],
  "configs": []
}
```

### Validate Flow

```
Validate this flow configuration:
{
  "id": "test",
  "label": "Test Flow",
  "nodes": []
}
```

Checks for:
- Required fields (id, label)
- Valid node references
- Structural integrity

## API Reference

### get_flows

Get all flows from Node-RED.

**Input**: None

**Output**:
```json
{
  "rev": "abc123",
  "flows": [...]
}
```

### create_flow

Create a new flow using POST /flow.

**Input**:
- `flow` (string): JSON string containing flow data with format: `{id, label, nodes: [], configs: []}`

**Output**:
```json
{
  "id": "flow1"
}
```

**Important**: Flow ID is optional - Node-RED will auto-generate if not provided. Returns 200 or 204 with the flow ID.

### update_flow

Update specific flow by ID using PUT /flow/:id.

**Input**:
- `flowId` (string): Flow ID to update
- `updates` (string): JSON string containing flow data with format: `{id, label, nodes: [], configs: []}`

**Output**:
```json
{
  "id": "flow1"
}
```

**Important**: This endpoint updates ONLY the specified flow. All other flows remain completely untouched. No risk of destroying unrelated workflows.

### validate_flow

Validate flow configuration.

**Input**:
- `flow` (string): JSON string containing flow data with format: `{id, label, nodes: [], configs: []}`

**Output**:
```json
{
  "valid": true,
  "errors": ["error1", "error2"]
}
```

## Development

```bash
# Build
npm run build

# Watch mode
npm run dev

# Test
npm test

# Coverage
npm run test:coverage

# Lint
npm run lint
npm run lint:fix

# Format
npm run format
```

## Node-RED Admin API v2

The server uses Admin API v2 endpoints:

### GET /flows
- Returns all flows: `{rev: "...", flows: [...]}`
- Headers: `Node-RED-API-Version: v2`, `Authorization`

### POST /flow
- Creates a new flow
- Request: `{id, label, nodes: [], configs: []}`
- Response: 200 or 204 with `{id: "..."}` in body
- Flow ID is optional - auto-generated if not provided

### PUT /flow/:id
- Updates a single flow by ID
- Request: `{id, label, nodes: [], configs: []}`
- Response: 204 with `{id: "..."}` in body
- Only affects the specified flow, all other flows remain untouched

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

## License

MIT
