'use client';

import { memo, useState, useCallback, useEffect, useRef } from 'react';
import { Handle, Position, type NodeProps, NodeResizer } from 'reactflow';
import { GripVertical, MoreHorizontal, Trash2, Lock, Unlock, Palette } from 'lucide-react';
import type { Note } from '@/types/database';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface NoteNodeData {
  note: Note;
  onUpdate: (id: string, updates: Partial<Note>) => void;
  onDelete: (id: string) => void;
}

// Available note colors
const NOTE_COLORS = [
  { value: '#FFFFFF', label: 'White', bg: 'bg-white' },
  { value: '#FFF9C4', label: 'Yellow', bg: 'bg-yellow-100' },
  { value: '#FFCCBC', label: 'Orange', bg: 'bg-orange-100' },
  { value: '#F8BBD9', label: 'Pink', bg: 'bg-pink-100' },
  { value: '#E1BEE7', label: 'Purple', bg: 'bg-purple-100' },
  { value: '#C5CAE9', label: 'Indigo', bg: 'bg-indigo-100' },
  { value: '#BBDEFB', label: 'Blue', bg: 'bg-blue-100' },
  { value: '#B2DFDB', label: 'Teal', bg: 'bg-teal-100' },
  { value: '#C8E6C9', label: 'Green', bg: 'bg-green-100' },
];

const NoteNode = memo(({ data, selected }: NodeProps<NoteNodeData>) => {
  const { note, onUpdate, onDelete } = data;
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [title, setTitle] = useState(note.title || '');
  const [content, setContent] = useState((note.content?.blocks?.[0]?.content as string) || '');

  // Sync state when note prop changes
  useEffect(() => {
    setTitle(note.title || '');
    setContent((note.content?.blocks?.[0]?.content as string) || '');
  }, [note.title, note.content]);

  // Touch double-tap detection refs
  const lastTitleTapRef = useRef<number>(0);
  const lastContentTapRef = useRef<number>(0);
  const DOUBLE_TAP_DELAY = 350; // ms - slightly longer for better detection

  const handleTitleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!note.is_locked) {
        setIsEditingTitle(true);
      }
    },
    [note.is_locked]
  );

  const handleTitleTouchStart = useCallback((e: React.TouchEvent) => {
    // Don't stop propagation on start - just track
    const now = Date.now();
    if (now - lastTitleTapRef.current < DOUBLE_TAP_DELAY) {
      // Prevent default to stop potential zoom/selection
      e.preventDefault();
    }
  }, []);

  const handleTitleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const now = Date.now();
      if (now - lastTitleTapRef.current < DOUBLE_TAP_DELAY) {
        // Double tap detected
        e.preventDefault();
        e.stopPropagation();
        if (!note.is_locked) {
          setIsEditingTitle(true);
        }
        lastTitleTapRef.current = 0;
      } else {
        lastTitleTapRef.current = now;
      }
    },
    [note.is_locked]
  );

  const handleContentDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!note.is_locked) {
        setIsEditingContent(true);
      }
    },
    [note.is_locked]
  );

  const handleContentTouchStart = useCallback((e: React.TouchEvent) => {
    // Don't stop propagation on start - just track
    const now = Date.now();
    if (now - lastContentTapRef.current < DOUBLE_TAP_DELAY) {
      // Prevent default to stop potential zoom/selection
      e.preventDefault();
    }
  }, []);

  const handleContentTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const now = Date.now();
      if (now - lastContentTapRef.current < DOUBLE_TAP_DELAY) {
        // Double tap detected
        e.preventDefault();
        e.stopPropagation();
        if (!note.is_locked) {
          setIsEditingContent(true);
        }
        lastContentTapRef.current = 0;
      } else {
        lastContentTapRef.current = now;
      }
    },
    [note.is_locked]
  );

  const handleTitleBlur = useCallback(() => {
    setIsEditingTitle(false);
    onUpdate(note.id, { title });
  }, [note.id, title, onUpdate]);

  const handleContentBlur = useCallback(() => {
    setIsEditingContent(false);
    onUpdate(note.id, {
      content: {
        blocks: [{ type: 'paragraph', content }],
      },
    });
  }, [note.id, content, onUpdate]);

  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsEditingTitle(false);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleTitleBlur();
      }
    },
    [handleTitleBlur]
  );

  const handleContentKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditingContent(false);
    }
  }, []);

  const toggleLock = useCallback(() => {
    onUpdate(note.id, { is_locked: !note.is_locked });
  }, [note.id, note.is_locked, onUpdate]);

  // Parse content and render references with styling
  const renderContentWithReferences = useCallback((text: string) => {
    // Match {{variableName}} pattern for references
    const referencePattern = /\{\{([^}]+)\}\}/g;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;

    while ((match = referencePattern.exec(text)) !== null) {
      // Add text before the reference
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      // Add styled reference - using colors that work in both light and dark mode
      parts.push(
        <span
          key={match.index}
          className="inline-flex items-center rounded bg-blue-500/20 px-1.5 py-0.5 font-mono text-xs font-semibold text-blue-700 dark:bg-blue-400/20 dark:text-blue-300"
          title={`Reference: ${match[1]}`}
        >
          {match[1]}
        </span>
      );
      lastIndex = match.index + match[0].length;
    }
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    return parts.length > 0 ? parts : text;
  }, []);

  const handleColorChange = useCallback(
    (color: string) => {
      onUpdate(note.id, { color });
    },
    [note.id, onUpdate]
  );

  const handleResize = useCallback(
    (_: unknown, params: { width: number; height: number }) => {
      onUpdate(note.id, { width: params.width, height: params.height });
    },
    [note.id, onUpdate]
  );

  const noteColors: Record<string, string> = {
    '#FFFFFF': 'bg-white',
    '#FFF9C4': 'bg-yellow-100',
    '#FFCCBC': 'bg-orange-100',
    '#F8BBD9': 'bg-pink-100',
    '#E1BEE7': 'bg-purple-100',
    '#C5CAE9': 'bg-indigo-100',
    '#BBDEFB': 'bg-blue-100',
    '#B2DFDB': 'bg-teal-100',
    '#C8E6C9': 'bg-green-100',
  };

  const bgClass = noteColors[note.color] || 'bg-white';

  return (
    <>
      {/* Node Resizer */}
      <NodeResizer
        minWidth={150}
        minHeight={100}
        isVisible={selected && !note.is_locked}
        lineClassName="!border-primary"
        handleClassName="!h-2 !w-2 !border-2 !border-primary !bg-background"
        onResize={handleResize}
      />

      {/* Target handles for receiving connections (rendered first = behind) */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        isConnectable={true}
        className="!h-3 !w-3 !border-2 !border-background !bg-primary"
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom"
        isConnectable={true}
        className="!h-3 !w-3 !border-2 !border-background !bg-primary"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        isConnectable={true}
        className="!h-3 !w-3 !border-2 !border-background !bg-primary"
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right"
        isConnectable={true}
        className="!h-3 !w-3 !border-2 !border-background !bg-primary"
      />
      {/* Source handles for starting connections (rendered last = on top) */}
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        isConnectable={true}
        className="!h-3 !w-3 !border-2 !border-background !bg-primary"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        isConnectable={true}
        className="!h-3 !w-3 !border-2 !border-background !bg-primary"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        isConnectable={true}
        className="!h-3 !w-3 !border-2 !border-background !bg-primary"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        isConnectable={true}
        className="!h-3 !w-3 !border-2 !border-background !bg-primary"
      />

      <div
        className={cn(
          'min-w-[150px] rounded-lg border shadow-sm transition-shadow',
          bgClass,
          selected && 'shadow-md ring-2 ring-primary',
          note.is_locked && 'opacity-80'
        )}
        style={{ width: note.width, minHeight: note.height }}
      >
        {/* Header */}
        <div className="flex items-center gap-1 rounded-t-lg border-b bg-black/5 px-2 py-1">
          <GripVertical className="h-4 w-4 cursor-grab text-gray-600" />

          {isEditingTitle ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              className="flex-1 bg-transparent text-sm font-medium text-gray-900 focus:outline-none"
              placeholder="Untitled"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className="nodrag flex-1 cursor-text truncate text-sm font-medium text-gray-900"
              onDoubleClick={handleTitleDoubleClick}
              onTouchStart={handleTitleTouchStart}
              onTouchEnd={handleTitleTouchEnd}
            >
              {note.title || 'Untitled'}
            </span>
          )}

          {note.is_locked && <Lock className="h-3 w-3 text-gray-500" />}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 hover:opacity-100 group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4 text-gray-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Palette className="mr-2 h-4 w-4" />
                  Color
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <div className="grid grid-cols-3 gap-1 p-2">
                      {NOTE_COLORS.map((color) => (
                        <button
                          key={color.value}
                          className={cn(
                            'h-6 w-6 rounded border-2 transition-all hover:scale-110',
                            color.bg,
                            note.color === color.value
                              ? 'border-primary ring-2 ring-primary/30'
                              : 'border-gray-300'
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleColorChange(color.value);
                          }}
                          title={color.label}
                        />
                      ))}
                    </div>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLock();
                }}
              >
                {note.is_locked ? (
                  <>
                    <Unlock className="mr-2 h-4 w-4" />
                    Unlock
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Lock
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(note.id);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content */}
        <div
          className="nodrag group p-3"
          onDoubleClick={handleContentDoubleClick}
          onTouchStart={handleContentTouchStart}
          onTouchEnd={handleContentTouchEnd}
        >
          {isEditingContent ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onBlur={handleContentBlur}
              onKeyDown={handleContentKeyDown}
              className="h-full min-h-[60px] w-full resize-none bg-transparent text-sm text-gray-900 focus:outline-none"
              placeholder="Type your note here... Use {{variable}} for references"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="cursor-text whitespace-pre-wrap text-sm text-gray-900">
              {content ? (
                renderContentWithReferences(content)
              ) : (
                <span className="italic text-gray-500">Double-tap to edit...</span>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
});

NoteNode.displayName = 'NoteNode';

export { NoteNode };
