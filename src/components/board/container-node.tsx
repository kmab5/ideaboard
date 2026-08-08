'use client';

import { memo, useState } from 'react';
import { type NodeProps, NodeResizer } from 'reactflow';
import { Box, MoreHorizontal, Trash2, Lock, Unlock } from 'lucide-react';
import type { Container } from '@/types/database';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { CONTAINER_COLORS } from '@/lib/constants';

export interface ContainerNodeData {
  container: Container;
  noteCount: number;
  onUpdate: (id: string, updates: Partial<Container>) => void;
  /** keepContents: leave notes on the canvas; otherwise delete them too. */
  onDelete: (id: string, keepContents: boolean) => void;
}

const ContainerNode = memo(({ data, selected }: NodeProps<ContainerNodeData>) => {
  const { container, noteCount, onUpdate, onDelete } = data;
  const [name, setName] = useState(container.name);
  const [isEditingName, setIsEditingName] = useState(false);

  const color = container.color || CONTAINER_COLORS[0];

  const handleNameBlur = () => {
    setIsEditingName(false);
    const trimmed = name.trim();
    if (trimmed && trimmed !== container.name) {
      onUpdate(container.id, { name: trimmed });
    } else {
      setName(container.name);
    }
  };

  return (
    <>
      <NodeResizer
        isVisible={selected && !container.is_locked}
        minWidth={200}
        minHeight={160}
        handleStyle={{ width: 8, height: 8 }}
        lineStyle={{ borderColor: color }}
      />

      <div
        className={cn(
          'flex h-full w-full flex-col overflow-hidden rounded-lg border-2 border-dashed transition-shadow',
          selected && 'shadow-lg'
        )}
        style={{
          borderColor: color,
          // Tint is deliberately faint so notes on top stay readable.
          backgroundColor: `${color}14`,
        }}
      >
        {/* Header strip — the only draggable/clickable part, so notes inside
            stay directly interactive. */}
        <div
          className="drag-handle__container flex cursor-move items-center gap-1.5 px-2 py-1"
          style={{ backgroundColor: `${color}26` }}
        >
          <Box className="h-3.5 w-3.5 shrink-0" style={{ color }} />

          {isEditingName ? (
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleNameBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                if (e.key === 'Escape') {
                  setName(container.name);
                  setIsEditingName(false);
                }
              }}
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
            />
          ) : (
            <button
              type="button"
              onDoubleClick={() => setIsEditingName(true)}
              className="min-w-0 flex-1 truncate text-left text-sm font-semibold"
              title={container.description || container.name}
            >
              {container.name}
            </button>
          )}

          <span className="shrink-0 rounded bg-background/70 px-1.5 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
            {noteCount} {noteCount === 1 ? 'note' : 'notes'}
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                aria-label={`Container options for ${container.name}`}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditingName(true)}>Rename</DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onUpdate(container.id, { is_locked: !container.is_locked })}
              >
                {container.is_locked ? (
                  <Unlock className="mr-2 h-4 w-4" />
                ) : (
                  <Lock className="mr-2 h-4 w-4" />
                )}
                {container.is_locked ? 'Unlock' : 'Lock'}
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <div className="flex gap-1 px-2 py-1.5">
                {CONTAINER_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => onUpdate(container.id, { color: c })}
                    className={cn(
                      'h-5 w-5 rounded-full border-2 transition-transform hover:scale-110',
                      container.color === c ? 'border-foreground' : 'border-transparent'
                    )}
                    style={{ backgroundColor: c }}
                    aria-label={`Set container color ${c}`}
                  />
                ))}
              </div>
              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => onDelete(container.id, true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete, keep notes
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(container.id, false)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete with {noteCount} {noteCount === 1 ? 'note' : 'notes'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Body is pointer-transparent so notes stacked above stay clickable. */}
        <div className="pointer-events-none flex-1" />
      </div>
    </>
  );
});

ContainerNode.displayName = 'ContainerNode';

export { ContainerNode };
