import { request } from 'undici';
import { z } from 'zod';
import type {
  Config,
  FlowState,
  NodeModule,
  NodeRedDiagnostics,
  NodeRedFlowsResponse,
  NodeRedSettings,
  UpdateFlowRequest,
} from './schemas.js';
import {
  FlowStateSchema,
  NodeModuleSchema,
  NodeRedDiagnosticsSchema,
  NodeRedFlowsResponseSchema,
  NodeRedSettingsSchema,
} from './schemas.js';

export class NodeRedClient {
  private readonly baseUrl: string;
  private readonly token?: string;
  private readonly basicAuth?: string;

  constructor(config: Config) {
    const url = new URL(config.nodeRedUrl);

    // Extract basic auth from URL if present
    if (url.username || url.password) {
      this.basicAuth = Buffer.from(`${url.username}:${url.password}`).toString('base64');
      url.username = '';
      url.password = '';
    }

    this.baseUrl = url.toString().replace(/\/$/, '');
    this.token = config.nodeRedToken;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Node-RED-API-Version': 'v2',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    } else if (this.basicAuth) {
      headers.Authorization = `Basic ${this.basicAuth}`;
    }

    return headers;
  }

  async getFlows(): Promise<NodeRedFlowsResponse> {
    const response = await request(`${this.baseUrl}/flows`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (response.statusCode !== 200) {
      const body = await response.body.text();
      throw new Error(`Failed to get flows: ${response.statusCode}\n${body}`);
    }

    const data = await response.body.json();
    return NodeRedFlowsResponseSchema.parse(data);
  }

  async createFlow(flowData: UpdateFlowRequest): Promise<{ id: string }> {
    const response = await request(`${this.baseUrl}/flow`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(flowData),
    });

    if (response.statusCode !== 200 && response.statusCode !== 204) {
      const body = await response.body.text();
      throw new Error(`Failed to create flow: ${response.statusCode}\n${body}`);
    }

    const data = await response.body.json();
    return data as { id: string };
  }

  async updateFlow(flowId: string, flowData: UpdateFlowRequest): Promise<{ id: string }> {
    const response = await request(`${this.baseUrl}/flow/${flowId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(flowData),
    });

    if (response.statusCode !== 200 && response.statusCode !== 204) {
      const body = await response.body.text();
      throw new Error(`Failed to update flow: ${response.statusCode}\n${body}`);
    }

    if (response.statusCode === 204) {
      return { id: flowId };
    }
    const data = await response.body.json();
    return data as { id: string };
  }

  async deleteFlow(flowId: string): Promise<void> {
    const response = await request(`${this.baseUrl}/flow/${flowId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (response.statusCode !== 204) {
      const body = await response.body.text();
      throw new Error(`Failed to delete flow: ${response.statusCode}\n${body}`);
    }
  }

  async getFlowState(): Promise<FlowState> {
    const response = await request(`${this.baseUrl}/flows/state`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (response.statusCode !== 200) {
      const body = await response.body.text();
      throw new Error(`Failed to get flow state: ${response.statusCode}\n${body}`);
    }

    const data = await response.body.json();
    return FlowStateSchema.parse(data);
  }

  async setFlowState(state: 'start' | 'stop'): Promise<FlowState> {
    const response = await request(`${this.baseUrl}/flows/state`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ state }),
    });

    if (response.statusCode !== 200) {
      const body = await response.body.text();
      throw new Error(`Failed to set flow state: ${response.statusCode}\n${body}`);
    }

    const data = await response.body.json();
    return FlowStateSchema.parse(data);
  }

  async getSettings(): Promise<NodeRedSettings> {
    const response = await request(`${this.baseUrl}/settings`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (response.statusCode !== 200) {
      const body = await response.body.text();
      throw new Error(`Failed to get settings: ${response.statusCode}\n${body}`);
    }

    const data = await response.body.json();
    return NodeRedSettingsSchema.parse(data);
  }

  async getDiagnostics(): Promise<NodeRedDiagnostics> {
    const response = await request(`${this.baseUrl}/diagnostics`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (response.statusCode !== 200) {
      const body = await response.body.text();
      throw new Error(`Failed to get diagnostics: ${response.statusCode}\n${body}`);
    }

    const data = await response.body.json();
    return NodeRedDiagnosticsSchema.parse(data);
  }

  async getContext(
    scope: 'global' | 'flow' | 'node',
    id?: string,
    key?: string,
    store?: string
  ): Promise<unknown> {
    let url = `${this.baseUrl}/context/${scope}`;
    if (scope !== 'global' && id) {
      url += `/${id}`;
    }
    if (key) {
      url += `/${key}`;
    }
    if (store) {
      url += `?store=${encodeURIComponent(store)}`;
    }

    const response = await request(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (response.statusCode !== 200) {
      const body = await response.body.text();
      throw new Error(`Failed to get context: ${response.statusCode}\n${body}`);
    }

    return await response.body.json();
  }

  async deleteContext(
    scope: 'global' | 'flow' | 'node',
    id?: string,
    key?: string,
    store?: string
  ): Promise<void> {
    let url = `${this.baseUrl}/context/${scope}`;
    if (scope === 'global') {
      url += `/${key}`;
    } else {
      url += `/${id}/${key}`;
    }
    if (store) {
      url += `?store=${encodeURIComponent(store)}`;
    }

    const response = await request(url, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (response.statusCode !== 204) {
      const body = await response.body.text();
      throw new Error(`Failed to delete context: ${response.statusCode}\n${body}`);
    }
  }

  async triggerInject(nodeId: string): Promise<void> {
    const response = await request(`${this.baseUrl}/inject/${nodeId}`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    if (response.statusCode !== 200) {
      const body = await response.body.text();
      throw new Error(`Failed to trigger inject node: ${response.statusCode}\n${body}`);
    }
  }

  async setDebugNodeState(nodeId: string, enabled: boolean): Promise<void> {
    const action = enabled ? 'enable' : 'disable';
    const response = await request(`${this.baseUrl}/debug/${nodeId}/${action}`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    // enable returns 200, disable returns 201
    if (response.statusCode !== 200 && response.statusCode !== 201) {
      const body = await response.body.text();
      throw new Error(`Failed to ${action} debug node: ${response.statusCode}\n${body}`);
    }
  }

  async validateFlow(flowData: UpdateFlowRequest): Promise<{ valid: boolean; errors?: string[] }> {
    try {
      const errors: string[] = [];

      if (!flowData.id) {
        errors.push('Flow missing required id field');
      }

      if (flowData.nodes) {
        for (const node of flowData.nodes) {
          if (!node.id) {
            errors.push('Node missing required id field');
          }
          if (!node.type) {
            errors.push(`Node ${node.id} missing required type field`);
          }
        }
      }

      if (flowData.configs) {
        for (const config of flowData.configs) {
          if (!config.id) {
            errors.push('Config node missing required id field');
          }
          if (!config.type) {
            errors.push(`Config node ${config.id} missing required type field`);
          }
        }
      }

      return {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  async getNodes(): Promise<NodeModule[]> {
    const headers = this.getHeaders();
    headers.Accept = 'application/json';
    const response = await request(`${this.baseUrl}/nodes`, {
      method: 'GET',
      headers,
    });

    if (response.statusCode !== 200) {
      const body = await response.body.text();
      throw new Error(`Failed to get nodes: ${response.statusCode}\n${body}`);
    }

    const data = await response.body.json();
    return z.array(NodeModuleSchema).parse(data);
  }

  async installNode(module: string): Promise<NodeModule> {
    const response = await request(`${this.baseUrl}/nodes`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ module }),
    });

    if (response.statusCode !== 200) {
      const body = await response.body.text();
      throw new Error(`Failed to install node module: ${response.statusCode}\n${body}`);
    }

    const data = await response.body.json();
    return NodeModuleSchema.parse(data);
  }

  async setNodeModuleState(module: string, enabled: boolean): Promise<NodeModule> {
    const response = await request(`${this.baseUrl}/nodes/${module}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ enabled }),
    });

    if (response.statusCode !== 200) {
      const body = await response.body.text();
      throw new Error(`Failed to set node module state: ${response.statusCode}\n${body}`);
    }

    const data = await response.body.json();
    return NodeModuleSchema.parse(data);
  }

  async removeNodeModule(module: string): Promise<void> {
    const response = await request(`${this.baseUrl}/nodes/${module}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (response.statusCode !== 204) {
      const body = await response.body.text();
      throw new Error(`Failed to remove node module: ${response.statusCode}\n${body}`);
    }
  }
}
