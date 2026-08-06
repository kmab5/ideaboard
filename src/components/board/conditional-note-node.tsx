'use client';

import { memo, useMemo, useState } from 'react';
import { Handle, Position, type NodeProps, NodeResizer } from 'reactflow';
import { GitBranch, MoreHorizontal, Trash2, Lock, Unlock, AlertTriangle } from 'lucide-react';
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
  parseConditionData,
  makeComponentLookup,
  getActiveBranchId,
  describeBranch,
  invalidComponentNames,
  type ConditionalBranch,
} from '@/lib/conditions';
import {
  ConditionalBranchEditor,
  type BranchEditorNoteOption,
} from './conditional-branch-editor';

interface ConditionalNoteNodeData {
  note: Note;
  onUpdate: (id: string, updates: Partial<Note>) => void;
  onDelete: (id: string) => void;
  onSaveBranches: (
    noteId: string,
    branches: ConditionalBranch[],
    targets: Record<string, string | null>
  ) => void;
  /** Current connection target per branch id, derived from the board's connections. */
  branchTargets: Record<string, string | null>;
  availableNotes: BranchEditorNoteOption[];
}

const ConditionalNoteNode = memo(({ data, selected }: NodeProps<ConditionalNoteNodeData>) => {
  const { note, onUpdate, onDelete, onSaveBranches, branchTargets, availableNotes } = data;
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [title, setTitle] = useState(note.title || '');
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const components = useComponentStore((s) => s.components);
  const lookup = useMemo(() => makeComponentLookup(components), [components]);
  const conditionData = useMemo(() => parseConditionData(note.condition_data), [note.condition_data]);
  const activeBranchId = useMemo(
    () => getActiveBranchId(conditionData.branches, lookup),
    [conditionData.branches, lookup]
  );

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (title !== (note.title || '')) {
      onUpdate(note.id, { title });
    }
  };

  const toggleLock = () => onUpdate(note.id, { is_locked: !note.is_locked });

  const handleSaveBranches = (
    branches: ConditionalBranch[],
    targets: Record<string, string | null>
  ) => {
    onSaveBranches(note.id, branches, targets);
  };

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
          'flex h-full w-full flex-col overflow-hidden rounded-lg border-2 border-violet-400 bg-white shadow-md shadow-black/5 dark:bg-gray-900',
          selected && 'ring-2 ring-violet-500 ring-offset-1'
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-1.5 border-b border-violet-200 bg-violet-50 px-2 py-1.5 dark:border-violet-900 dark:bg-violet-950/40">
          <GitBranch className="h-3.5 w-3.5 shrink-0 text-violet-600 dark:text-violet-400" />
          <span className="shrink-0 rounded bg-violet-600 px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-white">
            If
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
              {note.title || 'Untitled condition'}
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

        {/* Branch list */}
        <div className="flex-1 space-y-1.5 overflow-y-auto p-2">
          {conditionData.branches.length === 0 ? (
            <p className="text-xs text-muted-foreground">No branches yet.</p>
          ) : (
            conditionData.branches.map((branch) => {
              const isActive = branch.id === activeBranchId;
              const invalid = invalidComponentNames(branch, lookup);
              const targetId = branchTargets[branch.id];
              const targetNote = availableNotes.find((n) => n.id === targetId);

              return (
                <div
                  key={branch.id}
                  className={cn(
                    'rounded-md border px-2 py-1.5 text-xs transition-colors',
                    isActive
                      ? 'border-violet-500 bg-violet-500/10 font-medium'
                      : 'border-border/60 bg-muted/30 text-muted-foreground'
                  )}
                >
                  <div className="flex items-center gap-1">
                    {isActive && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />}
                    <span className="truncate">{branch.label}</span>
                    {invalid.length > 0 && (
                      <AlertTriangle
                        className="h-3 w-3 shrink-0 text-amber-500"
                        aria-label={`References missing component(s): ${invalid.join(', ')}`}
                      />
                    )}
                  </div>
                  <p className="truncate font-mono text-[0.68rem] opacity-80">
                    {describeBranch(branch)}
                  </p>
                  <p className="truncate text-[0.68rem] opacity-70">
                    → {targetNote ? targetNote.title || 'Untitled note' : 'no connection yet'}
                  </p>
                </div>
              );
            })
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => setIsEditorOpen(true)}
          >
            Manage branches
          </Button>
        </div>
      </div>

      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !bg-violet-500" />
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !bg-violet-500" />

      <ConditionalBranchEditor
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        initialBranches={conditionData.branches}
        initialTargets={branchTargets}
        availableNotes={availableNotes}
        components={components}
        onSave={handleSaveBranches}
      />
    </>
  );
});

ConditionalNoteNode.displayName = 'ConditionalNoteNode';

export { ConditionalNoteNode };
