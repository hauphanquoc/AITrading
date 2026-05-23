import { z } from 'zod';

export const updateAIConfigSchema = z.object({
  systemInstruction: z.object({
    role: z.string().min(1, 'Role is required'),
    content: z.string().min(1, 'Content is required'),
  }),
  promptTemplate: z.string().min(1, 'Prompt template is required'),
  responseFormat: z.object({
    type: z.string().default('json'),
    schema: z.record(z.any()).optional(),
  }),
  isActive: z.boolean().optional(),
});

export const createAIConfigSchema = updateAIConfigSchema;

export type UpdateAIConfigInput = z.infer<typeof updateAIConfigSchema>;
export type CreateAIConfigInput = z.infer<typeof createAIConfigSchema>;
