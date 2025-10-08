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
});
