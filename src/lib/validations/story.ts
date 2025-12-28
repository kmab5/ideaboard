import { z } from 'zod';

// =============================================================================
// STORY VALIDATION SCHEMAS
// =============================================================================

export const storyTitleSchema = z
  .string()
  .min(1, 'Title is required')
  .max(255, 'Title must be less than 255 characters');

export const storyDescriptionSchema = z
  .string()
  .max(1000, 'Description must be less than 1000 characters')
  .nullable()
  .optional();

export const createStorySchema = z.object({
  title: storyTitleSchema,
  description: storyDescriptionSchema,
});

export const updateStorySchema = z.object({
  title: storyTitleSchema.optional(),
  description: storyDescriptionSchema,
  is_archived: z.boolean().optional(),
  is_favorite: z.boolean().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

// =============================================================================
// BOARD FOLDER VALIDATION SCHEMAS
// =============================================================================

export const boardFolderSchema = z.object({
  name: z
    .string()
    .min(1, 'Folder name is required')
    .max(100, 'Folder name must be less than 100 characters'),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format')
    .nullable()
    .optional(),
  sort_order: z.number().int().min(0).optional(),
});

// =============================================================================
// BOARD VALIDATION SCHEMAS
// =============================================================================

export const boardTitleSchema = z
  .string()
  .min(1, 'Board title is required')
  .max(255, 'Board title must be less than 255 characters');

export const createBoardSchema = z.object({
  story_id: z.string().uuid('Invalid story ID'),
  title: boardTitleSchema,
  description: z.string().max(1000).nullable().optional(),
  folder_id: z.string().uuid().nullable().optional(),
  sort_order: z.number().int().min(0).optional(),
});

export const updateBoardSchema = z.object({
  title: boardTitleSchema.optional(),
  description: z.string().max(1000).nullable().optional(),
  folder_id: z.string().uuid().nullable().optional(),
  sort_order: z.number().int().min(0).optional(),
  viewport_x: z.number().optional(),
  viewport_y: z.number().optional(),
  viewport_zoom: z.number().min(0.1).max(4).optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type CreateStoryInput = z.infer<typeof createStorySchema>;
export type UpdateStoryInput = z.infer<typeof updateStorySchema>;
export type BoardFolderInput = z.infer<typeof boardFolderSchema>;
export type CreateBoardInput = z.infer<typeof createBoardSchema>;
export type UpdateBoardInput = z.infer<typeof updateBoardSchema>;
