'use client';

import { useEffect, useState } from 'react';
import { Plus, X, Wrench } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { operationsForType, type TechnicalOperation, type TechnicalUpdate } from '@/lib/technical';

export interface UpdateEditorComponent {
  id: string;
  name: string;
  type: 'number' | 'string' | 'boolean' | 'list';
}

interface TechnicalUpdateEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialUpdates: TechnicalUpdate[];
  components: UpdateEditorComponent[];
  onSave: (updates: TechnicalUpdate[]) => void;
}

function newUpdate(component: string, type: UpdateEditorComponent['type']): TechnicalUpdate {
  return {
    id: crypto.randomUUID(),
    component,
    operation: operationsForType(type)[0],
    value: '',
  };
}

export function TechnicalUpdateEditor({
  open,
  onOpenChange,
  initialUpdates,
  components,
  onSave,
}: TechnicalUpdateEditorProps) {
  const [updates, setUpdates] = useState<TechnicalUpdate[]>(initialUpdates);

  useEffect(() => {
    if (open) setUpdates(initialUpdates);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const componentByName = (name: string) =>
    components.find((c) => c.name.toLowerCase() === name.toLowerCase());

  const addUpdateRow = () => {
    const first = components[0];
    if (!first) return;
    setUpdates((prev) => [...prev, newUpdate(first.name, first.type)]);
  };

  const updateRow = (id: string, patch: Partial<TechnicalUpdate>) => {
    setUpdates((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  };

  const removeRow = (id: string) => {
    setUpdates((prev) => prev.filter((u) => u.id !== id));
  };

  const handleSave = () => {
    onSave(updates);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-cyan-600" />
            Manage updates
          </DialogTitle>
          <DialogDescription>
            Define what changes when a reader reaches this note. All updates apply together.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          {updates.length === 0 && (
            <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
              No updates yet. Add one to change a component&apos;s value here.
            </p>
          )}

          {updates.map((update) => {
            const component = componentByName(update.component);
            const operations = operationsForType(component?.type ?? 'string');
            const isToggle = update.operation === 'toggle';

            return (
              <div
                key={update.id}
                className="flex flex-wrap items-center gap-1.5 rounded-md border p-2"
              >
                <Select
                  value={update.component || undefined}
                  onValueChange={(value) => {
                    const comp = componentByName(value);
                    updateRow(update.id, {
                      component: value,
                      operation: operationsForType(comp?.type ?? 'string')[0],
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
                  value={update.operation}
                  onValueChange={(value) =>
                    updateRow(update.id, { operation: value as TechnicalOperation })
                  }
                >
                  <SelectTrigger className="h-8 w-28 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {operations.map((op) => (
                      <SelectItem key={op} value={op}>
                        {op}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {!isToggle &&
                  (component?.type === 'boolean' ? (
                    <Select
                      value={String(update.value)}
                      onValueChange={(value) => updateRow(update.id, { value: value === 'true' })}
                    >
                      <SelectTrigger className="h-8 w-24 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">true</SelectItem>
                        <SelectItem value="false">false</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={String(update.value)}
                      onChange={(e) => updateRow(update.id, { value: e.target.value })}
                      type={component?.type === 'number' ? 'number' : 'text'}
                      placeholder="Value"
                      className="h-8 w-24 text-xs"
                    />
                  ))}

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeRow(update.id)}
                  aria-label="Remove update"
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
            className="gap-1.5"
            onClick={addUpdateRow}
            disabled={components.length === 0}
          >
            <Plus className="h-3.5 w-3.5" />
            Add update
          </Button>

          {components.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Create a component first (in the Components panel) to add updates.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save updates</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
