import { z } from 'zod';
import type { NodeRedClient } from '../client.js';

const DeleteFlowArgsSchema = z.object({
  flowId: z.string(),
});

export async function deleteFlow(client: NodeRedClient, args: unknown) {
  const parsed = DeleteFlowArgsSchema.parse(args);

  await client.deleteFlow(parsed.flowId);

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({ deleted: parsed.flowId }, null, 2),
      },
    ],
  };
}
