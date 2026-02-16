import type { NodeRedClient } from '../client.js';

export async function getDiagnostics(client: NodeRedClient) {
  const result = await client.getDiagnostics();
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
