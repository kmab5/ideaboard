'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  X,
  Plus,
  Search,
  MoreHorizontal,
  Trash2,
  Edit2,
  RotateCcw,
  Hash,
  Type,
  ToggleLeft,
  List,
  ChevronRight,
  ChevronDown,
  Pencil,
  ArrowRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useComponentStore } from '@/lib/store';
import type { Component, ComponentType as CompType, Note } from '@/types/database';
import { noteReferencesComponent, renameReferenceInContent } from '@/lib/references';
import { ListChoicesEditor } from './list-choices-editor';
import {
  createComponentSchema,
  type CreateComponentInput,
  type UpdateComponentInput,
} from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ComponentPanelProps {
  storyId: string;
  components: Component[];
  notes: Note[];
  onClose: () => void;
  onFocusNote: (noteId: string) => void;
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
}

const TYPE_ICONS: Record<CompType, React.ReactNode> = {
  number: <Hash className="h-4 w-4" />,
  string: <Type className="h-4 w-4" />,
  boolean: <ToggleLeft className="h-4 w-4" />,
  list: <List className="h-4 w-4" />,
};

const TYPE_COLORS: Record<CompType, string> = {
  number: 'bg-blue-100 text-blue-800',
  string: 'bg-green-100 text-green-800',
  boolean: 'bg-purple-100 text-purple-800',
  list: 'bg-orange-100 text-orange-800',
};

export function ComponentPanel({
  storyId,
  components,
  notes,
  onClose,
  onFocusNote,
  onUpdateNote,
}: ComponentPanelProps) {
  const supabase = createClient();
  const {
    addComponent,
    updateComponent,
    removeComponent,
    resetComponent,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    getFilteredComponents,
  } = useComponentStore();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<Component | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [renamingComponent, setRenamingComponent] = useState<Component | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createComponentSchema),
    defaultValues: {
      story_id: storyId,
      name: '',
      type: 'string' as const,
      description: '',
      default_value: null as string | number | boolean | (string | number | boolean)[] | null,
      current_value: null as string | number | boolean | (string | number | boolean)[] | null,
    },
  });

  const selectedType = watch('type') as CompType;

  const handleCreate = async (data: CreateComponentInput) => {
    try {
      // Set default values based on type
      let defaultVal = data.default_value;
      if (defaultVal === null || defaultVal === undefined) {
        switch (data.type) {
          case 'number':
            defaultVal = 0;
            break;
          case 'boolean':
            defaultVal = false;
            break;
          case 'string':
            defaultVal = '';
            break;
          case 'list':
            defaultVal = [];
            break;
        }
      }

      const { data: newComponent, error } = await supabase
        .from('components')
        .insert({
          story_id: data.story_id,
          name: data.name,
          type: data.type,
          description: data.description || null,
          default_value: defaultVal,
          current_value: defaultVal,
          color_tag: data.color_tag || null,
          sort_order: components.length,
        })
        .select()
        .single();

      if (error) throw error;

      addComponent(newComponent);
      reset();
      setIsCreateDialogOpen(false);
      toast.success('Component created!');
    } catch (error) {
      console.error('Error creating component:', error);
      toast.error('Failed to create component');
    }
  };

  const handleUpdate = async (id: string, updates: UpdateComponentInput) => {
    try {
      const { error } = await supabase.from('components').update(updates).eq('id', id);

      if (error) throw error;

      updateComponent(id, updates);
      setEditingComponent(null);
      toast.success('Component updated!');
    } catch (error) {
      console.error('Error updating component:', error);
      toast.error('Failed to update component');
    }
  };

  // Rename a component and propagate the change to every note that references
  // it, so inline `{{name}}` tokens stay valid (PRD 4.6.4, rename propagation).
  const handleRename = async (component: Component, rawName: string) => {
    const newName = rawName.trim();
    if (!newName || newName === component.name) {
      setRenamingComponent(null);
      return;
    }
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(newName)) {
      toast.error('Use letters, numbers, and underscores (must start with a letter)');
      return;
    }
    if (components.some((c) => c.id !== component.id && c.name.toLowerCase() === newName.toLowerCase())) {
      toast.error('A component with that name already exists');
      return;
    }

    try {
      const { error } = await supabase
        .from('components')
        .update({ name: newName })
        .eq('id', component.id);
      if (error) throw error;

      updateComponent(component.id, { name: newName });

      // Update references in affected notes.
      const affected = notes.filter((note) => noteReferencesComponent(note.content, component.name));
      affected.forEach((note) => {
        onUpdateNote(note.id, {
          content: renameReferenceInContent(note.content, component.name, newName),
        });
      });

      setRenamingComponent(null);
      toast.success(
        affected.length > 0
          ? `Renamed and updated ${affected.length} reference${affected.length === 1 ? '' : 's'}`
          : 'Component renamed'
      );
    } catch (error) {
      console.error('Error renaming component:', error);
      toast.error('Failed to rename component');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('components').delete().eq('id', id);

      if (error) throw error;

      removeComponent(id);
      toast.success('Component deleted!');
    } catch (error) {
      console.error('Error deleting component:', error);
      toast.error('Failed to delete component');
    }
  };

  const handleReset = async (id: string) => {
    const component = components.find((c) => c.id === id);
    if (!component) return;

    try {
      const { error } = await supabase
        .from('components')
        .update({ current_value: component.default_value })
        .eq('id', id);

      if (error) throw error;

      resetComponent(id);
      toast.success('Component reset to default!');
    } catch (error) {
      console.error('Error resetting component:', error);
      toast.error('Failed to reset component');
    }
  };

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (Array.isArray(value))
      return value.length ? value.map((v) => String(v)).join(', ') : 'empty';
    return String(value);
  };

  const filteredComponents = getFilteredComponents();

  return (
    <div className="fixed inset-0 z-20 flex flex-col bg-background transition-all duration-300 sm:absolute sm:inset-auto sm:bottom-4 sm:right-4 sm:top-16 sm:w-80 sm:rounded-lg sm:border sm:shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-lg font-semibold sm:text-base">Components</h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="space-y-2 border-b p-3">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search components..."
            className="h-8 pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-1">
          {(['number', 'string', 'boolean', 'list'] as CompType[]).map((type) => (
            <Button
              key={type}
              variant={filterType === type ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2"
              onClick={() => setFilterType(filterType === type ? null : type)}
            >
              {TYPE_ICONS[type]}
            </Button>
          ))}
        </div>
      </div>

      {/* Component List */}
      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        {filteredComponents.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <p className="text-sm">No components found</p>
            <p className="mt-1 text-xs">Create one to get started</p>
          </div>
        ) : (
          filteredComponents.map((component) => {
            const referencingNotes = notes.filter((note) =>
              noteReferencesComponent(note.content, component.name)
            );
            const isExpanded = expandedId === component.id;

            return (
              <div
                key={component.id}
                className="rounded-lg border bg-card p-3 transition-shadow hover:shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={cn('px-1', TYPE_COLORS[component.type])}>
                      {TYPE_ICONS[component.type]}
                    </Badge>
                    <span className="font-mono text-sm font-medium">@{component.name}</span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingComponent(component)}>
                        <Edit2 className="mr-2 h-4 w-4" />
                        Edit value
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setRenameValue(component.name);
                          setRenamingComponent(component);
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleReset(component.id)}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reset to Default
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDelete(component.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {component.description && (
                  <p className="mt-1 text-xs text-muted-foreground">{component.description}</p>
                )}

                {component.type === 'list' ? (
                  <div className="mt-2 text-xs">
                    <span className="text-muted-foreground">Choices:</span>
                    {Array.isArray(component.current_value) &&
                    component.current_value.length > 0 ? (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {(component.current_value as (string | number | boolean)[]).map((choice, i) => (
                          <span
                            key={i}
                            className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.7rem]"
                          >
                            {String(choice)}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="ml-1 text-muted-foreground">none yet</span>
                    )}
                  </div>
                ) : (
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Current:</span>
                    <span className="font-mono">{formatValue(component.current_value)}</span>
                  </div>
                )}

                {/* Usage tracking (PRD 4.6.4): where this component is referenced. */}
                <div className="mt-2 border-t pt-2">
                  {referencingNotes.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Not referenced yet</p>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : component.id)}
                        className="flex w-full items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                        Used in {referencingNotes.length} note
                        {referencingNotes.length === 1 ? '' : 's'}
                      </button>

                      {isExpanded && (
                        <ul className="mt-1 space-y-0.5">
                          {referencingNotes.map((note) => (
                            <li key={note.id}>
                              <button
                                type="button"
                                onClick={() => onFocusNote(note.id)}
                                className="group flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-xs hover:bg-accent"
                              >
                                <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                                <span className="truncate">{note.title || 'Untitled note'}</span>
                              </button>
                            </li>
                          ))}
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

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit(handleCreate)}>
            <DialogHeader>
              <DialogTitle>Create Component</DialogTitle>
              <DialogDescription>Add a new variable to your story</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="health" {...register('name')} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={selectedType}
                  onValueChange={(value: string) => setValue('type', value as CompType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="string">String</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                    <SelectItem value="list">List</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  placeholder="Player's health points"
                  {...register('description')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="default_value">Default Value</Label>
                {selectedType === 'number' && (
                  <Input
                    id="default_value"
                    type="number"
                    placeholder="0"
                    onChange={(e) => setValue('default_value', parseFloat(e.target.value) || 0)}
                  />
                )}
                {selectedType === 'string' && (
                  <Input
                    id="default_value"
                    placeholder="Enter default text"
                    onChange={(e) => setValue('default_value', e.target.value)}
                  />
                )}
                {selectedType === 'boolean' && (
                  <Select
                    defaultValue="false"
                    onValueChange={(value: string) => setValue('default_value', value === 'true')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">True</SelectItem>
                      <SelectItem value="false">False</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                {selectedType === 'list' && (
                  <ListChoicesEditor
                    value={(watch('default_value') as (string | number | boolean)[]) || []}
                    onChange={(next) => setValue('default_value', next)}
                  />
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {editingComponent && (
        <Dialog open={!!editingComponent} onOpenChange={() => setEditingComponent(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Component</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <p className="font-mono text-sm">@{editingComponent.name}</p>
              </div>

              <div className="space-y-2">
                <Label>{editingComponent.type === 'list' ? 'Choices' : 'Current Value'}</Label>
                {editingComponent.type === 'number' && (
                  <Input
                    type="number"
                    defaultValue={editingComponent.current_value as number}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      handleUpdate(editingComponent.id, { current_value: value });
                    }}
                  />
                )}
                {editingComponent.type === 'string' && (
                  <Input
                    defaultValue={editingComponent.current_value as string}
                    onChange={(e) => {
                      handleUpdate(editingComponent.id, {
                        current_value: e.target.value,
                      });
                    }}
                  />
                )}
                {editingComponent.type === 'boolean' && (
                  <Select
                    defaultValue={String(editingComponent.current_value)}
                    onValueChange={(value: string) => {
                      handleUpdate(editingComponent.id, {
                        current_value: value === 'true',
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">True</SelectItem>
                      <SelectItem value="false">False</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                {editingComponent.type === 'list' && (
                  <>
                    <ListChoicesEditor
                      key={editingComponent.id}
                      value={
                        Array.isArray(editingComponent.current_value)
                          ? (editingComponent.current_value as (string | number | boolean)[])
                          : []
                      }
                      onChange={(next) =>
                        handleUpdate(editingComponent.id, { current_value: next })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      These are the possible values for @{editingComponent.name}. Reference them from
                      a note with{' '}
                      <span className="font-mono">{`{{${editingComponent.name}}}`}</span>.
                    </p>
                  </>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => setEditingComponent(null)}>Done</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Rename Dialog */}
      {renamingComponent && (
        <Dialog open={!!renamingComponent} onOpenChange={() => setRenamingComponent(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename Component</DialogTitle>
              <DialogDescription>
                References in notes will be updated automatically.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-4">
              <Label htmlFor="rename-input">Name</Label>
              <Input
                id="rename-input"
                value={renameValue}
                autoFocus
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename(renamingComponent, renameValue);
                }}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setRenamingComponent(null)}>
                Cancel
              </Button>
              <Button onClick={() => handleRename(renamingComponent, renameValue)}>Rename</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
