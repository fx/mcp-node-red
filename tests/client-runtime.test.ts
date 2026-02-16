import { request } from 'undici';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NodeRedClient } from '../src/client.js';
import type { Config } from '../src/schemas.js';

vi.mock('undici');

describe('NodeRedClient - Runtime Info', () => {
  let client: NodeRedClient;
  const mockConfig: Config = {
    nodeRedUrl: 'http://localhost:1880',
    nodeRedToken: 'test-token',
  };

  beforeEach(() => {
    client = new NodeRedClient(mockConfig);
    vi.clearAllMocks();
  });

  describe('getSettings', () => {
    it('should fetch settings successfully', async () => {
      const mockSettings = {
        httpNodeRoot: '/',
        version: '3.1.0',
        user: { username: 'admin', permissions: '*' },
        editorTheme: { projects: { enabled: true } },
      };

      vi.mocked(request).mockResolvedValue({
        statusCode: 200,
        body: { json: vi.fn().mockResolvedValue(mockSettings), text: vi.fn() },
      } as any);

      const result = await client.getSettings();
      expect(result).toEqual(mockSettings);
      expect(request).toHaveBeenCalledWith('http://localhost:1880/settings', {
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
        body: { text: vi.fn().mockResolvedValue('Internal Server Error') },
      } as any);
      await expect(client.getSettings()).rejects.toThrow('Failed to get settings: 500');
    });

    it('should handle settings without optional fields', async () => {
      vi.mocked(request).mockResolvedValue({
        statusCode: 200,
        body: { json: vi.fn().mockResolvedValue({}), text: vi.fn() },
      } as any);
      const result = await client.getSettings();
      expect(result).toEqual({});
    });
  });

  describe('getDiagnostics', () => {
    it('should fetch diagnostics successfully', async () => {
      const mockDiagnostics = {
        report: 'diagnostics',
        scope: 'admin',
        nodejs: { version: 'v20.10.0' },
        os: { type: 'Linux', release: '6.1.0' },
        runtime: { version: '3.1.0' },
        modules: {},
        settings: {},
      };

      vi.mocked(request).mockResolvedValue({
        statusCode: 200,
        body: { json: vi.fn().mockResolvedValue(mockDiagnostics), text: vi.fn() },
      } as any);

      const result = await client.getDiagnostics();
      expect(result).toEqual(mockDiagnostics);
      expect(request).toHaveBeenCalledWith('http://localhost:1880/diagnostics', {
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
        statusCode: 403,
        body: { text: vi.fn().mockResolvedValue('Forbidden') },
      } as any);
      await expect(client.getDiagnostics()).rejects.toThrow('Failed to get diagnostics: 403');
    });

    it('should handle diagnostics with extra fields', async () => {
      const diagnosticsWithExtras = { report: 'diagnostics', customField: 'extra data' };
      vi.mocked(request).mockResolvedValue({
        statusCode: 200,
        body: { json: vi.fn().mockResolvedValue(diagnosticsWithExtras), text: vi.fn() },
      } as any);
      const result = await client.getDiagnostics();
      expect(result).toEqual(diagnosticsWithExtras);
    });
  });
});
