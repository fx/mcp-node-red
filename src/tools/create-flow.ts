import { z } from 'zod';
import type { NodeRedClient } from '../client.js';
import { UpdateFlowRequestSchema } from '../schemas.js';

const CreateFlowArgsSchema = z.object({
  flow: z.string(),
});

export async function createFlow(client: NodeRedClient, args: unknown) {
  const parsed = CreateFlowArgsSchema.parse(args);

  let flowData: unknown;
  try {
    flowData = JSON.parse(parsed.flow);
  } catch (error) {
    throw new Error(
      `Invalid JSON in flow parameter: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  const validated = UpdateFlowRequestSchema.parse(flowData);

  const result = await client.createFlow(validated);

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
