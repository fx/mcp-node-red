import { z } from 'zod';
import type { NodeRedClient } from '../client.js';

const RemoveNodeModuleArgsSchema = z.object({
  module: z.string(),
});

export async function removeNodeModule(client: NodeRedClient, args: unknown) {
  const parsed = RemoveNodeModuleArgsSchema.parse(args);
  await client.removeNodeModule(parsed.module);
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({ success: true, module: parsed.module }, null, 2),
      },
    ],
  };
}
