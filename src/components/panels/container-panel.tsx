'use client';

import { useMemo, useState } from 'react';
import {
  X,
  Search,
  Box,
  MoreHorizontal,
  Trash2,
  Pencil,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  Crosshair,
} from 'lucide-react';
import type { Container, Note } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { notesInContainer } from '@/lib/containers';

interface ContainerPanelProps {
  containers: Container[];
  notes: Note[];
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Container>) => void;
  onDelete: (id: string, keepContents: boolean) => void;
  /** Pan the canvas to centre on this container. */
  onFocusContainer: (id: string) => void;
  /** Pan the canvas to centre on this note. */
  onFocusNote: (id: string) => void;
}

export function ContainerPanel({
  containers,
  notes,
  onClose,
  onUpdate,
  onDelete,
  onFocusContainer,
  onFocusNote,
}: ContainerPanelProps) {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftDescription, setDraftDescription] = useState('');

  // Shapes the geometry helpers expect.
  const containerBounds = useMemo(
    () =>
      containers.map((c) => ({
        id: c.id,
        x: c.position_x,
        y: c.position_y,
        width: c.width,
        height: c.height,
        z_index: c.z_index,
      })),
    [containers]
  );

  const noteShapes = useMemo(
    () =>
      notes.map((n) => ({
        id: n.id,
        position_x: n.position_x,
        position_y: n.position_y,
        width: n.width,
        height: n.height,
      })),
    [notes]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return containers;
    return containers.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        (c.description ?? '').toLowerCase().includes(query)
    );
  }, [containers, search]);

  const startEditing = (container: Container) => {
    setEditingId(container.id);
    setDraftName(container.name);
    setDraftDescription(container.description ?? '');
  };

  const commitEditing = (container: Container) => {
    const name = draftName.trim();
    const description = draftDescription.trim();
    const updates: Partial<Container> = {};
    if (name && name !== container.name) updates.name = name;
    if (description !== (container.description ?? '')) updates.description = description || null;
    if (Object.keys(updates).length > 0) onUpdate(container.id, updates);
    setEditingId(null);
  };

  return (
    <div className="absolute right-4 top-4 z-20 flex max-h-[calc(100%-2rem)] w-80 flex-col rounded-lg border bg-background shadow-xl">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Box className="h-4 w-4 text-violet-500" />
          Containers
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-normal text-muted-foreground">
            {containers.length}
          </span>
        </h2>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose} aria-label="Close">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="border-b p-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search containers..."
            className="h-8 pl-8 text-sm"
          />
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        {containers.length === 0 ? (
          <p className="px-1 py-6 text-center text-xs text-muted-foreground">
            No containers on this board yet. Press <span className="font-mono">C</span> to add one.
          </p>
        ) : filtered.length === 0 ? (
          <p className="px-1 py-6 text-center text-xs text-muted-foreground">
            No containers match &ldquo;{search}&rdquo;.
          </p>
        ) : (
          filtered.map((container) => {
            const contained = notesInContainer(
              {
                id: container.id,
                x: container.position_x,
                y: container.position_y,
                width: container.width,
                height: container.height,
                z_index: container.z_index,
              },
              noteShapes,
              containerBounds
            );
            const isExpanded = expandedId === container.id;
            const isEditing = editingId === container.id;
            const color = container.color || '#7c3aed';

            return (
              <div key={container.id} className="rounded-lg border bg-card p-2">
                <div className="flex items-start gap-1.5">
                  <span
                    className="mt-1 h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: color }}
                    aria-hidden
                  />

                  {isEditing ? (
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <Input
                        autoFocus
                        value={draftName}
                        maxLength={100}
                        onChange={(e) => setDraftName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitEditing(container);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="h-7 text-sm"
                      />
                      <Input
                        value={draftDescription}
                        placeholder="Description (optional)"
                        onChange={(e) => setDraftDescription(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitEditing(container);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="h-7 text-xs"
                      />
                      <div className="flex gap-1.5">
                        <Button size="sm" className="h-6 text-xs" onClick={() => commitEditing(container)}>
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-xs"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onFocusContainer(container.id)}
                      className="min-w-0 flex-1 text-left"
                      title="Go to container"
                    >
                      <p className="truncate text-sm font-medium">{container.name}</p>
                      {container.description && (
                        <p className="truncate text-xs text-muted-foreground">
                          {container.description}
                        </p>
                      )}
                    </button>
                  )}

                  {!isEditing && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          aria-label={`Options for ${container.name}`}
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onFocusContainer(container.id)}>
                          <Crosshair className="mr-2 h-4 w-4" />
                          Go to container
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => startEditing(container)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit name &amp; description
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(container.id, true)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete, keep notes
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => onDelete(container.id, false)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete with {contained.length}{' '}
                          {contained.length === 1 ? 'note' : 'notes'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {/* Contents preview */}
                <div className="mt-1.5 border-t pt-1.5">
                  {contained.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Empty</p>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : container.id)}
                        className="flex w-full items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                        {contained.length} {contained.length === 1 ? 'note' : 'notes'}
                      </button>

                      {isExpanded && (
                        <ul className="mt-1 space-y-0.5">
                          {contained.map((item) => {
                            const note = notes.find((n) => n.id === item.id);
                            return (
                              <li key={item.id}>
                                <button
                                  type="button"
                                  onClick={() => onFocusNote(item.id)}
                                  className={cn(
                                    'flex w-full items-center gap-1 rounded px-1 py-0.5',
                                    'text-left text-xs hover:bg-accent'
                                  )}
                                >
                                  <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                                  <span className="truncate">
                                    {note?.title || 'Untitled note'}
                                  </span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
