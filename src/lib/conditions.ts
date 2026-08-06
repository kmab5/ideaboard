// =============================================================================
// Conditional note evaluation
// =============================================================================
// A conditional note routes to different outgoing branches depending on the
// current value of one or more components. Branches are evaluated in array
// order; the first branch whose rules all pass wins. A branch may instead be
// marked `isElse`, which always matches if reached — it should be last.
//
// This is a planning/visualization aid (PRD 4.2.1.3): it lets an author see,
// live, which path is "active" for the current component values, without
// building a runtime story engine.

export type ConditionOperator = '==' | '!=' | '>' | '>=' | '<' | '<=' | 'includes';

export type ConditionValue = string | number | boolean;

export interface ConditionRule {
  id: string;
  /** Component name (matches `Component.name`, case-insensitive). */
  component: string;
  operator: ConditionOperator;
  value: ConditionValue;
}

export interface ConditionalBranch {
  id: string;
  label: string;
  /** Rules are ANDed together. Empty when `isElse` is true. */
  rules: ConditionRule[];
  /** Fallback branch: matches whenever reached, regardless of rules. */
  isElse?: boolean;
}

export interface ConditionalNoteData {
  branches: ConditionalBranch[];
}

/** Minimal component shape evaluation needs (name -> current value). */
export interface ComponentValueLookup {
  getValue(name: string): unknown;
  /** Whether a component with this name currently exists (for validity checks). */
  has(name: string): boolean;
}

export function makeComponentLookup(
  components: { name: string; current_value: unknown }[]
): ComponentValueLookup {
  const map = new Map(components.map((c) => [c.name.toLowerCase(), c.current_value]));
  return {
    getValue: (name: string) => map.get(name.toLowerCase()),
    has: (name: string) => map.has(name.toLowerCase()),
  };
}

/**
 * Defensively parse a note's raw `condition_data` JSONB into a well-formed
 * ConditionalNoteData, tolerating null/malformed data (e.g. an older note
 * created before this shape existed) by falling back to no branches.
 */
export function parseConditionData(raw: unknown): ConditionalNoteData {
  if (!raw || typeof raw !== 'object' || !Array.isArray((raw as ConditionalNoteData).branches)) {
    return { branches: [] };
  }
  const data = raw as ConditionalNoteData;
  return {
    branches: data.branches.filter(
      (b): b is ConditionalBranch =>
        typeof b === 'object' && b !== null && typeof b.id === 'string' && Array.isArray(b.rules)
    ),
  };
}

/** Operators valid for a given component type, used to build the rule editor UI. */
export function operatorsForType(type: 'number' | 'string' | 'boolean' | 'list'): ConditionOperator[] {
  switch (type) {
    case 'number':
      return ['==', '!=', '>', '>=', '<', '<='];
    case 'boolean':
      return ['==', '!='];
    case 'list':
      return ['includes', '=='];
    case 'string':
    default:
      return ['==', '!=', 'includes'];
  }
}

function compare(actual: unknown, operator: ConditionOperator, expected: ConditionValue): boolean {
  switch (operator) {
    case '==':
      // Loose-ish equality: normalize types so "3" == 3 and "true" == true
      // both work, since values coming from inputs are often strings.
      return String(actual) === String(expected);
    case '!=':
      return String(actual) !== String(expected);
    case '>':
    case '>=':
    case '<':
    case '<=': {
      const a = Number(actual);
      const b = Number(expected);
      if (Number.isNaN(a) || Number.isNaN(b)) return false;
      if (operator === '>') return a > b;
      if (operator === '>=') return a >= b;
      if (operator === '<') return a < b;
      return a <= b;
    }
    case 'includes': {
      if (Array.isArray(actual)) {
        return actual.some((item) => String(item) === String(expected));
      }
      if (typeof actual === 'string') {
        return actual.toLowerCase().includes(String(expected).toLowerCase());
      }
      return false;
    }
    default:
      return false;
  }
}

/** Evaluate a single rule against the current component values. */
export function evaluateRule(rule: ConditionRule, lookup: ComponentValueLookup): boolean {
  if (!lookup.has(rule.component)) return false;
  return compare(lookup.getValue(rule.component), rule.operator, rule.value);
}

/** A branch matches when it's the else branch, or all of its rules pass. */
export function evaluateBranch(branch: ConditionalBranch, lookup: ComponentValueLookup): boolean {
  if (branch.isElse) return true;
  if (branch.rules.length === 0) return false;
  return branch.rules.every((rule) => evaluateRule(rule, lookup));
}

/**
 * Return the id of the first branch that matches, evaluated in array order.
 * Returns null if no branch matches (no rules pass and there is no else).
 */
export function getActiveBranchId(
  branches: ConditionalBranch[],
  lookup: ComponentValueLookup
): string | null {
  for (const branch of branches) {
    if (evaluateBranch(branch, lookup)) return branch.id;
  }
  return null;
}

/** Names of components referenced by a branch's rules that no longer exist. */
export function invalidComponentNames(
  branch: ConditionalBranch,
  lookup: ComponentValueLookup
): string[] {
  return branch.rules.filter((rule) => !lookup.has(rule.component)).map((rule) => rule.component);
}

/** Human-readable summary of a branch's rules, e.g. "hasKey == true AND gold > 10". */
export function describeBranch(branch: ConditionalBranch): string {
  if (branch.isElse) return 'Otherwise';
  if (branch.rules.length === 0) return 'No conditions set';
  return branch.rules
    .map((rule) => `${rule.component} ${rule.operator} ${String(rule.value)}`)
    .join(' AND ');
}
