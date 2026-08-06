import { describe, it, expect } from 'vitest';
import {
  operationsForType,
  parseTechnicalData,
  applyUpdate,
  describeUpdate,
  invalidUpdateComponents,
  type TechnicalUpdate,
} from './technical';

describe('operationsForType', () => {
  it('returns arithmetic ops for number', () => {
    expect(operationsForType('number')).toEqual(['set', 'add', 'subtract', 'multiply']);
  });
  it('returns set/toggle for boolean', () => {
    expect(operationsForType('boolean')).toEqual(['set', 'toggle']);
  });
  it('returns set/append for list and string', () => {
    expect(operationsForType('list')).toEqual(['set', 'append']);
    expect(operationsForType('string')).toEqual(['set', 'append']);
  });
});

describe('parseTechnicalData', () => {
  it('returns empty updates for null or malformed data', () => {
    expect(parseTechnicalData(null)).toEqual({ updates: [] });
    expect(parseTechnicalData({ notUpdates: [] })).toEqual({ updates: [] });
    expect(parseTechnicalData('garbage')).toEqual({ updates: [] });
  });

  it('passes through well-formed data', () => {
    const data = { updates: [{ id: 'u1', component: 'gold', operation: 'add', value: 10 }] };
    expect(parseTechnicalData(data)).toEqual(data);
  });

  it('filters out malformed update entries', () => {
    const data = {
      updates: [{ id: 'u1', component: 'gold', operation: 'add', value: 10 }, { garbage: true }],
    };
    expect(parseTechnicalData(data).updates).toHaveLength(1);
  });
});

describe('applyUpdate', () => {
  it('set replaces the value outright', () => {
    const update: TechnicalUpdate = { id: '1', component: 'hp', operation: 'set', value: 100 };
    expect(applyUpdate(50, update)).toBe(100);
  });

  it('toggle inverts a boolean', () => {
    const update: TechnicalUpdate = { id: '1', component: 'hasKey', operation: 'toggle', value: false };
    expect(applyUpdate(false, update)).toBe(true);
    expect(applyUpdate(true, update)).toBe(false);
  });

  it('add/subtract/multiply operate numerically', () => {
    expect(applyUpdate(10, { id: '1', component: 'gold', operation: 'add', value: 5 })).toBe(15);
    expect(applyUpdate(10, { id: '1', component: 'gold', operation: 'subtract', value: 5 })).toBe(5);
    expect(applyUpdate(10, { id: '1', component: 'gold', operation: 'multiply', value: 2 })).toBe(20);
  });

  it('returns undefined for arithmetic on non-numeric values', () => {
    expect(
      applyUpdate('not-a-number', { id: '1', component: 'gold', operation: 'add', value: 5 })
    ).toBeUndefined();
  });

  it('append pushes onto a list', () => {
    const update: TechnicalUpdate = {
      id: '1',
      component: 'inventory',
      operation: 'append',
      value: 'sword',
    };
    expect(applyUpdate(['shield'], update)).toEqual(['shield', 'sword']);
  });

  it('append concatenates onto a string', () => {
    const update: TechnicalUpdate = { id: '1', component: 'log', operation: 'append', value: '!' };
    expect(applyUpdate('Hello', update)).toBe('Hello!');
  });

  it('returns undefined for append on an unsupported type', () => {
    expect(
      applyUpdate(42, { id: '1', component: 'gold', operation: 'append', value: 'x' })
    ).toBeUndefined();
  });
});

describe('describeUpdate', () => {
  it('describes each operation clearly', () => {
    expect(describeUpdate({ id: '1', component: 'hp', operation: 'set', value: 100 })).toBe(
      'Set hp to 100'
    );
    expect(describeUpdate({ id: '1', component: 'hasKey', operation: 'toggle', value: false })).toBe(
      'Toggle hasKey'
    );
    expect(describeUpdate({ id: '1', component: 'gold', operation: 'add', value: 10 })).toBe(
      'gold + 10'
    );
    expect(describeUpdate({ id: '1', component: 'gold', operation: 'subtract', value: 10 })).toBe(
      'gold - 10'
    );
    expect(describeUpdate({ id: '1', component: 'gold', operation: 'multiply', value: 2 })).toBe(
      'gold × 2'
    );
    expect(
      describeUpdate({ id: '1', component: 'inventory', operation: 'append', value: 'sword' })
    ).toBe('Append sword to inventory');
  });
});

describe('invalidUpdateComponents', () => {
  it('flags updates referencing components that no longer exist', () => {
    const updates: TechnicalUpdate[] = [
      { id: '1', component: 'gold', operation: 'add', value: 10 },
      { id: '2', component: 'ghost', operation: 'set', value: 1 },
    ];
    const hasComponent = (name: string) => name === 'gold';
    expect(invalidUpdateComponents(updates, hasComponent)).toEqual(['ghost']);
  });
});
