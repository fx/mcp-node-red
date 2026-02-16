import { z } from 'zod';
import type { NodeRedClient } from '../client.js';

const SetFlowStateArgsSchema = z.object({
  state: z.enum(['start', 'stop']),
});

export async function setFlowState(client: NodeRedClient, args: unknown) {
  const parsed = SetFlowStateArgsSchema.parse(args);
  const result = await client.setFlowState(parsed.state);
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
