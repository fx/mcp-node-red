import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NodeRedClient } from '../src/client.js';
import { deleteFlow } from '../src/tools/delete-flow.js';
import { getFlowState } from '../src/tools/get-flow-state.js';
import { getFlows } from '../src/tools/get-flows.js';
import { getNodes } from '../src/tools/get-nodes.js';
import { installNode } from '../src/tools/install-node.js';
import { removeNodeModule } from '../src/tools/remove-node-module.js';
import { setFlowState } from '../src/tools/set-flow-state.js';
import { setNodeModuleState } from '../src/tools/set-node-module-state.js';
import { updateFlow } from '../src/tools/update-flow.js';
import { validateFlow } from '../src/tools/validate-flow.js';

describe('Tool Handlers', () => {
  let mockClient: NodeRedClient;

  beforeEach(() => {
    mockClient = {
      getFlows: vi.fn(),
      updateFlow: vi.fn(),
      deleteFlow: vi.fn(),
      validateFlow: vi.fn(),
      getFlowState: vi.fn(),
      setFlowState: vi.fn(),
      getNodes: vi.fn(),
      installNode: vi.fn(),
      setNodeModuleState: vi.fn(),
      removeNodeModule: vi.fn(),
    } as any;
  });

  describe('getFlows', () => {
    it('should return formatted flows', async () => {
      const mockFlowsData = {
        rev: 'abc123',
        flows: [{ id: '1', type: 'tab', label: 'Flow 1' }],
      };

      vi.mocked(mockClient.getFlows).mockResolvedValue(mockFlowsData);

      const result = await getFlows(mockClient);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(JSON.parse(result.content[0].text)).toEqual(mockFlowsData);
    });
  });

  describe('updateFlow', () => {
    it('should update flow', async () => {
      const mockResponse = { id: '1' };

      vi.mocked(mockClient.updateFlow).mockResolvedValue(mockResponse);

      const result = await updateFlow(mockClient, {
        flowId: '1',
        updates: JSON.stringify({ label: 'New Label', nodes: [] }),
      });

      expect(mockClient.updateFlow).toHaveBeenCalledWith('1', {
        id: '1',
        label: 'New Label',
        nodes: [],
      });
      expect(JSON.parse(result.content[0].text)).toEqual(mockResponse);
    });

    it('should throw error for invalid JSON updates', async () => {
      await expect(
        updateFlow(mockClient, {
          flowId: '1',
          updates: 'invalid json',
        })
      ).rejects.toThrow('Invalid JSON in updates parameter');
    });

    it('should ensure flowId matches id in updates', async () => {
      vi.mocked(mockClient.updateFlow).mockResolvedValue({ id: '1' });

      await updateFlow(mockClient, {
        flowId: '1',
        updates: JSON.stringify({ label: 'Test' }),
      });

      expect(mockClient.updateFlow).toHaveBeenCalledWith('1', expect.objectContaining({ id: '1' }));
    });
  });

  describe('deleteFlow', () => {
    it('should delete flow and return confirmation', async () => {
      vi.mocked(mockClient.deleteFlow).mockResolvedValue(undefined);

      const result = await deleteFlow(mockClient, { flowId: 'flow-1' });

      expect(mockClient.deleteFlow).toHaveBeenCalledWith('flow-1');
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(JSON.parse(result.content[0].text)).toEqual({ deleted: 'flow-1' });
    });

    it('should throw error for missing flowId', async () => {
      await expect(deleteFlow(mockClient, {})).rejects.toThrow();
    });

    it('should propagate client errors', async () => {
      vi.mocked(mockClient.deleteFlow).mockRejectedValue(
        new Error('Failed to delete flow: 404\nNot Found')
      );

      await expect(deleteFlow(mockClient, { flowId: 'nonexistent' })).rejects.toThrow(
        'Failed to delete flow: 404'
      );
    });
  });

  describe('validateFlow', () => {
    it('should validate valid flow', async () => {
      vi.mocked(mockClient.validateFlow).mockResolvedValue({
        valid: true,
      });

      const result = await validateFlow(mockClient, {
        flow: JSON.stringify({ id: '1', label: 'Test', nodes: [] }),
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.valid).toBe(true);
      expect(parsed.errors).toBeUndefined();
    });

    it('should return validation errors', async () => {
      vi.mocked(mockClient.validateFlow).mockResolvedValue({
        valid: false,
        errors: ['Missing required field'],
      });

      const result = await validateFlow(mockClient, {
        flow: JSON.stringify({ id: '1' }),
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.valid).toBe(false);
      expect(parsed.errors).toEqual(['Missing required field']);
    });

    it('should handle invalid JSON gracefully', async () => {
      const result = await validateFlow(mockClient, {
        flow: 'invalid json',
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.valid).toBe(false);
      expect(parsed.errors).toBeDefined();
      expect(parsed.errors[0]).toContain('Invalid JSON');
    });
  });

  describe('getFlowState', () => {
    it('should return flow state', async () => {
      vi.mocked(mockClient.getFlowState).mockResolvedValue({ state: 'start' });

      const result = await getFlowState(mockClient);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.state).toBe('start');
    });

    it('should return stopped state', async () => {
      vi.mocked(mockClient.getFlowState).mockResolvedValue({ state: 'stop' });

      const result = await getFlowState(mockClient);

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.state).toBe('stop');
    });
  });

  describe('setFlowState', () => {
    it('should set state to stop', async () => {
      vi.mocked(mockClient.setFlowState).mockResolvedValue({ state: 'stop' });

      const result = await setFlowState(mockClient, { state: 'stop' });

      expect(mockClient.setFlowState).toHaveBeenCalledWith('stop');
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.state).toBe('stop');
    });

    it('should set state to start', async () => {
      vi.mocked(mockClient.setFlowState).mockResolvedValue({ state: 'start' });

      const result = await setFlowState(mockClient, { state: 'start' });

      expect(mockClient.setFlowState).toHaveBeenCalledWith('start');
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.state).toBe('start');
    });

    it('should throw error for invalid state', async () => {
      await expect(setFlowState(mockClient, { state: 'invalid' })).rejects.toThrow();
    });

    it('should throw error when state is missing', async () => {
      await expect(setFlowState(mockClient, {})).rejects.toThrow();
    });
  });

  describe('getNodes', () => {
    it('should return formatted node modules', async () => {
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

      vi.mocked(mockClient.getNodes).mockResolvedValue(mockModules);

      const result = await getNodes(mockClient);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(JSON.parse(result.content[0].text)).toEqual(mockModules);
    });

    it('should handle empty modules list', async () => {
      vi.mocked(mockClient.getNodes).mockResolvedValue([]);

      const result = await getNodes(mockClient);

      expect(JSON.parse(result.content[0].text)).toEqual([]);
    });
  });

  describe('installNode', () => {
    it('should install node module', async () => {
      const mockModule = {
        name: 'node-red-contrib-example',
        version: '1.0.0',
        nodes: {},
      };

      vi.mocked(mockClient.installNode).mockResolvedValue(mockModule);

      const result = await installNode(mockClient, { module: 'node-red-contrib-example' });

      expect(mockClient.installNode).toHaveBeenCalledWith('node-red-contrib-example');
      expect(JSON.parse(result.content[0].text)).toEqual(mockModule);
    });

    it('should throw on missing module argument', async () => {
      await expect(installNode(mockClient, {})).rejects.toThrow();
    });
  });

  describe('setNodeModuleState', () => {
    it('should enable a module', async () => {
      const mockModule = {
        name: 'node-red-contrib-example',
        version: '1.0.0',
        nodes: {},
      };

      vi.mocked(mockClient.setNodeModuleState).mockResolvedValue(mockModule);

      const result = await setNodeModuleState(mockClient, {
        module: 'node-red-contrib-example',
        enabled: true,
      });

      expect(mockClient.setNodeModuleState).toHaveBeenCalledWith('node-red-contrib-example', true);
      expect(JSON.parse(result.content[0].text)).toEqual(mockModule);
    });

    it('should disable a module', async () => {
      const mockModule = {
        name: 'node-red-contrib-example',
        version: '1.0.0',
        nodes: {},
      };

      vi.mocked(mockClient.setNodeModuleState).mockResolvedValue(mockModule);

      const result = await setNodeModuleState(mockClient, {
        module: 'node-red-contrib-example',
        enabled: false,
      });

      expect(mockClient.setNodeModuleState).toHaveBeenCalledWith('node-red-contrib-example', false);
      expect(JSON.parse(result.content[0].text)).toEqual(mockModule);
    });

    it('should throw on missing module argument', async () => {
      await expect(setNodeModuleState(mockClient, { enabled: true })).rejects.toThrow();
    });

    it('should throw on missing enabled argument', async () => {
      await expect(
        setNodeModuleState(mockClient, { module: 'node-red-contrib-example' })
      ).rejects.toThrow();
    });
  });

  describe('removeNodeModule', () => {
    it('should remove node module', async () => {
      vi.mocked(mockClient.removeNodeModule).mockResolvedValue(undefined);

      const result = await removeNodeModule(mockClient, { module: 'node-red-contrib-example' });

      expect(mockClient.removeNodeModule).toHaveBeenCalledWith('node-red-contrib-example');
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(true);
      expect(parsed.module).toBe('node-red-contrib-example');
    });

    it('should throw on missing module argument', async () => {
      await expect(removeNodeModule(mockClient, {})).rejects.toThrow();
    });
  });
});
