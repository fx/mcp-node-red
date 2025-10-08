import { z } from 'zod';
import type { NodeRedClient } from '../client.js';
import { UpdateFlowRequestSchema } from '../schemas.js';

const UpdateFlowArgsSchema = z.object({
  flowId: z.string(),
  updates: z.string(),
});

export async function updateFlow(client: NodeRedClient, args: unknown) {
  const parsed = UpdateFlowArgsSchema.parse(args);

  let flowData: unknown;
  try {
    flowData = JSON.parse(parsed.updates);
  } catch (error) {
    throw new Error(
      `Invalid JSON in updates parameter: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // Ensure id matches flowId parameter
  const updateData = {
    ...(typeof flowData === 'object' && flowData !== null ? flowData : {}),
    id: parsed.flowId,
  };

  const validated = UpdateFlowRequestSchema.parse(updateData);

  const result = await client.updateFlow(parsed.flowId, validated);

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
