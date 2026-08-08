import { z } from 'zod';

// Mirrors the database constraints on `containers` (see schema.sql):
// name is VARCHAR(100) and unique per story; color is a hex string.
export const containerNameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name must be 100 characters or fewer')
  .trim();

export const createContainerSchema = z.object({
  id: z.string().uuid().optional(),
  story_id: z.string().uuid(),
  board_id: z.string().uuid().nullable().optional(),
  name: containerNameSchema,
  description: z.string().max(2000).nullable().optional(),
  position_x: z.number(),
  position_y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a hex value like #7c3aed')
    .nullable()
    .optional(),
  background_opacity: z.number().min(0).max(1).optional(),
  is_collapsed: z.boolean().optional(),
  is_locked: z.boolean().optional(),
  z_index: z.number().int().optional(),
});

export const updateContainerSchema = createContainerSchema.partial().omit({ story_id: true });

export type CreateContainerInput = z.infer<typeof createContainerSchema>;
export type UpdateContainerInput = z.infer<typeof updateContainerSchema>;
