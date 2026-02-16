import type { NodeRedClient } from '../client.js';

export async function getFlowState(client: NodeRedClient) {
  const result = await client.getFlowState();
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
