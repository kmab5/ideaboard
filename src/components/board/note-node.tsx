'use client';

import { memo, useState, useCallback, useEffect, useRef } from 'react';
import { Handle, Position, type NodeProps, NodeResizer } from 'reactflow';
import {
  GripVertical,
  MoreHorizontal,
  Trash2,
  Lock,
  Unlock,
  Palette,
  ImagePlus,
  X,
} from 'lucide-react';
import Image from 'next/image';
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
import { MarkdownRenderer } from '@/components/common';
import { useHistoryStore } from '@/lib/store';

interface NoteNodeData {
  note: Note;
  onUpdate: (id: string, updates: Partial<Note>) => void;
  onDelete: (id: string) => void;
  onImageUpload?: (noteId: string, file: File) => Promise<string | null>;
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

// Helper to extract text content from blocks
const getTextContent = (noteContent: Note['content']): string => {
  if (!noteContent?.blocks?.length) return '';
  return noteContent.blocks
    .filter((block) => block.type === 'paragraph' || block.type === 'text')
    .map((block) => block.content as string)
    .join('\n\n');
};

// Helper to extract images from blocks
const getImages = (noteContent: Note['content']): string[] => {
  if (!noteContent?.blocks?.length) return [];
  return noteContent.blocks
    .filter((block) => block.type === 'image')
    .map((block) => block.content as string);
};

const NoteNode = memo(({ data, selected }: NodeProps<NoteNodeData>) => {
  const { note, onUpdate, onDelete, onImageUpload } = data;
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [title, setTitle] = useState(note.title || '');
  const [content, setContent] = useState(getTextContent(note.content));
  const [images, setImages] = useState<string[]>(getImages(note.content));

  // History tracking
  const { pushAction, isUndoingOrRedoing } = useHistoryStore();
  const editStartStateRef = useRef<{ title: string; content: Note['content'] } | null>(null);
  const resizeStartRef = useRef<{ width: number; height: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when note prop changes
  useEffect(() => {
    setTitle(note.title || '');
    setContent(getTextContent(note.content));
    setImages(getImages(note.content));
  }, [note.title, note.content]);

  // Touch double-tap detection refs
  const lastTitleTapRef = useRef<number>(0);
  const lastContentTapRef = useRef<number>(0);
  const DOUBLE_TAP_DELAY = 350; // ms - slightly longer for better detection

  const handleTitleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!note.is_locked) {
        // Capture initial state for undo
        editStartStateRef.current = { title: note.title || '', content: note.content };
        setIsEditingTitle(true);
      }
    },
    [note.is_locked, note.title, note.content]
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
          // Capture initial state for undo
          editStartStateRef.current = { title: note.title || '', content: note.content };
          setIsEditingTitle(true);
        }
        lastTitleTapRef.current = 0;
      } else {
        lastTitleTapRef.current = now;
      }
    },
    [note.is_locked, note.title, note.content]
  );

  const handleContentDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!note.is_locked) {
        // Capture initial state for undo
        editStartStateRef.current = { title: note.title || '', content: note.content };
        setIsEditingContent(true);
      }
    },
    [note.is_locked, note.title, note.content]
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
          // Capture initial state for undo
          editStartStateRef.current = { title: note.title || '', content: note.content };
          setIsEditingContent(true);
        }
        lastContentTapRef.current = 0;
      } else {
        lastContentTapRef.current = now;
      }
    },
    [note.is_locked, note.title, note.content]
  );

  const handleTitleBlur = useCallback(() => {
    setIsEditingTitle(false);

    // Track history if title actually changed and not during undo/redo
    const startState = editStartStateRef.current;
    if (startState && startState.title !== title && !isUndoingOrRedoing) {
      pushAction({
        type: 'UPDATE_NOTE',
        undo: {
          noteId: note.id,
          previousState: { title: startState.title },
        },
        redo: {
          noteId: note.id,
          newState: { title },
        },
      });
    }
    editStartStateRef.current = null;

    onUpdate(note.id, { title });
  }, [note.id, title, onUpdate, pushAction, isUndoingOrRedoing]);

  // Build blocks array from content and images
  const buildContentBlocks = useCallback((textContent: string, imageUrls: string[]) => {
    const blocks: Array<{ type: string; content: unknown }> = [];

    // Add text content as paragraph block
    if (textContent.trim()) {
      blocks.push({ type: 'paragraph', content: textContent });
    }

    // Add image blocks
    imageUrls.forEach((url) => {
      blocks.push({ type: 'image', content: url });
    });

    return { blocks };
  }, []);

  const handleContentBlur = useCallback(() => {
    setIsEditingContent(false);

    const newContent = buildContentBlocks(content, images);

    // Track history if content actually changed and not during undo/redo
    const startState = editStartStateRef.current;
    if (startState && !isUndoingOrRedoing) {
      const startText = getTextContent(startState.content);
      if (startText !== content) {
        pushAction({
          type: 'UPDATE_NOTE',
          undo: {
            noteId: note.id,
            previousState: { content: startState.content },
          },
          redo: {
            noteId: note.id,
            newState: { content: newContent },
          },
        });
      }
    }
    editStartStateRef.current = null;

    onUpdate(note.id, { content: newContent });
  }, [note.id, content, images, onUpdate, buildContentBlocks, pushAction, isUndoingOrRedoing]);

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

  const handleColorChange = useCallback(
    (color: string) => {
      // Track history for color change
      if (!isUndoingOrRedoing && note.color !== color) {
        pushAction({
          type: 'UPDATE_NOTE',
          undo: {
            noteId: note.id,
            previousState: { color: note.color },
          },
          redo: {
            noteId: note.id,
            newState: { color },
          },
        });
      }
      onUpdate(note.id, { color });
    },
    [note.id, note.color, onUpdate, pushAction, isUndoingOrRedoing]
  );

  // Handle resize start - capture initial size
  const handleResizeStart = useCallback(() => {
    resizeStartRef.current = { width: note.width, height: note.height };
  }, [note.width, note.height]);

  const handleResize = useCallback(
    (_: unknown, params: { width: number; height: number }) => {
      // Track history for resize
      const startSize = resizeStartRef.current;
      if (startSize && !isUndoingOrRedoing) {
        if (startSize.width !== params.width || startSize.height !== params.height) {
          pushAction({
            type: 'RESIZE_NOTE',
            undo: {
              noteId: note.id,
              previousState: { width: startSize.width, height: startSize.height },
            },
            redo: {
              noteId: note.id,
              newState: { width: params.width, height: params.height },
            },
          });
        }
      }
      resizeStartRef.current = null;
      onUpdate(note.id, { width: params.width, height: params.height });
    },
    [note.id, onUpdate, pushAction, isUndoingOrRedoing]
  );

  const handleAddImageClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !onImageUpload) return;

      const imageUrl = await onImageUpload(note.id, file);
      if (imageUrl) {
        const newImages = [...images, imageUrl];
        setImages(newImages);
        onUpdate(note.id, {
          content: buildContentBlocks(content, newImages),
        });
      }

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [note.id, images, content, onImageUpload, onUpdate, buildContentBlocks]
  );

  const handleRemoveImage = useCallback(
    (indexToRemove: number) => {
      const newImages = images.filter((_, i) => i !== indexToRemove);
      setImages(newImages);
      onUpdate(note.id, {
        content: buildContentBlocks(content, newImages),
      });
    },
    [note.id, images, content, onUpdate, buildContentBlocks]
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
      {/* Hidden file input for image uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        aria-label="Upload image"
      />

      {/* Node Resizer */}
      <NodeResizer
        minWidth={150}
        minHeight={100}
        isVisible={selected && !note.is_locked}
        lineClassName="!border-primary"
        handleClassName="!h-2 !w-2 !border-2 !border-primary !bg-background"
        onResizeStart={handleResizeStart}
        onResizeEnd={handleResize}
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
              {/* Add Image option */}
              {onImageUpload && (
                <>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddImageClick();
                    }}
                    disabled={note.is_locked}
                  >
                    <ImagePlus className="mr-2 h-4 w-4" />
                    Add Image
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}

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
              placeholder="Type your note here... Supports **Markdown**! Use {{variable}} for references"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="cursor-text text-sm text-gray-900">
              {content ? (
                <MarkdownRenderer content={content} />
              ) : (
                <span className="italic text-gray-500">Double-tap to edit...</span>
              )}
            </div>
          )}

          {/* Image attachments */}
          {images.length > 0 && (
            <div className="mt-2 space-y-2">
              {images.map((imageUrl, index) => (
                <div key={index} className="group/image relative">
                  <Image
                    src={imageUrl}
                    alt={`Attachment ${index + 1}`}
                    width={400}
                    height={300}
                    className="w-full rounded border object-cover"
                  />
                  {!note.is_locked && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage(index);
                      }}
                      className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover/image:opacity-100"
                      title="Remove image"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
});

NoteNode.displayName = 'NoteNode';

export { NoteNode };
