import { describe, it, expect } from 'vitest';
import {
  makeComponentLookup,
  evaluateRule,
  evaluateBranch,
  getActiveBranchId,
  invalidComponentNames,
  describeBranch,
  operatorsForType,
  parseConditionData,
  type ConditionalBranch,
} from './conditions';

const lookup = makeComponentLookup([
  { name: 'hasKey', current_value: true },
  { name: 'gold', current_value: 15 },
  { name: 'playerName', current_value: 'Hero' },
  { name: 'weather', current_value: ['sunny', 'rainy'] },
]);

describe('evaluateRule', () => {
  it('evaluates boolean equality', () => {
    expect(evaluateRule({ id: '1', component: 'hasKey', operator: '==', value: true }, lookup)).toBe(
      true
    );
    expect(evaluateRule({ id: '1', component: 'hasKey', operator: '==', value: false }, lookup)).toBe(
      false
    );
  });

  it('evaluates numeric comparisons', () => {
    expect(evaluateRule({ id: '1', component: 'gold', operator: '>', value: 10 }, lookup)).toBe(true);
    expect(evaluateRule({ id: '1', component: 'gold', operator: '<', value: 10 }, lookup)).toBe(false);
    expect(evaluateRule({ id: '1', component: 'gold', operator: '>=', value: 15 }, lookup)).toBe(true);
  });

  it('evaluates string equality and includes', () => {
    expect(
      evaluateRule({ id: '1', component: 'playerName', operator: '==', value: 'Hero' }, lookup)
    ).toBe(true);
    expect(
      evaluateRule({ id: '1', component: 'playerName', operator: 'includes', value: 'ero' }, lookup)
    ).toBe(true);
  });

  it('evaluates list includes', () => {
    expect(
      evaluateRule({ id: '1', component: 'weather', operator: 'includes', value: 'rainy' }, lookup)
    ).toBe(true);
    expect(
      evaluateRule({ id: '1', component: 'weather', operator: 'includes', value: 'snowy' }, lookup)
    ).toBe(false);
  });

  it('is case-insensitive on component name', () => {
    expect(evaluateRule({ id: '1', component: 'HASKEY', operator: '==', value: true }, lookup)).toBe(
      true
    );
  });

  it('returns false for a component that no longer exists', () => {
    expect(evaluateRule({ id: '1', component: 'ghost', operator: '==', value: true }, lookup)).toBe(
      false
    );
  });
});

describe('evaluateBranch', () => {
  it('ANDs multiple rules', () => {
    const branch: ConditionalBranch = {
      id: 'b1',
      label: 'rich key holder',
      rules: [
        { id: '1', component: 'hasKey', operator: '==', value: true },
        { id: '2', component: 'gold', operator: '>=', value: 15 },
      ],
    };
    expect(evaluateBranch(branch, lookup)).toBe(true);
  });

  it('fails if any rule fails', () => {
    const branch: ConditionalBranch = {
      id: 'b1',
      label: 'poor key holder',
      rules: [
        { id: '1', component: 'hasKey', operator: '==', value: true },
        { id: '2', component: 'gold', operator: '>', value: 100 },
      ],
    };
    expect(evaluateBranch(branch, lookup)).toBe(false);
  });

  it('else branch always matches', () => {
    expect(evaluateBranch({ id: 'e', label: 'else', rules: [], isElse: true }, lookup)).toBe(true);
  });

  it('a branch with no rules and not else does not match', () => {
    expect(evaluateBranch({ id: 'b', label: 'empty', rules: [] }, lookup)).toBe(false);
  });
});

describe('getActiveBranchId', () => {
  it('returns the first matching branch in order', () => {
    const branches: ConditionalBranch[] = [
      { id: 'b1', label: 'no gold', rules: [{ id: '1', component: 'gold', operator: '>', value: 1000 }] },
      { id: 'b2', label: 'has key', rules: [{ id: '2', component: 'hasKey', operator: '==', value: true }] },
      { id: 'else', label: 'otherwise', rules: [], isElse: true },
    ];
    expect(getActiveBranchId(branches, lookup)).toBe('b2');
  });

  it('falls back to the else branch when nothing matches', () => {
    const branches: ConditionalBranch[] = [
      { id: 'b1', label: 'no gold', rules: [{ id: '1', component: 'gold', operator: '>', value: 1000 }] },
      { id: 'else', label: 'otherwise', rules: [], isElse: true },
    ];
    expect(getActiveBranchId(branches, lookup)).toBe('else');
  });

  it('returns null when nothing matches and there is no else', () => {
    const branches: ConditionalBranch[] = [
      { id: 'b1', label: 'no gold', rules: [{ id: '1', component: 'gold', operator: '>', value: 1000 }] },
    ];
    expect(getActiveBranchId(branches, lookup)).toBeNull();
  });
});

describe('invalidComponentNames', () => {
  it('flags rules referencing components that no longer exist', () => {
    const branch: ConditionalBranch = {
      id: 'b1',
      label: 'test',
      rules: [
        { id: '1', component: 'hasKey', operator: '==', value: true },
        { id: '2', component: 'ghostComponent', operator: '==', value: true },
      ],
    };
    expect(invalidComponentNames(branch, lookup)).toEqual(['ghostComponent']);
  });
});

describe('describeBranch', () => {
  it('joins rules with AND', () => {
    const branch: ConditionalBranch = {
      id: 'b1',
      label: 'test',
      rules: [
        { id: '1', component: 'hasKey', operator: '==', value: true },
        { id: '2', component: 'gold', operator: '>', value: 10 },
      ],
    };
    expect(describeBranch(branch)).toBe('hasKey == true AND gold > 10');
  });

  it('describes the else branch', () => {
    expect(describeBranch({ id: 'e', label: 'x', rules: [], isElse: true })).toBe('Otherwise');
  });
});

describe('operatorsForType', () => {
  it('returns comparison operators for number', () => {
    expect(operatorsForType('number')).toContain('>=');
  });
  it('returns equality operators for boolean', () => {
    expect(operatorsForType('boolean')).toEqual(['==', '!=']);
  });
});

describe('parseConditionData', () => {
  it('returns empty branches for null', () => {
    expect(parseConditionData(null)).toEqual({ branches: [] });
  });

  it('returns empty branches for malformed data', () => {
    expect(parseConditionData({ notBranches: [] })).toEqual({ branches: [] });
    expect(parseConditionData('garbage')).toEqual({ branches: [] });
  });

  it('passes through well-formed data', () => {
    const data = {
      branches: [{ id: 'b1', label: 'x', rules: [] }],
    };
    expect(parseConditionData(data)).toEqual(data);
  });

  it('filters out malformed branch entries', () => {
    const data = {
      branches: [{ id: 'b1', label: 'x', rules: [] }, { garbage: true }],
    };
    expect(parseConditionData(data).branches).toHaveLength(1);
  });
});
