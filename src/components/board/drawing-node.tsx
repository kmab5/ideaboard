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
  Eraser,
  Pencil,
} from 'lucide-react';
import type { Note, DrawingData } from '@/types/database';
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

interface DrawingNodeData {
  note: Note;
  onUpdate: (id: string, updates: Partial<Note>) => void;
  onDelete: (id: string) => void;
}

// Stroke colors
const STROKE_COLORS = [
  { value: '#000000', label: 'Black' },
  { value: '#EF4444', label: 'Red' },
  { value: '#F97316', label: 'Orange' },
  { value: '#EAB308', label: 'Yellow' },
  { value: '#22C55E', label: 'Green' },
  { value: '#3B82F6', label: 'Blue' },
  { value: '#8B5CF6', label: 'Purple' },
  { value: '#EC4899', label: 'Pink' },
];

// Stroke widths
const STROKE_WIDTHS = [2, 4, 6, 8, 10];

// Background colors for the drawing canvas
const CANVAS_COLORS = [
  { value: '#FFFFFF', label: 'White', bg: 'bg-white' },
  { value: '#FFF9C4', label: 'Yellow', bg: 'bg-yellow-100' },
  { value: '#BBDEFB', label: 'Blue', bg: 'bg-blue-100' },
  { value: '#C8E6C9', label: 'Green', bg: 'bg-green-100' },
  { value: '#F8BBD9', label: 'Pink', bg: 'bg-pink-100' },
];

interface Point {
  x: number;
  y: number;
  pressure?: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
}

const DrawingNode = memo(({ data, selected }: NodeProps<DrawingNodeData>) => {
  const { note, onUpdate, onDelete } = data;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [strokes, setStrokes] = useState<Stroke[]>(() => {
    return (note.drawing_data?.strokes as Stroke[]) || [];
  });
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');

  // Sync strokes from note prop
  useEffect(() => {
    if (note.drawing_data?.strokes) {
      setStrokes(note.drawing_data.strokes as Stroke[]);
    }
  }, [note.drawing_data]);

  // Redraw canvas when strokes change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all strokes
    strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;

      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });

    // Draw current stroke
    if (currentStroke.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : strokeColor;
      ctx.lineWidth = tool === 'eraser' ? strokeWidth * 3 : strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.moveTo(currentStroke[0].x, currentStroke[0].y);
      for (let i = 1; i < currentStroke.length; i++) {
        ctx.lineTo(currentStroke[i].x, currentStroke[i].y);
      }
      ctx.stroke();
    }
  }, [strokes, currentStroke, strokeColor, strokeWidth, tool]);

  const getCanvasPoint = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      if ('touches' in e) {
        const touch = e.touches[0];
        return {
          x: (touch.clientX - rect.left) * scaleX,
          y: (touch.clientY - rect.top) * scaleY,
        };
      }

      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    []
  );

  const handlePointerDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!isEditMode || note.is_locked) return;
      e.stopPropagation();
      setIsDrawing(true);
      const point = getCanvasPoint(e);
      setCurrentStroke([point]);
    },
    [isEditMode, note.is_locked, getCanvasPoint]
  );

  const handlePointerMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDrawing || !isEditMode) return;
      e.stopPropagation();
      const point = getCanvasPoint(e);
      setCurrentStroke((prev) => [...prev, point]);
    },
    [isDrawing, isEditMode, getCanvasPoint]
  );

  const handlePointerUp = useCallback(() => {
    if (!isDrawing || currentStroke.length < 2) {
      setIsDrawing(false);
      setCurrentStroke([]);
      return;
    }

    const newStroke: Stroke = {
      points: currentStroke,
      color: tool === 'eraser' ? '#FFFFFF' : strokeColor,
      width: tool === 'eraser' ? strokeWidth * 3 : strokeWidth,
    };

    const newStrokes = [...strokes, newStroke];
    setStrokes(newStrokes);
    setCurrentStroke([]);
    setIsDrawing(false);

    // Save to database
    const drawingData: DrawingData = {
      strokes: newStrokes,
    };
    onUpdate(note.id, { drawing_data: drawingData });
  }, [isDrawing, currentStroke, strokes, strokeColor, strokeWidth, tool, note.id, onUpdate]);

  const handleClear = useCallback(() => {
    setStrokes([]);
    const drawingData: DrawingData = { strokes: [] };
    onUpdate(note.id, { drawing_data: drawingData });
  }, [note.id, onUpdate]);

  const toggleLock = useCallback(() => {
    onUpdate(note.id, { is_locked: !note.is_locked });
  }, [note.id, note.is_locked, onUpdate]);

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

  const canvasColors: Record<string, string> = {
    '#FFFFFF': 'bg-white',
    '#FFF9C4': 'bg-yellow-100',
    '#BBDEFB': 'bg-blue-100',
    '#C8E6C9': 'bg-green-100',
    '#F8BBD9': 'bg-pink-100',
  };

  const bgClass = canvasColors[note.color] || 'bg-white';

  return (
    <>
      {/* Node Resizer */}
      <NodeResizer
        minWidth={200}
        minHeight={150}
        isVisible={selected && !note.is_locked}
        lineClassName="!border-primary"
        handleClassName="!h-2 !w-2 !border-2 !border-primary !bg-background"
        onResize={handleResize}
      />

      {/* Target handles */}
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
      {/* Source handles */}
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
          'min-w-[200px] rounded-lg border shadow-sm transition-shadow',
          bgClass,
          selected && 'shadow-md ring-2 ring-primary',
          note.is_locked && 'opacity-80'
        )}
        style={{ width: note.width, minHeight: note.height }}
      >
        {/* Header */}
        <div className="flex items-center gap-1 rounded-t-lg border-b bg-black/5 px-2 py-1">
          <GripVertical className="h-4 w-4 cursor-grab text-gray-600" />

          <span className="flex-1 text-sm font-medium text-gray-900">
            {note.title || 'Drawing'}
          </span>

          {note.is_locked && <Lock className="h-3 w-3 text-gray-500" />}

          {/* Drawing mode indicator */}
          {isEditMode && (
            <span className="rounded bg-primary/20 px-1.5 py-0.5 text-xs font-medium text-primary">
              Drawing
            </span>
          )}

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
              {/* Edit Mode Toggle */}
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditMode(!isEditMode);
                }}
                disabled={note.is_locked}
              >
                <Pencil className="mr-2 h-4 w-4" />
                {isEditMode ? 'Exit Drawing Mode' : 'Enter Drawing Mode'}
              </DropdownMenuItem>

              {isEditMode && (
                <>
                  <DropdownMenuSeparator />
                  {/* Tool Selection */}
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setTool('pen');
                    }}
                    className={tool === 'pen' ? 'bg-accent' : ''}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Pen
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setTool('eraser');
                    }}
                    className={tool === 'eraser' ? 'bg-accent' : ''}
                  >
                    <Eraser className="mr-2 h-4 w-4" />
                    Eraser
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {/* Stroke Color */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <div
                        className="mr-2 h-4 w-4 rounded-full border"
                        style={{ backgroundColor: strokeColor }}
                      />
                      Stroke Color
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        <div className="grid grid-cols-4 gap-1 p-2">
                          {STROKE_COLORS.map((color) => (
                            <button
                              key={color.value}
                              className={cn(
                                'h-6 w-6 rounded-full border-2 transition-all hover:scale-110',
                                strokeColor === color.value
                                  ? 'border-primary ring-2 ring-primary/30'
                                  : 'border-gray-300'
                              )}
                              style={{ backgroundColor: color.value }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setStrokeColor(color.value);
                              }}
                              title={color.label}
                            />
                          ))}
                        </div>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>

                  {/* Stroke Width */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <div className="mr-2 flex h-4 w-4 items-center justify-center">
                        <div
                          className="rounded-full bg-foreground"
                          style={{ width: strokeWidth, height: strokeWidth }}
                        />
                      </div>
                      Stroke Width
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        <div className="flex gap-2 p-2">
                          {STROKE_WIDTHS.map((width) => (
                            <button
                              key={width}
                              className={cn(
                                'flex h-8 w-8 items-center justify-center rounded border transition-all hover:bg-accent',
                                strokeWidth === width && 'border-primary bg-accent'
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                setStrokeWidth(width);
                              }}
                              title={`${width}px`}
                            >
                              <div
                                className="rounded-full bg-foreground"
                                style={{ width: width, height: width }}
                              />
                            </button>
                          ))}
                        </div>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>

                  <DropdownMenuSeparator />

                  {/* Clear Drawing */}
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClear();
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Eraser className="mr-2 h-4 w-4" />
                    Clear Drawing
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator />

              {/* Canvas Color */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Palette className="mr-2 h-4 w-4" />
                  Canvas Color
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <div className="grid grid-cols-3 gap-1 p-2">
                      {CANVAS_COLORS.map((color) => (
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

        {/* Canvas */}
        <div
          className={cn('nodrag relative p-1', isEditMode && 'cursor-crosshair')}
          onDoubleClick={(e) => {
            e.stopPropagation();
            if (!note.is_locked) {
              setIsEditMode(true);
            }
          }}
        >
          <canvas
            ref={canvasRef}
            width={Math.max(note.width - 10, 190)}
            height={Math.max(note.height - 50, 100)}
            className={cn('rounded border', isEditMode ? 'border-primary' : 'border-transparent')}
            style={{
              width: '100%',
              height: note.height - 50,
              touchAction: isEditMode ? 'none' : 'auto',
            }}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
          />
          {!isEditMode && strokes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-sm italic text-gray-500">
              Double-click to draw...
            </div>
          )}
        </div>
      </div>
    </>
  );
});

DrawingNode.displayName = 'DrawingNode';

export { DrawingNode };
