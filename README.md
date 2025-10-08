# Node-RED MCP Server

MCP server for Node-RED workflow management. Provides AI assistants with tools to read, create, and update your Node-RED flows safely through the Admin API v2.

## Installation

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `~/.config/claude/claude_desktop_config.json` (Linux):

```json
{
  "mcpServers": {
    "node-red": {
      "command": "npx",
      "args": ["mcp-node-red"],
      "env": {
        "NODE_RED_URL": "http://localhost:1880",
        "NODE_RED_TOKEN": "your-api-token"
      }
    }
  }
}
```

Restart Claude Desktop to load the server.

### Claude Code

Create `.mcp.json` in your project:

```json
{
  "mcpServers": {
    "node-red": {
      "command": "npx",
      "args": ["mcp-node-red"],
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

## Configuration

### Environment Variables

- `NODE_RED_URL` (required): Your Node-RED instance URL
- `NODE_RED_TOKEN` (optional): API token for authentication

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

2. Generate API token:
```bash
curl -X POST http://localhost:1880/auth/token \
  -H "Content-Type: application/json" \
  -d '{"client_id":"node-red-admin","grant_type":"password","scope":"*","username":"admin","password":"your-password"}'
```

#### Home Assistant Add-on

The Home Assistant Node-RED add-on uses Basic Auth with your Home Assistant credentials:

```bash
# Test connection
curl http://USERNAME:PASSWORD@homeassistant.local:1880/flows
```

**Configuration**:
```json
{
  "mcpServers": {
    "node-red": {
      "command": "npx",
      "args": ["mcp-node-red"],
      "env": {
        "NODE_RED_URL": "http://admin:your-ha-password@homeassistant.local:1880"
      }
    }
  }
}
```

Note: No `NODE_RED_TOKEN` needed - credentials are in the URL.

## Features

- **get_flows**: Retrieve all flows from your Node-RED instance
- **create_flow**: Create new flows via POST /flow
- **update_flow**: Update individual flows via PUT /flow/:id
- **validate_flow**: Validate flow configuration without deploying

## Usage

Once configured, ask your AI assistant natural language questions:

```
Get all flows from my Node-RED instance
```

```
Create a new flow with label "Temperature Monitor"
```

```
Update flow "flow1" to change its label to "New Name"
```

```
Validate this flow configuration: {...}
```

## Safety Features

- **Individual flow updates**: Uses PUT /flow/:id to update only the specified flow
- **No accidental deletions**: Other flows remain completely untouched
- **Validation**: All flow configurations are validated before sending to Node-RED
- **Read-only by default**: Only modifies flows when explicitly requested

## API Reference

### get_flows

Get all flows from Node-RED.

**Returns**: `{rev: "...", flows: [...]}`

### create_flow

Create a new flow using POST /flow.

**Input**: Flow data `{id, label, nodes: [], configs: []}`
**Returns**: `{id: "flow1"}`

Flow ID is optional - Node-RED will auto-generate if not provided.

### update_flow

Update specific flow by ID using PUT /flow/:id.

**Input**:
- `flowId`: Flow ID to update
- `updates`: Flow data `{id, label, nodes: [], configs: []}`

**Returns**: `{id: "flow1"}`

Only affects the specified flow. All other flows remain untouched.

### validate_flow

Validate flow configuration without deploying.

**Input**: Flow data `{id, label, nodes: [], configs: []}`
**Returns**: `{valid: true, errors: []}`

Checks for required fields, valid node references, and structural integrity.

## Development

See [docs/development.md](docs/development.md) for development setup, testing, and contribution guidelines.

## License

MIT
