import { resolve } from 'node:path';
import { config } from 'dotenv';

export function loadEnv(): void {
  // Snapshot real env vars so they always take precedence
  const realEnv = { ...process.env };

  // Load .env (base defaults)
  config({ path: resolve(process.cwd(), '.env') });

  // Load .env.local (local overrides, takes precedence over .env)
  config({ path: resolve(process.cwd(), '.env.local'), override: true });

  // Restore real env vars (they always win)
  Object.assign(process.env, realEnv);
}
