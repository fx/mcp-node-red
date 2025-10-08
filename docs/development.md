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

## Testing

Tests use vitest with mocked `undici` requests. Each component has dedicated test file:
- `tests/client.test.ts` - HTTP client + auth modes
- `tests/tools.test.ts` - Tool handlers
- `tests/server.test.ts` - MCP server setup

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
