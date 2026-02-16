# Node-RED MCP Server

MCP server for Node-RED workflow management. Provides AI assistants with 17 tools to manage flows, node modules, context stores, and runtime settings through the Node-RED Admin API v2.

## Installation

<details>
<summary><strong>Claude Code</strong></summary>

**Standalone Node-RED:**
```bash
claude mcp add node-red -e NODE_RED_URL=http://localhost:1880 -e NODE_RED_TOKEN=your-api-token -- npx mcp-node-red
```

**Home Assistant Add-on (Basic Auth):**
```bash
claude mcp add node-red -e NODE_RED_URL=http://username:password@homeassistant.local:1880 -- npx mcp-node-red
```

</details>

<details>
<summary><strong>Claude Desktop</strong></summary>

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

</details>

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

### Flow Management
- **get_flows**: Retrieve all flows from your Node-RED instance
- **create_flow**: Create new flows via POST /flow
- **update_flow**: Update individual flows safely via PUT /flow/:id
- **validate_flow**: Validate flow configuration without deploying
- **delete_flow**: Delete a flow and all its nodes by ID

### Runtime Control
- **get_flow_state**: Get runtime state of flows (started/stopped)
- **set_flow_state**: Start or stop all flows in the runtime

### Node Module Management
- **get_nodes**: List all installed node modules with versions and status
- **install_node**: Install a node module from the npm registry
- **set_node_module_state**: Enable or disable an installed node module
- **remove_node_module**: Uninstall a node module from Node-RED

### Context Store
- **get_context**: Read context data at global, flow, or node scope
- **delete_context**: Delete context values at any scope

### Runtime Info
- **get_settings**: Get Node-RED runtime settings including version
- **get_diagnostics**: Get system diagnostics (Node.js, OS, memory)

### Node Interaction
- **trigger_inject**: Trigger an inject node (same as clicking the button)
- **set_debug_state**: Enable or disable a debug node's output

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
Delete the flow with ID "flow1"
```

```
What node modules are installed?
```

```
Install the node-red-contrib-mqtt module
```

```
Trigger the inject node to test my flow
```

```
Show me the global context data
```

```
Get the Node-RED runtime settings and version
```

## Safety Features

- **Individual flow updates**: Uses PUT /flow/:id to update only the specified flow
- **No accidental deletions**: Other flows remain completely untouched
- **Validation**: All flow configurations are validated before sending to Node-RED
- **Read-only by default**: Only modifies flows when explicitly requested
- **Module management guards**: Core modules cannot be removed; enable/disable is reversible
- **Scoped context operations**: Context reads and deletes are scoped to specific keys

## Development

See [docs/development.md](docs/development.md) for development setup, testing, and contribution guidelines.

## License

MIT
