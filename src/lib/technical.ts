// =============================================================================
// Technical note updates
// =============================================================================
// A technical note holds a list of component modification instructions (PRD
// 4.2.1.4): the write-side counterpart to a conditional note's read-side
// branches. "Applying" a technical note simulates reaching it during a
// playthrough by writing the computed values to the components themselves —
// this is a planning/testing aid, not a runtime story engine.

export type TechnicalOperation = 'set' | 'add' | 'subtract' | 'multiply' | 'toggle' | 'append';

export type TechnicalValue = string | number | boolean;

export interface TechnicalUpdate {
  id: string;
  /** Component name (matches `Component.name`, case-insensitive). */
  component: string;
  operation: TechnicalOperation;
  /** Ignored for `toggle`. */
  value: TechnicalValue;
}

export interface TechnicalNoteData {
  updates: TechnicalUpdate[];
}

export type ComponentType = 'number' | 'string' | 'boolean' | 'list';

/** Operations valid for a given component type, used to build the update editor UI. */
export function operationsForType(type: ComponentType): TechnicalOperation[] {
  switch (type) {
    case 'number':
      return ['set', 'add', 'subtract', 'multiply'];
    case 'boolean':
      return ['set', 'toggle'];
    case 'list':
      return ['set', 'append'];
    case 'string':
    default:
      return ['set', 'append'];
  }
}

/**
 * Defensively parse a note's raw `technical_data` JSONB, tolerating
 * null/malformed data by falling back to no updates.
 */
export function parseTechnicalData(raw: unknown): TechnicalNoteData {
  if (!raw || typeof raw !== 'object' || !Array.isArray((raw as TechnicalNoteData).updates)) {
    return { updates: [] };
  }
  const data = raw as TechnicalNoteData;
  return {
    updates: data.updates.filter(
      (u): u is TechnicalUpdate =>
        typeof u === 'object' && u !== null && typeof u.id === 'string' && typeof u.component === 'string'
    ),
  };
}

/**
 * Compute the new value an update would produce, given the component's
 * current value. Returns `undefined` if the operation doesn't apply cleanly
 * (e.g. add on a non-numeric current value) so callers can skip it safely.
 */
export function applyUpdate(currentValue: unknown, update: TechnicalUpdate): unknown {
  switch (update.operation) {
    case 'set':
      return update.value;
    case 'toggle':
      return !currentValue;
    case 'add':
    case 'subtract':
    case 'multiply': {
      const current = Number(currentValue);
      const delta = Number(update.value);
      if (Number.isNaN(current) || Number.isNaN(delta)) return undefined;
      if (update.operation === 'add') return current + delta;
      if (update.operation === 'subtract') return current - delta;
      return current * delta;
    }
    case 'append': {
      if (Array.isArray(currentValue)) return [...currentValue, update.value];
      if (typeof currentValue === 'string') return currentValue + String(update.value);
      return undefined;
    }
    default:
      return undefined;
  }
}

/** Human-readable summary, e.g. "gold + 10" or "Toggle hasKey" or "Set name to Hero". */
export function describeUpdate(update: TechnicalUpdate): string {
  switch (update.operation) {
    case 'set':
      return `Set ${update.component} to ${String(update.value)}`;
    case 'toggle':
      return `Toggle ${update.component}`;
    case 'add':
      return `${update.component} + ${String(update.value)}`;
    case 'subtract':
      return `${update.component} - ${String(update.value)}`;
    case 'multiply':
      return `${update.component} × ${String(update.value)}`;
    case 'append':
      return `Append ${String(update.value)} to ${update.component}`;
    default:
      return update.component;
  }
}

/** Component names referenced by updates that no longer exist. */
export function invalidUpdateComponents(
  updates: TechnicalUpdate[],
  hasComponent: (name: string) => boolean
): string[] {
  return updates.filter((u) => !hasComponent(u.component)).map((u) => u.component);
}
