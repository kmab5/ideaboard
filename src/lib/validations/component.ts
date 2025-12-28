import { z } from 'zod';

// =============================================================================
// COMPONENT VALIDATION SCHEMAS
// =============================================================================

export const componentTypeSchema = z.enum(['number', 'string', 'boolean', 'list']);

export const componentNameSchema = z
  .string()
  .min(1, 'Component name is required')
  .max(100, 'Component name must be less than 100 characters')
  .regex(
    /^[a-zA-Z_][a-zA-Z0-9_]*$/,
    'Component name must start with a letter or underscore and contain only letters, numbers, and underscores'
  );

// Value schema depends on type
const numberValueSchema = z.number();
const stringValueSchema = z.string();
const booleanValueSchema = z.boolean();
const listValueSchema = z.array(z.union([z.string(), z.number(), z.boolean()]));

export const componentValueSchema = z.union([
  numberValueSchema,
  stringValueSchema,
  booleanValueSchema,
  listValueSchema,
  z.null(),
]);

export const createComponentSchema = z.object({
  story_id: z.string().uuid('Invalid story ID'),
  name: componentNameSchema,
  type: componentTypeSchema,
  description: z.string().max(500).nullable().optional(),
  default_value: componentValueSchema.default(null),
  current_value: componentValueSchema.default(null),
  color_tag: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format')
    .nullable()
    .optional(),
  sort_order: z.number().int().min(0).optional(),
});

export const updateComponentSchema = z.object({
  name: componentNameSchema.optional(),
  type: componentTypeSchema.optional(),
  description: z.string().max(500).nullable().optional(),
  default_value: componentValueSchema.optional(),
  current_value: componentValueSchema.optional(),
  color_tag: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format')
    .nullable()
    .optional(),
  sort_order: z.number().int().min(0).optional(),
});

// Reset component to default value
export const resetComponentSchema = z.object({
  id: z.string().uuid('Invalid component ID'),
});

// Batch reset all components in a story
export const batchResetComponentsSchema = z.object({
  story_id: z.string().uuid('Invalid story ID'),
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type CreateComponentInput = z.infer<typeof createComponentSchema>;
export type UpdateComponentInput = z.infer<typeof updateComponentSchema>;
export type ResetComponentInput = z.infer<typeof resetComponentSchema>;
export type BatchResetComponentsInput = z.infer<typeof batchResetComponentsSchema>;
