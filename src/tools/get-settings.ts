import type { NodeRedClient } from '../client.js';

export async function getSettings(client: NodeRedClient) {
  const result = await client.getSettings();
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
