import { z } from 'zod';

// =============================================================================
// NOTE VALIDATION SCHEMAS
// =============================================================================

export const noteTypeSchema = z.enum(['normal', 'conditional', 'technical']);

export const noteContentBlockSchema = z.object({
  type: z.string(),
  content: z.unknown(),
});

export const noteContentSchema = z.object({
  blocks: z.array(noteContentBlockSchema),
});

export const createNoteSchema = z.object({
  board_id: z.string().uuid('Invalid board ID'),
  type: noteTypeSchema.default('normal'),
  title: z.string().max(255).nullable().optional(),
  content: noteContentSchema.default({ blocks: [] }),
  position_x: z.number().default(0),
  position_y: z.number().default(0),
  width: z.number().min(100).max(1000).default(200),
  height: z.number().min(50).max(1000).default(150),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format')
    .default('#FFFFFF'),
  container_id: z.string().uuid().nullable().optional(),
});

export const updateNoteSchema = z.object({
  type: noteTypeSchema.optional(),
  title: z.string().max(255).nullable().optional(),
  content: noteContentSchema.optional(),
  position_x: z.number().optional(),
  position_y: z.number().optional(),
  width: z.number().min(100).max(1000).optional(),
  height: z.number().min(50).max(1000).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format')
    .optional(),
  is_collapsed: z.boolean().optional(),
  is_locked: z.boolean().optional(),
  z_index: z.number().int().optional(),
  container_id: z.string().uuid().nullable().optional(),
  condition_data: z.record(z.string(), z.unknown()).nullable().optional(),
  technical_data: z.record(z.string(), z.unknown()).nullable().optional(),
  tags: z.array(z.string()).optional(),
});

// Batch update for multiple notes (drag operations)
export const batchUpdateNotesSchema = z.object({
  updates: z.array(
    z.object({
      id: z.string().uuid(),
      position_x: z.number().optional(),
      position_y: z.number().optional(),
      width: z.number().min(100).max(1000).optional(),
      height: z.number().min(50).max(1000).optional(),
      z_index: z.number().int().optional(),
    })
  ),
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type BatchUpdateNotesInput = z.infer<typeof batchUpdateNotesSchema>;
