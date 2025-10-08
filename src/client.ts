import { request } from 'undici';
import type { Config, NodeRedFlowsResponse, UpdateFlowRequest } from './schemas.js';
import { NodeRedFlowsResponseSchema } from './schemas.js';

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

    // POST /flow returns 200 or 204 with JSON body containing {id}
    const data = await response.body.json();
    return data as { id: string };
  }

  async updateFlow(flowId: string, flowData: UpdateFlowRequest): Promise<{ id: string }> {
    const response = await request(`${this.baseUrl}/flow/${flowId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(flowData),
    });

    if (response.statusCode !== 204) {
      const body = await response.body.text();
      throw new Error(`Failed to update flow: ${response.statusCode}\n${body}`);
    }

    // PUT /flow/:id returns 204 with JSON body containing {id}
    const data = await response.body.json();
    return data as { id: string };
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
}
