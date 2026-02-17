import { z } from 'zod';

export const NodeRedNodeSchema = z
  .object({
    id: z.string(),
    type: z.string(),
    z: z.string().optional(),
    name: z.string().optional(),
    wires: z.array(z.array(z.string())).optional(),
  })
  .passthrough();

export const NodeRedFlowSchema = z
  .object({
    id: z.string(),
    type: z.literal('tab'),
    label: z.string(),
    disabled: z.boolean().optional(),
    info: z.string().optional(),
    env: z.array(z.unknown()).optional(),
  })
  .passthrough();

export const NodeRedConfigSchema = z
  .object({
    id: z.string(),
    type: z.string(),
  })
  .passthrough();

export const NodeRedItemSchema = z.union([NodeRedFlowSchema, NodeRedNodeSchema]);

export const NodeRedFlowsResponseSchema = z.object({
  rev: z.string(),
  flows: z.array(NodeRedItemSchema),
});

export const UpdateFlowRequestSchema = z.object({
  id: z.string(),
  label: z.string().optional(),
  disabled: z.boolean().optional(),
  info: z.string().optional(),
  nodes: z.array(NodeRedNodeSchema).optional(),
  configs: z.array(NodeRedConfigSchema).optional(),
});

export const FlowStateSchema = z.object({
  state: z.enum(['start', 'stop']),
});

export const NodeSetSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    types: z.array(z.string()),
    enabled: z.boolean(),
    local: z.boolean().optional(),
    user: z.boolean().optional(),
    module: z.string(),
    version: z.string().optional(),
  })
  .passthrough();

export const NodeModuleSchema = z
  .object({
    name: z.string(),
    version: z.string(),
    local: z.boolean().optional(),
    user: z.boolean().optional(),
    nodes: z.union([z.record(z.string(), NodeSetSchema), z.array(NodeSetSchema)]).optional(),
  })
  .passthrough();

export const NodeRedSettingsSchema = z
  .object({
    httpNodeRoot: z.string().optional(),
    version: z.string().optional(),
    user: z
      .object({
        username: z.string(),
        permissions: z.string(),
      })
      .optional(),
  })
  .passthrough();

export const NodeRedDiagnosticsSchema = z
  .object({
    report: z.string().optional(),
    scope: z.string().optional(),
    nodejs: z.unknown().optional(),
    os: z.unknown().optional(),
    runtime: z.unknown().optional(),
    modules: z.unknown().optional(),
    settings: z.unknown().optional(),
  })
  .passthrough();

export const ConfigSchema = z.object({
  nodeRedUrl: z.string().url(),
  nodeRedToken: z.string().optional(),
});

export type NodeRedNode = z.infer<typeof NodeRedNodeSchema>;
export type NodeRedFlow = z.infer<typeof NodeRedFlowSchema>;
export type NodeRedConfig = z.infer<typeof NodeRedConfigSchema>;
export type NodeRedItem = z.infer<typeof NodeRedItemSchema>;
export type NodeRedFlowsResponse = z.infer<typeof NodeRedFlowsResponseSchema>;
export type UpdateFlowRequest = z.infer<typeof UpdateFlowRequestSchema>;
export type FlowState = z.infer<typeof FlowStateSchema>;
export type NodeSet = z.infer<typeof NodeSetSchema>;
export type NodeModule = z.infer<typeof NodeModuleSchema>;
export type NodeRedSettings = z.infer<typeof NodeRedSettingsSchema>;
export type NodeRedDiagnostics = z.infer<typeof NodeRedDiagnosticsSchema>;
export type Config = z.infer<typeof ConfigSchema>;
