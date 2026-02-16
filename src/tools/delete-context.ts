import { z } from 'zod';
import type { NodeRedClient } from '../client.js';

const DeleteContextArgsSchema = z.object({
  scope: z.enum(['global', 'flow', 'node']),
  id: z.string().optional(),
  key: z.string(),
  store: z.string().optional(),
});

export async function deleteContext(client: NodeRedClient, args: unknown) {
  const parsed = DeleteContextArgsSchema.parse(args);

  if ((parsed.scope === 'flow' || parsed.scope === 'node') && !parsed.id) {
    throw new Error(`id is required when scope is "${parsed.scope}"`);
  }

  await client.deleteContext(parsed.scope, parsed.id, parsed.key, parsed.store);

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(
          {
            success: true,
            message: `Deleted context key "${parsed.key}" from ${parsed.scope} scope`,
          },
          null,
          2
        ),
      },
    ],
  };
}
