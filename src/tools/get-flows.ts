import type { NodeRedClient } from '../client.js';

export async function getFlows(client: NodeRedClient) {
  const result = await client.getFlows();
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
