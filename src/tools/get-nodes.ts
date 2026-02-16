import type { NodeRedClient } from '../client.js';

export async function getNodes(client: NodeRedClient) {
  const result = await client.getNodes();
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
