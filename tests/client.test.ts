import { request } from 'undici';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NodeRedClient } from '../src/client.js';
import type { Config } from '../src/schemas.js';

vi.mock('undici');

describe('NodeRedClient', () => {
  let client: NodeRedClient;
  const mockConfig: Config = {
    nodeRedUrl: 'http://localhost:1880',
    nodeRedToken: 'test-token',
  };

  beforeEach(() => {
    client = new NodeRedClient(mockConfig);
    vi.clearAllMocks();
  });

  describe('getFlows', () => {
    it('should fetch flows successfully', async () => {
      const mockFlows = {
        rev: 'abc123',
        flows: [
          { id: '1', type: 'tab', label: 'Flow 1' },
          { id: '2', type: 'inject', z: '1', name: 'Inject' },
        ],
      };

      vi.mocked(request).mockResolvedValue({
        statusCode: 200,
        body: {
          json: vi.fn().mockResolvedValue(mockFlows),
          text: vi.fn(),
        },
      } as any);

      const result = await client.getFlows();

      expect(result).toEqual(mockFlows);
      expect(request).toHaveBeenCalledWith('http://localhost:1880/flows', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Node-RED-API-Version': 'v2',
          Authorization: 'Bearer test-token',
        },
      });
    });

    it('should throw error on failed request', async () => {
      vi.mocked(request).mockResolvedValue({
        statusCode: 500,
        body: {
          text: vi.fn().mockResolvedValue('Internal Server Error'),
        },
      } as any);

      await expect(client.getFlows()).rejects.toThrow('Failed to get flows: 500');
    });

    it('should work without authentication token', async () => {
      const clientNoAuth = new NodeRedClient({
        nodeRedUrl: 'http://localhost:1880',
      });

      const mockFlows = {
        rev: 'abc123',
        flows: [],
      };

      vi.mocked(request).mockResolvedValue({
        statusCode: 200,
        body: {
          json: vi.fn().mockResolvedValue(mockFlows),
          text: vi.fn(),
        },
      } as any);

      await clientNoAuth.getFlows();

      expect(request).toHaveBeenCalledWith('http://localhost:1880/flows', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Node-RED-API-Version': 'v2',
        },
      });
    });
  });

  describe('updateFlow', () => {
    it('should update flow successfully', async () => {
      const flowData = {
        id: '1',
        label: 'Updated Flow',
        nodes: [],
        configs: [],
      };

      const mockResponse = { id: '1' };

      vi.mocked(request).mockResolvedValue({
        statusCode: 204,
        body: {
          json: vi.fn().mockResolvedValue(mockResponse),
          text: vi.fn(),
        },
      } as any);

      const result = await client.updateFlow('1', flowData);

      expect(result).toEqual(mockResponse);
      expect(request).toHaveBeenCalledWith('http://localhost:1880/flow/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Node-RED-API-Version': 'v2',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify(flowData),
      });
    });

    it('should throw error on failed update', async () => {
      vi.mocked(request).mockResolvedValue({
        statusCode: 500,
        body: {
          text: vi.fn().mockResolvedValue('Internal Server Error'),
        },
      } as any);

      await expect(client.updateFlow('1', { id: '1', label: 'Test' })).rejects.toThrow(
        'Failed to update flow: 500'
      );
    });
  });

  describe('validateFlow', () => {
    it('should validate flow successfully', async () => {
      const validFlow = {
        id: '1',
        label: 'Test Flow',
        nodes: [{ id: '2', type: 'inject', name: 'Test' }],
      };

      const result = await client.validateFlow(validFlow);

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should detect missing required fields', async () => {
      const invalidFlow = {
        id: '',
        label: 'Test',
      };

      const result = await client.validateFlow(invalidFlow);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toContain('Flow missing required id field');
    });

    it('should validate nodes in flow', async () => {
      const flowWithInvalidNode = {
        id: '1',
        label: 'Test',
        nodes: [{ id: '', type: 'inject' }],
      };

      const result = await client.validateFlow(flowWithInvalidNode);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toContain('Node missing required id field');
    });

    it('should validate config nodes', async () => {
      const flowWithInvalidConfig = {
        id: '1',
        label: 'Test',
        configs: [{ id: '', type: '' }],
      };

      const result = await client.validateFlow(flowWithInvalidConfig);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should handle validation errors gracefully', async () => {
      const result = await client.validateFlow({ id: '1' });

      expect(result.valid).toBe(true);
    });
  });

  describe('Basic Auth', () => {
    it('should extract credentials from URL', () => {
      const clientWithAuth = new NodeRedClient({
        nodeRedUrl: 'http://user:pass@localhost:1880',
      });

      const mockFlows = {
        rev: 'abc123',
        flows: [],
      };

      vi.mocked(request).mockResolvedValue({
        statusCode: 200,
        body: {
          json: vi.fn().mockResolvedValue(mockFlows),
          text: vi.fn(),
        },
      } as any);

      clientWithAuth.getFlows();

      expect(request).toHaveBeenCalledWith('http://localhost:1880/flows', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Node-RED-API-Version': 'v2',
          Authorization: `Basic ${Buffer.from('user:pass').toString('base64')}`,
        },
      });
    });
  });
});
