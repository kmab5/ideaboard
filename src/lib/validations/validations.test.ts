import { describe, it, expect } from 'vitest';
import { noteTypeSchema, createNoteSchema } from './note';
import { createConnectionSchema } from './connection';
import { registerSchema, passwordSchema } from './auth';

describe('noteTypeSchema', () => {
  it('accepts all four note types (including drawing)', () => {
    for (const t of ['normal', 'drawing', 'conditional', 'technical']) {
      expect(noteTypeSchema.safeParse(t).success).toBe(true);
    }
  });

  it('rejects unknown types', () => {
    expect(noteTypeSchema.safeParse('sticky').success).toBe(false);
  });
});

describe('createNoteSchema', () => {
  const base = { board_id: '11111111-1111-4111-8111-111111111111' };

  it('applies sensible defaults', () => {
    const parsed = createNoteSchema.parse(base);
    expect(parsed.type).toBe('normal');
    expect(parsed.color).toBe('#FFFFFF');
    expect(parsed.width).toBe(200);
  });

  it('rejects a bad board id', () => {
    expect(createNoteSchema.safeParse({ board_id: 'nope' }).success).toBe(false);
  });

  it('rejects malformed colors', () => {
    expect(createNoteSchema.safeParse({ ...base, color: 'red' }).success).toBe(false);
  });
});

describe('createConnectionSchema', () => {
  const ids = {
    board_id: '11111111-1111-4111-8111-111111111111',
    source_note_id: '22222222-2222-4222-8222-222222222222',
    target_note_id: '33333333-3333-4333-8333-333333333333',
  };

  it('applies defaults for style/arrow/curvature', () => {
    const parsed = createConnectionSchema.parse(ids);
    expect(parsed.style).toBe('solid');
    expect(parsed.arrow_type).toBe('single');
    expect(parsed.curvature).toBe('curved');
    expect(parsed.thickness).toBe(2);
  });

  it('enforces thickness bounds', () => {
    expect(createConnectionSchema.safeParse({ ...ids, thickness: 9 }).success).toBe(false);
  });
});

describe('passwordSchema', () => {
  it('requires upper, lower, and a digit', () => {
    expect(passwordSchema.safeParse('Password1').success).toBe(true);
    expect(passwordSchema.safeParse('password1').success).toBe(false);
    expect(passwordSchema.safeParse('PASSWORD1').success).toBe(false);
    expect(passwordSchema.safeParse('Password').success).toBe(false);
    expect(passwordSchema.safeParse('Pass1').success).toBe(false);
  });
});

describe('registerSchema', () => {
  it('requires matching passwords', () => {
    const result = registerSchema.safeParse({
      email: 'a@b.com',
      password: 'Password1',
      confirmPassword: 'Password2',
      displayName: 'Alex',
    });
    expect(result.success).toBe(false);
  });
});
