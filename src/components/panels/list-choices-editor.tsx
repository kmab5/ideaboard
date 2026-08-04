'use client';

import { useState } from 'react';
import { Plus, X, ChevronUp, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Choice = string | number | boolean;

interface ListChoicesEditorProps {
  value: Choice[];
  onChange: (next: Choice[]) => void;
}

/**
 * Add / edit / remove / reorder the choices of a `list` component.
 * Local edits are committed (trimmed, empties dropped) on blur and immediately
 * on structural changes, so the caller only persists meaningful values.
 */
export function ListChoicesEditor({ value, onChange }: ListChoicesEditorProps) {
  const [items, setItems] = useState<string[]>(() =>
    value && value.length ? value.map((v) => String(v)) : ['']
  );

  const commit = (next: string[]) => {
    onChange(next.map((s) => s.trim()).filter((s) => s.length > 0));
  };

  const updateItem = (index: number, val: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? val : item)));
  };

  const addItem = () => setItems((prev) => [...prev, '']);

  const removeItem = (index: number) => {
    setItems((prev) => {
      const next = prev.filter((_, i) => i !== index);
      commit(next);
      return next.length ? next : [''];
    });
  };

  const move = (index: number, dir: -1 | 1) => {
    setItems((prev) => {
      const target = index + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      commit(next);
      return next;
    });
  };

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1.5">
          <span className="w-5 shrink-0 text-right font-mono text-xs text-muted-foreground">
            {index + 1}.
          </span>
          <Input
            value={item}
            placeholder={`Choice ${index + 1}`}
            onChange={(e) => updateItem(index, e.target.value)}
            onBlur={() => commit(items)}
            className="h-8"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => move(index, -1)}
            disabled={index === 0}
            aria-label="Move choice up"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => move(index, 1)}
            disabled={index === items.length - 1}
            aria-label="Move choice down"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => removeItem(index)}
            aria-label="Remove choice"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addItem}>
        <Plus className="h-3.5 w-3.5" />
        Add choice
      </Button>
    </div>
  );
}
