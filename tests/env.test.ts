import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dotenv
vi.mock('dotenv', () => ({
  config: vi.fn(),
}));

import { config } from 'dotenv';
import { loadEnv } from '../src/env.js';

const mockConfig = vi.mocked(config);

describe('loadEnv', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('loads .env then .env.local', () => {
    mockConfig.mockReturnValue({ parsed: {} });
    loadEnv();

    expect(mockConfig).toHaveBeenCalledTimes(2);
    // First call: .env
    expect(mockConfig.mock.calls[0][0]).toMatchObject({
      path: expect.stringContaining('.env'),
    });
    // Second call: .env.local with override
    expect(mockConfig.mock.calls[1][0]).toMatchObject({
      path: expect.stringContaining('.env.local'),
      override: true,
    });
  });

  it('.env.local overrides .env values', () => {
    mockConfig
      .mockImplementationOnce(() => {
        process.env.NODE_RED_URL = 'http://from-env:1880';
        return { parsed: { NODE_RED_URL: 'http://from-env:1880' } };
      })
      .mockImplementationOnce(() => {
        process.env.NODE_RED_URL = 'http://from-env-local:1880';
        return { parsed: { NODE_RED_URL: 'http://from-env-local:1880' } };
      });

    loadEnv();

    expect(process.env.NODE_RED_URL).toBe('http://from-env-local:1880');
  });

  it('real env vars take precedence over dotenv files', () => {
    process.env.NODE_RED_URL = 'http://real-env:1880';

    mockConfig
      .mockImplementationOnce(() => {
        // dotenv with override:false wouldn't touch this, but let's simulate
        return { parsed: { NODE_RED_URL: 'http://from-env:1880' } };
      })
      .mockImplementationOnce(() => {
        process.env.NODE_RED_URL = 'http://from-env-local:1880';
        return { parsed: { NODE_RED_URL: 'http://from-env-local:1880' } };
      });

    loadEnv();

    expect(process.env.NODE_RED_URL).toBe('http://real-env:1880');
  });

  it('works when dotenv config returns no parsed values', () => {
    mockConfig.mockReturnValue({ parsed: undefined });

    expect(() => loadEnv()).not.toThrow();
    expect(mockConfig).toHaveBeenCalledTimes(2);
  });
});
