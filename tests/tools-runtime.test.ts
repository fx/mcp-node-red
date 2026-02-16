import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NodeRedClient } from '../src/client.js';
import { getDiagnostics } from '../src/tools/get-diagnostics.js';
import { getSettings } from '../src/tools/get-settings.js';

describe('Runtime Info Tool Handlers', () => {
  let mockClient: NodeRedClient;

  beforeEach(() => {
    mockClient = {
      getSettings: vi.fn(),
      getDiagnostics: vi.fn(),
    } as any;
  });

  describe('getSettings', () => {
    it('should return formatted settings', async () => {
      const mockSettingsData = {
        httpNodeRoot: '/',
        version: '3.1.0',
        user: { username: 'admin', permissions: '*' },
      };
      vi.mocked(mockClient.getSettings).mockResolvedValue(mockSettingsData);
      const result = await getSettings(mockClient);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(JSON.parse(result.content[0].text)).toEqual(mockSettingsData);
    });

    it('should handle empty settings', async () => {
      vi.mocked(mockClient.getSettings).mockResolvedValue({});
      const result = await getSettings(mockClient);
      expect(result.content).toHaveLength(1);
      expect(JSON.parse(result.content[0].text)).toEqual({});
    });
  });

  describe('getDiagnostics', () => {
    it('should return formatted diagnostics', async () => {
      const mockDiagnosticsData = {
        report: 'diagnostics',
        scope: 'admin',
        nodejs: { version: 'v20.10.0' },
        os: { type: 'Linux' },
      };
      vi.mocked(mockClient.getDiagnostics).mockResolvedValue(mockDiagnosticsData);
      const result = await getDiagnostics(mockClient);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(JSON.parse(result.content[0].text)).toEqual(mockDiagnosticsData);
    });

    it('should handle minimal diagnostics', async () => {
      vi.mocked(mockClient.getDiagnostics).mockResolvedValue({});
      const result = await getDiagnostics(mockClient);
      expect(result.content).toHaveLength(1);
      expect(JSON.parse(result.content[0].text)).toEqual({});
    });
  });
});
