import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createServer } from '../src/server.js';

describe('MCP Server', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should throw error when NODE_RED_URL is missing', () => {
    process.env.NODE_RED_URL = undefined;
    expect(() => createServer()).toThrow('NODE_RED_URL environment variable is required');
  });

  it('should create server with valid configuration', () => {
    process.env.NODE_RED_URL = 'http://localhost:1880';
    process.env.NODE_RED_TOKEN = 'test-token';

    const server = createServer();
    expect(server).toBeDefined();
  });

  it('should create server without token', () => {
    process.env.NODE_RED_URL = 'http://localhost:1880';
    process.env.NODE_RED_TOKEN = undefined;

    const server = createServer();
    expect(server).toBeDefined();
  });

  it('should validate URL format', () => {
    process.env.NODE_RED_URL = 'invalid-url';

    expect(() => createServer()).toThrow();
  });

  it('should list delete_flow in available tools', async () => {
    process.env.NODE_RED_URL = 'http://localhost:1880';
    process.env.NODE_RED_TOKEN = 'test-token';

    const server = createServer();
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    const client = new Client({ name: 'test-client', version: '1.0.0' });

    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const { tools } = await client.listTools();
    const toolNames = tools.map((t) => t.name);

    expect(toolNames).toContain('get_flows');
    expect(toolNames).toContain('create_flow');
    expect(toolNames).toContain('update_flow');
    expect(toolNames).toContain('validate_flow');
    expect(toolNames).toContain('delete_flow');

    await client.close();
    await server.close();
  });
});
