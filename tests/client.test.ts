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
    it('should update flow successfully with 200 response', async () => {
      const flowData = {
        id: '1',
        label: 'Updated Flow',
        nodes: [],
        configs: [],
      };

      const mockResponse = { id: '1' };

      vi.mocked(request).mockResolvedValue({
        statusCode: 200,
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

    it('should handle 204 response by returning flowId', async () => {
      const flowData = {
        id: '1',
        label: 'Updated Flow',
        nodes: [],
        configs: [],
      };

      vi.mocked(request).mockResolvedValue({
        statusCode: 204,
        body: {
          text: vi.fn(),
        },
      } as any);

      const result = await client.updateFlow('1', flowData);

      expect(result).toEqual({ id: '1' });
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

  describe('deleteFlow', () => {
    it('should delete flow successfully', async () => {
      vi.mocked(request).mockResolvedValue({
        statusCode: 204,
        body: {
          text: vi.fn(),
        },
      } as any);

      await client.deleteFlow('flow-1');

      expect(request).toHaveBeenCalledWith('http://localhost:1880/flow/flow-1', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Node-RED-API-Version': 'v2',
          Authorization: 'Bearer test-token',
        },
      });
    });

    it('should throw error when flow not found', async () => {
      vi.mocked(request).mockResolvedValue({
        statusCode: 404,
        body: {
          text: vi.fn().mockResolvedValue('Not Found'),
        },
      } as any);

      await expect(client.deleteFlow('nonexistent')).rejects.toThrow('Failed to delete flow: 404');
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

  describe('getFlowState', () => {
    it('should get flow state successfully', async () => {
      const mockState = { state: 'start' };

      vi.mocked(request).mockResolvedValue({
        statusCode: 200,
        body: {
          json: vi.fn().mockResolvedValue(mockState),
          text: vi.fn(),
        },
      } as any);

      const result = await client.getFlowState();

      expect(result).toEqual(mockState);
      expect(request).toHaveBeenCalledWith('http://localhost:1880/flows/state', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Node-RED-API-Version': 'v2',
          Authorization: 'Bearer test-token',
        },
      });
    });

    it('should throw error when runtimeState is disabled (400)', async () => {
      vi.mocked(request).mockResolvedValue({
        statusCode: 400,
        body: {
          text: vi.fn().mockResolvedValue('runtimeState not enabled'),
        },
      } as any);

      await expect(client.getFlowState()).rejects.toThrow('Failed to get flow state: 400');
    });

    it('should throw error on server error', async () => {
      vi.mocked(request).mockResolvedValue({
        statusCode: 500,
        body: {
          text: vi.fn().mockResolvedValue('Internal Server Error'),
        },
      } as any);

      await expect(client.getFlowState()).rejects.toThrow('Failed to get flow state: 500');
    });
  });

  describe('setFlowState', () => {
    it('should set flow state to stop', async () => {
      const mockState = { state: 'stop' };

      vi.mocked(request).mockResolvedValue({
        statusCode: 200,
        body: {
          json: vi.fn().mockResolvedValue(mockState),
          text: vi.fn(),
        },
      } as any);

      const result = await client.setFlowState('stop');

      expect(result).toEqual(mockState);
      expect(request).toHaveBeenCalledWith('http://localhost:1880/flows/state', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Node-RED-API-Version': 'v2',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({ state: 'stop' }),
      });
    });

    it('should set flow state to start', async () => {
      const mockState = { state: 'start' };

      vi.mocked(request).mockResolvedValue({
        statusCode: 200,
        body: {
          json: vi.fn().mockResolvedValue(mockState),
          text: vi.fn(),
        },
      } as any);

      const result = await client.setFlowState('start');

      expect(result).toEqual(mockState);
      expect(request).toHaveBeenCalledWith('http://localhost:1880/flows/state', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Node-RED-API-Version': 'v2',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({ state: 'start' }),
      });
    });

    it('should throw error when runtimeState is disabled (400)', async () => {
      vi.mocked(request).mockResolvedValue({
        statusCode: 400,
        body: {
          text: vi.fn().mockResolvedValue('runtimeState not enabled'),
        },
      } as any);

      await expect(client.setFlowState('stop')).rejects.toThrow('Failed to set flow state: 400');
    });

    it('should throw error on server error', async () => {
      vi.mocked(request).mockResolvedValue({
        statusCode: 500,
        body: {
          text: vi.fn().mockResolvedValue('Internal Server Error'),
        },
      } as any);

      await expect(client.setFlowState('start')).rejects.toThrow('Failed to set flow state: 500');
    });
  });

  describe('getContext', () => {
    it('should get global context keys', async () => {
      const mockData = { key1: 'value1', key2: 'value2' };
      vi.mocked(request).mockResolvedValue({
        statusCode: 200,
        body: { json: vi.fn().mockResolvedValue(mockData), text: vi.fn() },
      } as any);

      const result = await client.getContext('global');
      expect(result).toEqual(mockData);
      expect(request).toHaveBeenCalledWith('http://localhost:1880/context/global', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Node-RED-API-Version': 'v2',
          Authorization: 'Bearer test-token',
        },
      });
    });

    it('should get global context by key', async () => {
      vi.mocked(request).mockResolvedValue({
        statusCode: 200,
        body: { json: vi.fn().mockResolvedValue({ msg: 'hello' }), text: vi.fn() },
      } as any);
      await client.getContext('global', undefined, 'myKey');
      expect(request).toHaveBeenCalledWith(
        'http://localhost:1880/context/global/myKey',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should get flow context by id', async () => {
      vi.mocked(request).mockResolvedValue({
        statusCode: 200,
        body: { json: vi.fn().mockResolvedValue({ counter: 42 }), text: vi.fn() },
      } as any);
      await client.getContext('flow', 'flow-1');
      expect(request).toHaveBeenCalledWith(
        'http://localhost:1880/context/flow/flow-1',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should get flow context by id and key', async () => {
      vi.mocked(request).mockResolvedValue({
        statusCode: 200,
        body: { json: vi.fn().mockResolvedValue({ value: 'test' }), text: vi.fn() },
      } as any);
      await client.getContext('flow', 'flow-1', 'myKey');
      expect(request).toHaveBeenCalledWith(
        'http://localhost:1880/context/flow/flow-1/myKey',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should get node context by id and key', async () => {
      vi.mocked(request).mockResolvedValue({
        statusCode: 200,
        body: { json: vi.fn().mockResolvedValue({ value: 123 }), text: vi.fn() },
      } as any);
      await client.getContext('node', 'node-1', 'count');
      expect(request).toHaveBeenCalledWith(
        'http://localhost:1880/context/node/node-1/count',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should include store query param', async () => {
      vi.mocked(request).mockResolvedValue({
        statusCode: 200,
        body: { json: vi.fn().mockResolvedValue({}), text: vi.fn() },
      } as any);
      await client.getContext('global', undefined, 'myKey', 'file');
      expect(request).toHaveBeenCalledWith(
        'http://localhost:1880/context/global/myKey?store=file',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should throw error on failed request', async () => {
      vi.mocked(request).mockResolvedValue({
        statusCode: 404,
        body: { text: vi.fn().mockResolvedValue('Not Found') },
      } as any);
      await expect(client.getContext('flow', 'bad-id')).rejects.toThrow(
        'Failed to get context: 404'
      );
    });
  });

  describe('deleteContext', () => {
    it('should delete global context key', async () => {
      vi.mocked(request).mockResolvedValue({
        statusCode: 204,
        body: { text: vi.fn() },
      } as any);
      await client.deleteContext('global', undefined, 'myKey');
      expect(request).toHaveBeenCalledWith(
        'http://localhost:1880/context/global/myKey',
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should delete flow context key', async () => {
      vi.mocked(request).mockResolvedValue({
        statusCode: 204,
        body: { text: vi.fn() },
      } as any);
      await client.deleteContext('flow', 'flow-1', 'counter');
      expect(request).toHaveBeenCalledWith(
        'http://localhost:1880/context/flow/flow-1/counter',
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should delete node context key', async () => {
      vi.mocked(request).mockResolvedValue({
        statusCode: 204,
        body: { text: vi.fn() },
      } as any);
      await client.deleteContext('node', 'node-1', 'data');
      expect(request).toHaveBeenCalledWith(
        'http://localhost:1880/context/node/node-1/data',
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should include store query param on delete', async () => {
      vi.mocked(request).mockResolvedValue({
        statusCode: 204,
        body: { text: vi.fn() },
      } as any);
      await client.deleteContext('global', undefined, 'myKey', 'file');
      expect(request).toHaveBeenCalledWith(
        'http://localhost:1880/context/global/myKey?store=file',
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should throw error on failed delete', async () => {
      vi.mocked(request).mockResolvedValue({
        statusCode: 404,
        body: { text: vi.fn().mockResolvedValue('Not Found') },
      } as any);
      await expect(client.deleteContext('flow', 'bad-id', 'key')).rejects.toThrow(
        'Failed to delete context: 404'
      );
    });
  });

  describe('triggerInject', () => {
    it('should trigger inject node successfully', async () => {
      vi.mocked(request).mockResolvedValue({
        statusCode: 200,
        body: {
          text: vi.fn(),
        },
      } as any);

      await client.triggerInject('node-123');

      expect(request).toHaveBeenCalledWith('http://localhost:1880/inject/node-123', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Node-RED-API-Version': 'v2',
          Authorization: 'Bearer test-token',
        },
      });
    });

    it('should throw error when inject node not found', async () => {
      vi.mocked(request).mockResolvedValue({
        statusCode: 404,
        body: {
          text: vi.fn().mockResolvedValue('Not Found'),
        },
      } as any);

      await expect(client.triggerInject('missing-node')).rejects.toThrow(
        'Failed to trigger inject node: 404'
      );
    });

    it('should throw error on server error', async () => {
      vi.mocked(request).mockResolvedValue({
        statusCode: 500,
        body: {
          text: vi.fn().mockResolvedValue('Internal Server Error'),
        },
      } as any);

      await expect(client.triggerInject('node-123')).rejects.toThrow(
        'Failed to trigger inject node: 500'
      );
    });
  });

  describe('setDebugNodeState', () => {
    it('should enable debug node successfully', async () => {
      vi.mocked(request).mockResolvedValue({
        statusCode: 200,
        body: {
          text: vi.fn(),
        },
      } as any);

      await client.setDebugNodeState('debug-1', true);

      expect(request).toHaveBeenCalledWith('http://localhost:1880/debug/debug-1/enable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Node-RED-API-Version': 'v2',
          Authorization: 'Bearer test-token',
        },
      });
    });

    it('should disable debug node successfully', async () => {
      vi.mocked(request).mockResolvedValue({
        statusCode: 201,
        body: {
          text: vi.fn(),
        },
      } as any);

      await client.setDebugNodeState('debug-1', false);

      expect(request).toHaveBeenCalledWith('http://localhost:1880/debug/debug-1/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Node-RED-API-Version': 'v2',
          Authorization: 'Bearer test-token',
        },
      });
    });

    it('should throw error on failure', async () => {
      vi.mocked(request).mockResolvedValue({
        statusCode: 404,
        body: {
          text: vi.fn().mockResolvedValue('Not Found'),
        },
      } as any);

      await expect(client.setDebugNodeState('debug-1', true)).rejects.toThrow(
        'Failed to enable debug node: 404'
      );
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

  describe('getNodes', () => {
    it('should fetch nodes successfully', async () => {
      const mockModules = [
        {
          name: 'node-red-contrib-example',
          version: '1.0.0',
          nodes: {
            example: {
              id: 'node-red-contrib-example/example',
              name: 'example',
              types: ['example-node'],
              enabled: true,
              module: 'node-red-contrib-example',
            },
          },
        },
      ];

      vi.mocked(request).mockResolvedValue({
        statusCode: 200,
        body: {
          json: vi.fn().mockResolvedValue(mockModules),
          text: vi.fn(),
        },
      } as any);

      const result = await client.getNodes();

      expect(result).toEqual(mockModules);
      expect(request).toHaveBeenCalledWith('http://localhost:1880/nodes', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Node-RED-API-Version': 'v2',
          Authorization: 'Bearer test-token',
          Accept: 'application/json',
        },
      });
    });

    it('should handle modules without nodes field', async () => {
      const mockModules = [
        {
          name: 'node-red',
          version: '4.1.5',
        },
        {
          name: 'node-red-contrib-example',
          version: '1.0.0',
          nodes: {
            example: {
              id: 'node-red-contrib-example/example',
              name: 'example',
              types: ['example-node'],
              enabled: true,
              module: 'node-red-contrib-example',
            },
          },
        },
      ];

      vi.mocked(request).mockResolvedValue({
        statusCode: 200,
        body: {
          json: vi.fn().mockResolvedValue(mockModules),
          text: vi.fn(),
        },
      } as any);

      const result = await client.getNodes();

      expect(result).toHaveLength(2);
      expect(result[0].nodes).toBeUndefined();
      expect(result[1].nodes).toBeDefined();
    });

    it('should throw error on failed request', async () => {
      vi.mocked(request).mockResolvedValue({
        statusCode: 500,
        body: {
          text: vi.fn().mockResolvedValue('Internal Server Error'),
        },
      } as any);

      await expect(client.getNodes()).rejects.toThrow('Failed to get nodes: 500');
    });
  });

  describe('installNode', () => {
    it('should install node module successfully', async () => {
      const mockModule = {
        name: 'node-red-contrib-example',
        version: '1.0.0',
        nodes: {
          example: {
            id: 'node-red-contrib-example/example',
            name: 'example',
            types: ['example-node'],
            enabled: true,
            module: 'node-red-contrib-example',
          },
        },
      };

      vi.mocked(request).mockResolvedValue({
        statusCode: 200,
        body: {
          json: vi.fn().mockResolvedValue(mockModule),
          text: vi.fn(),
        },
      } as any);

      const result = await client.installNode('node-red-contrib-example');

      expect(result).toEqual(mockModule);
      expect(request).toHaveBeenCalledWith('http://localhost:1880/nodes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Node-RED-API-Version': 'v2',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({ module: 'node-red-contrib-example' }),
      });
    });

    it('should throw error on failed install', async () => {
      vi.mocked(request).mockResolvedValue({
        statusCode: 400,
        body: {
          text: vi.fn().mockResolvedValue('Module not found'),
        },
      } as any);

      await expect(client.installNode('nonexistent')).rejects.toThrow(
        'Failed to install node module: 400'
      );
    });
  });

  describe('setNodeModuleState', () => {
    it('should enable a module with nodes as array', async () => {
      const mockModule = {
        name: 'node-red-contrib-example',
        version: '1.0.0',
        nodes: [
          {
            id: 'node-red-contrib-example/example',
            name: 'example',
            types: ['example-node'],
            enabled: true,
            module: 'node-red-contrib-example',
          },
        ],
      };

      vi.mocked(request).mockResolvedValue({
        statusCode: 200,
        body: {
          json: vi.fn().mockResolvedValue(mockModule),
          text: vi.fn(),
        },
      } as any);

      const result = await client.setNodeModuleState('node-red-contrib-example', true);

      expect(result).toEqual(mockModule);
      expect(request).toHaveBeenCalledWith('http://localhost:1880/nodes/node-red-contrib-example', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Node-RED-API-Version': 'v2',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({ enabled: true }),
      });
    });

    it('should disable a module', async () => {
      const mockModule = {
        name: 'node-red-contrib-example',
        version: '1.0.0',
        nodes: {
          example: {
            id: 'node-red-contrib-example/example',
            name: 'example',
            types: ['example-node'],
            enabled: false,
            module: 'node-red-contrib-example',
          },
        },
      };

      vi.mocked(request).mockResolvedValue({
        statusCode: 200,
        body: {
          json: vi.fn().mockResolvedValue(mockModule),
          text: vi.fn(),
        },
      } as any);

      await client.setNodeModuleState('node-red-contrib-example', false);

      expect(request).toHaveBeenCalledWith('http://localhost:1880/nodes/node-red-contrib-example', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Node-RED-API-Version': 'v2',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({ enabled: false }),
      });
    });

    it('should throw error on failed state change', async () => {
      vi.mocked(request).mockResolvedValue({
        statusCode: 400,
        body: {
          text: vi.fn().mockResolvedValue('Cannot disable core module'),
        },
      } as any);

      await expect(client.setNodeModuleState('node-red/core', true)).rejects.toThrow(
        'Failed to set node module state: 400'
      );
    });
  });

  describe('removeNodeModule', () => {
    it('should remove module successfully', async () => {
      vi.mocked(request).mockResolvedValue({
        statusCode: 204,
        body: {
          text: vi.fn(),
        },
      } as any);

      await expect(client.removeNodeModule('node-red-contrib-example')).resolves.toBeUndefined();

      expect(request).toHaveBeenCalledWith('http://localhost:1880/nodes/node-red-contrib-example', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Node-RED-API-Version': 'v2',
          Authorization: 'Bearer test-token',
        },
      });
    });

    it('should throw error when removing core module', async () => {
      vi.mocked(request).mockResolvedValue({
        statusCode: 400,
        body: {
          text: vi.fn().mockResolvedValue('Cannot remove core module'),
        },
      } as any);

      await expect(client.removeNodeModule('node-red/core')).rejects.toThrow(
        'Failed to remove node module: 400'
      );
    });

    it('should throw error when module not found', async () => {
      vi.mocked(request).mockResolvedValue({
        statusCode: 404,
        body: {
          text: vi.fn().mockResolvedValue('Module not found'),
        },
      } as any);

      await expect(client.removeNodeModule('nonexistent')).rejects.toThrow(
        'Failed to remove node module: 404'
      );
    });
  });
});
