import { z } from 'zod';

// =============================================================================
// CONNECTION VALIDATION SCHEMAS
// =============================================================================

export const anchorPositionSchema = z.enum(['top', 'bottom', 'left', 'right']);
export const lineStyleSchema = z.enum(['solid', 'dashed', 'dotted']);
export const arrowTypeSchema = z.enum(['none', 'single', 'double']);
export const curvatureTypeSchema = z.enum(['straight', 'curved', 'orthogonal']);

export const createConnectionSchema = z.object({
  board_id: z.string().uuid('Invalid board ID'),
  source_note_id: z.string().uuid('Invalid source note ID'),
  target_note_id: z.string().uuid('Invalid target note ID'),
  source_anchor: anchorPositionSchema.default('bottom'),
  target_anchor: anchorPositionSchema.default('top'),
  label: z.string().max(255).nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format')
    .default('#000000'),
  style: lineStyleSchema.default('solid'),
  thickness: z.number().int().min(1).max(5).default(2),
  arrow_type: arrowTypeSchema.default('single'),
  curvature: curvatureTypeSchema.default('curved'),
  branch_label: z.string().max(50).nullable().optional(),
  branch_order: z.number().int().nullable().optional(),
});

export const updateConnectionSchema = z.object({
  source_anchor: anchorPositionSchema.optional(),
  target_anchor: anchorPositionSchema.optional(),
  label: z.string().max(255).nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format')
    .optional(),
  style: lineStyleSchema.optional(),
  thickness: z.number().int().min(1).max(5).optional(),
  arrow_type: arrowTypeSchema.optional(),
  curvature: curvatureTypeSchema.optional(),
  branch_label: z.string().max(50).nullable().optional(),
  branch_order: z.number().int().nullable().optional(),
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type CreateConnectionInput = z.infer<typeof createConnectionSchema>;
export type UpdateConnectionInput = z.infer<typeof updateConnectionSchema>;
