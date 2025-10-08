import { z } from 'zod';
import type { NodeRedClient } from '../client.js';
import { UpdateFlowRequestSchema } from '../schemas.js';

const ValidateFlowArgsSchema = z.object({
  flow: z.string(),
});

export async function validateFlow(client: NodeRedClient, args: unknown) {
  const parsed = ValidateFlowArgsSchema.parse(args);

  let flowData: unknown;
  try {
    flowData = JSON.parse(parsed.flow);
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            {
              valid: false,
              errors: [`Invalid JSON: ${error instanceof Error ? error.message : String(error)}`],
            },
            null,
            2
          ),
        },
      ],
    };
  }

  const validated = UpdateFlowRequestSchema.parse(flowData);
  const result = await client.validateFlow(validated);

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
