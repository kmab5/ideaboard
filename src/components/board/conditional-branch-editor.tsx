'use client';

import { useEffect, useState } from 'react';
import { Plus, X, ChevronUp, ChevronDown, GitBranch } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { operatorsForType, type ConditionRule, type ConditionalBranch } from '@/lib/conditions';

export interface BranchEditorComponent {
  id: string;
  name: string;
  type: 'number' | 'string' | 'boolean' | 'list';
  current_value: unknown;
}

export interface BranchEditorNoteOption {
  id: string;
  title: string | null;
}

interface ConditionalBranchEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialBranches: ConditionalBranch[];
  /** branchId -> target note id, or null if this branch has no connection yet. */
  initialTargets: Record<string, string | null>;
  availableNotes: BranchEditorNoteOption[];
  components: BranchEditorComponent[];
  onSave: (branches: ConditionalBranch[], targets: Record<string, string | null>) => void;
}

function newRule(component: string): ConditionRule {
  return {
    id: crypto.randomUUID(),
    component,
    operator: operatorsForType('boolean')[0],
    value: '',
  };
}

function newBranch(label: string, firstComponent?: string): ConditionalBranch {
  return {
    id: crypto.randomUUID(),
    label,
    rules: firstComponent ? [newRule(firstComponent)] : [],
  };
}

export function ConditionalBranchEditor({
  open,
  onOpenChange,
  initialBranches,
  initialTargets,
  availableNotes,
  components,
  onSave,
}: ConditionalBranchEditorProps) {
  const [branches, setBranches] = useState<ConditionalBranch[]>(initialBranches);
  const [targets, setTargets] = useState<Record<string, string | null>>(initialTargets);

  // Re-sync when a different note's editor is opened.
  useEffect(() => {
    if (open) {
      setBranches(initialBranches.length ? initialBranches : []);
      setTargets(initialTargets);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const componentByName = (name: string) =>
    components.find((c) => c.name.toLowerCase() === name.toLowerCase());

  const hasElseBranch = branches.some((b) => b.isElse);

  const updateBranch = (id: string, updates: Partial<ConditionalBranch>) => {
    setBranches((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  };

  const removeBranch = (id: string) => {
    setBranches((prev) => prev.filter((b) => b.id !== id));
    setTargets((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const moveBranch = (index: number, dir: -1 | 1) => {
    setBranches((prev) => {
      const target = index + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const addBranch = () => {
    const firstComponent = components[0]?.name;
    setBranches((prev) => {
      // Keep the else branch last, if one exists.
      const elseIndex = prev.findIndex((b) => b.isElse);
      const branch = newBranch(`Branch ${prev.length + 1}`, firstComponent);
      if (elseIndex === -1) return [...prev, branch];
      const next = [...prev];
      next.splice(elseIndex, 0, branch);
      return next;
    });
  };

  const addElseBranch = () => {
    setBranches((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label: 'Otherwise', rules: [], isElse: true },
    ]);
  };

  const addRule = (branchId: string) => {
    const firstComponent = components[0]?.name ?? '';
    setBranches((prev) =>
      prev.map((b) => (b.id === branchId ? { ...b, rules: [...b.rules, newRule(firstComponent)] } : b))
    );
  };

  const updateRule = (branchId: string, ruleId: string, updates: Partial<ConditionRule>) => {
    setBranches((prev) =>
      prev.map((b) =>
        b.id === branchId
          ? { ...b, rules: b.rules.map((r) => (r.id === ruleId ? { ...r, ...updates } : r)) }
          : b
      )
    );
  };

  const removeRule = (branchId: string, ruleId: string) => {
    setBranches((prev) =>
      prev.map((b) => (b.id === branchId ? { ...b, rules: b.rules.filter((r) => r.id !== ruleId) } : b))
    );
  };

  const handleSave = () => {
    onSave(branches, targets);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-violet-500" />
            Manage branches
          </DialogTitle>
          <DialogDescription>
            Define the conditions that route to each path. Branches are checked in order — the
            first one that matches wins.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {branches.length === 0 && (
            <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
              No branches yet. Add one to start routing this note.
            </p>
          )}

          {branches.map((branch, index) => (
            <div key={branch.id} className="rounded-lg border bg-card p-3">
              <div className="flex items-center gap-1.5">
                <Input
                  value={branch.label}
                  onChange={(e) => updateBranch(branch.id, { label: e.target.value })}
                  placeholder="Branch label"
                  className="h-8"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => moveBranch(index, -1)}
                  disabled={index === 0}
                  aria-label="Move branch up"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => moveBranch(index, 1)}
                  disabled={index === branches.length - 1}
                  aria-label="Move branch down"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeBranch(branch.id)}
                  aria-label="Remove branch"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Target note */}
              <div className="mt-2 flex items-center gap-2">
                <Label className="w-16 shrink-0 text-xs text-muted-foreground">Goes to</Label>
                <Select
                  value={targets[branch.id] ?? '__none__'}
                  onValueChange={(value) =>
                    setTargets((prev) => ({ ...prev, [branch.id]: value === '__none__' ? null : value }))
                  }
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No connection yet</SelectItem>
                    {availableNotes.map((note) => (
                      <SelectItem key={note.id} value={note.id}>
                        {note.title || 'Untitled note'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Rules (skip for the else branch) */}
              {!branch.isElse ? (
                <div className="mt-3 space-y-2 border-t pt-2">
                  {branch.rules.map((rule) => {
                    const component = componentByName(rule.component);
                    const operators = operatorsForType(component?.type ?? 'string');
                    return (
                      <div key={rule.id} className="flex flex-wrap items-center gap-1.5">
                        <Select
                          value={rule.component || undefined}
                          onValueChange={(value) => {
                            const comp = componentByName(value);
                            updateRule(branch.id, rule.id, {
                              component: value,
                              operator: operatorsForType(comp?.type ?? 'string')[0],
                            });
                          }}
                        >
                          <SelectTrigger className="h-8 w-32 text-xs">
                            <SelectValue placeholder="Component" />
                          </SelectTrigger>
                          <SelectContent>
                            {components.map((c) => (
                              <SelectItem key={c.id} value={c.name}>
                                @{c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          value={rule.operator}
                          onValueChange={(value) =>
                            updateRule(branch.id, rule.id, {
                              operator: value as ConditionRule['operator'],
                            })
                          }
                        >
                          <SelectTrigger className="h-8 w-24 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {operators.map((op) => (
                              <SelectItem key={op} value={op}>
                                {op}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {component?.type === 'boolean' ? (
                          <Select
                            value={String(rule.value)}
                            onValueChange={(value) =>
                              updateRule(branch.id, rule.id, { value: value === 'true' })
                            }
                          >
                            <SelectTrigger className="h-8 w-24 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">true</SelectItem>
                              <SelectItem value="false">false</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : component?.type === 'list' && Array.isArray(component.current_value) ? (
                          <Select
                            value={String(rule.value)}
                            onValueChange={(value) => updateRule(branch.id, rule.id, { value })}
                          >
                            <SelectTrigger className="h-8 w-28 text-xs">
                              <SelectValue placeholder="Choice" />
                            </SelectTrigger>
                            <SelectContent>
                              {(component.current_value as (string | number | boolean)[]).map(
                                (choice, i) => (
                                  <SelectItem key={i} value={String(choice)}>
                                    {String(choice)}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            value={String(rule.value)}
                            onChange={(e) => updateRule(branch.id, rule.id, { value: e.target.value })}
                            type={component?.type === 'number' ? 'number' : 'text'}
                            placeholder="Value"
                            className="h-8 w-24 text-xs"
                          />
                        )}

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removeRule(branch.id, rule.id)}
                          aria-label="Remove condition"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => addRule(branch.id)}
                    disabled={components.length === 0}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add condition
                  </Button>
                  {branch.rules.length > 1 && (
                    <p className="text-xs text-muted-foreground">All conditions must match (AND).</p>
                  )}
                </div>
              ) : (
                <p className="mt-3 border-t pt-2 text-xs text-muted-foreground">
                  This branch is used whenever no earlier branch matches.
                </p>
              )}
            </div>
          ))}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={addBranch}
              disabled={components.length === 0}
            >
              <Plus className="h-3.5 w-3.5" />
              Add branch
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn('gap-1.5', hasElseBranch && 'hidden')}
              onClick={addElseBranch}
            >
              <Plus className="h-3.5 w-3.5" />
              Add else / default branch
            </Button>
          </div>

          {components.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Create a component first (in the Components panel) to build conditions.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save branches</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
