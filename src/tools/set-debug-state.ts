import { z } from 'zod';
import type { NodeRedClient } from '../client.js';

const SetDebugStateArgsSchema = z.object({
  nodeId: z.string(),
  enabled: z.boolean(),
});

export async function setDebugState(client: NodeRedClient, args: unknown) {
  const parsed = SetDebugStateArgsSchema.parse(args);

  await client.setDebugNodeState(parsed.nodeId, parsed.enabled);

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({ nodeId: parsed.nodeId, enabled: parsed.enabled }, null, 2),
      },
    ],
  };
}
