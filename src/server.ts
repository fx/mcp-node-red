import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { NodeRedClient } from './client.js';
import { ConfigSchema } from './schemas.js';
import { createFlow } from './tools/create-flow.js';
import { getFlows } from './tools/get-flows.js';
import { updateFlow } from './tools/update-flow.js';
import { validateFlow } from './tools/validate-flow.js';

export function createServer() {
  const nodeRedUrl = process.env.NODE_RED_URL;
  const nodeRedToken = process.env.NODE_RED_TOKEN;

  if (!nodeRedUrl) {
    throw new Error('NODE_RED_URL environment variable is required');
  }

  const config = ConfigSchema.parse({
    nodeRedUrl,
    nodeRedToken,
  });

  const client = new NodeRedClient(config);

  const server = new Server(
    {
      name: 'node-red-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'get_flows',
        description:
          'Get all flows from Node-RED instance. Returns current flows configuration including revision number.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'create_flow',
        description:
          'Create a new flow using POST /flow. Adds a new flow to Node-RED. Flow ID can be provided or will be auto-generated.',
        inputSchema: {
          type: 'object',
          properties: {
            flow: {
              type: 'string',
              description:
                'JSON string containing flow data with format: {id, label, nodes: [], configs: []}',
            },
          },
          required: ['flow'],
        },
      },
      {
        name: 'update_flow',
        description:
          'Update a specific flow by ID using PUT /flow/:id. Only affects the specified flow, leaving all other flows untouched. Requires flow object with id, label, nodes array, and optional configs array.',
        inputSchema: {
          type: 'object',
          properties: {
            flowId: {
              type: 'string',
              description: 'ID of the flow to update',
            },
            updates: {
              type: 'string',
              description:
                'JSON string containing flow update with format: {id, label, nodes: [], configs: []}',
            },
          },
          required: ['flowId', 'updates'],
        },
      },
      {
        name: 'validate_flow',
        description:
          'Validate flow configuration without deploying. Checks for required fields and structural integrity.',
        inputSchema: {
          type: 'object',
          properties: {
            flow: {
              type: 'string',
              description:
                'JSON string containing flow data with format: {id, label, nodes: [], configs: []}',
            },
          },
          required: ['flow'],
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      switch (request.params.name) {
        case 'get_flows':
          return await getFlows(client);
        case 'create_flow':
          return await createFlow(client, request.params.arguments);
        case 'update_flow':
          return await updateFlow(client, request.params.arguments);
        case 'validate_flow':
          return await validateFlow(client, request.params.arguments);
        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

export async function runServer() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
