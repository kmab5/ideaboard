'use client';

import { memo, useMemo, useState } from 'react';
import { Handle, Position, type NodeProps, NodeResizer } from 'reactflow';
import { Wrench, MoreHorizontal, Trash2, Lock, Unlock, AlertTriangle, Play } from 'lucide-react';
import type { Note } from '@/types/database';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useComponentStore } from '@/lib/store';
import { MIN_NOTE_SIZE } from '@/lib/constants';
import {
  parseTechnicalData,
  applyUpdate,
  describeUpdate,
  type TechnicalUpdate,
} from '@/lib/technical';
import { TechnicalUpdateEditor } from './technical-update-editor';

interface TechnicalNoteNodeData {
  note: Note;
  onUpdate: (id: string, updates: Partial<Note>) => void;
  onDelete: (id: string) => void;
  onSaveUpdates: (noteId: string, updates: TechnicalUpdate[]) => void;
  onApplyUpdates: (noteId: string) => void;
}

function formatValue(value: unknown): string {
  if (value === undefined) return '—';
  if (value === null) return 'null';
  if (Array.isArray(value)) return `[${value.map(String).join(', ')}]`;
  return String(value);
}

const TechnicalNoteNode = memo(({ data, selected }: NodeProps<TechnicalNoteNodeData>) => {
  const { note, onUpdate, onDelete, onSaveUpdates, onApplyUpdates } = data;
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [title, setTitle] = useState(note.title || '');
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const components = useComponentStore((s) => s.components);
  const componentByName = useMemo(
    () => new Map(components.map((c) => [c.name.toLowerCase(), c])),
    [components]
  );
  const technicalData = useMemo(
    () => parseTechnicalData(note.technical_data),
    [note.technical_data]
  );

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (title !== (note.title || '')) {
      onUpdate(note.id, { title });
    }
  };

  const toggleLock = () => onUpdate(note.id, { is_locked: !note.is_locked });

  return (
    <>
      <NodeResizer
        isVisible={selected && !note.is_locked}
        minWidth={MIN_NOTE_SIZE.width}
        minHeight={140}
        handleStyle={{ width: 8, height: 8 }}
      />

      <div
        className={cn(
          'flex h-full w-full flex-col overflow-hidden rounded-lg border-2 border-cyan-400 bg-white shadow-md shadow-black/5 dark:bg-gray-900',
          selected && 'ring-2 ring-cyan-500 ring-offset-1'
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-1.5 border-b border-cyan-200 bg-cyan-50 px-2 py-1.5 dark:border-cyan-900 dark:bg-cyan-950/40">
          <Wrench className="h-3.5 w-3.5 shrink-0 text-cyan-700 dark:text-cyan-400" />
          <span className="shrink-0 rounded bg-cyan-700 px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-white">
            Set
          </span>
          {isEditingTitle ? (
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
              className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none"
            />
          ) : (
            <button
              type="button"
              onDoubleClick={() => setIsEditingTitle(true)}
              className="min-w-0 flex-1 truncate text-left text-sm font-medium"
            >
              {note.title || 'Untitled update'}
            </button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={toggleLock}>
                {note.is_locked ? (
                  <Unlock className="mr-2 h-4 w-4" />
                ) : (
                  <Lock className="mr-2 h-4 w-4" />
                )}
                {note.is_locked ? 'Unlock' : 'Lock'}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(note.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Update list */}
        <div className="flex-1 space-y-1.5 overflow-y-auto p-2">
          {technicalData.updates.length === 0 ? (
            <p className="text-xs text-muted-foreground">No updates yet.</p>
          ) : (
            technicalData.updates.map((update) => {
              const component = componentByName.get(update.component.toLowerCase());
              const invalid = !component;
              const preview = component ? applyUpdate(component.current_value, update) : undefined;

              return (
                <div
                  key={update.id}
                  className="rounded-md border border-border/60 bg-muted/30 px-2 py-1.5 text-xs"
                >
                  <div className="flex items-center gap-1">
                    <span className="truncate font-mono">{describeUpdate(update)}</span>
                    {invalid && (
                      <AlertTriangle
                        className="h-3 w-3 shrink-0 text-amber-500"
                        aria-label={`Unknown component: ${update.component}`}
                      />
                    )}
                  </div>
                  {component && preview !== undefined && (
                    <p className="truncate text-[0.68rem] text-muted-foreground">
                      {formatValue(component.current_value)} → {formatValue(preview)}
                    </p>
                  )}
                </div>
              );
            })
          )}

          <div className="flex gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => setIsEditorOpen(true)}
            >
              Manage updates
            </Button>
            {technicalData.updates.length > 0 && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="gap-1 text-xs"
                onClick={() => onApplyUpdates(note.id)}
                title="Apply these updates to the components now (for testing a path)"
              >
                <Play className="h-3 w-3" />
                Apply
              </Button>
            )}
          </div>
        </div>
      </div>

      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !bg-cyan-500" />
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !bg-cyan-500" />

      <TechnicalUpdateEditor
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        initialUpdates={technicalData.updates}
        components={components}
        onSave={(updates) => onSaveUpdates(note.id, updates)}
      />
    </>
  );
});

TechnicalNoteNode.displayName = 'TechnicalNoteNode';

export { TechnicalNoteNode };
