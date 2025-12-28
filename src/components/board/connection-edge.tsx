'use client';

import { memo, useState, useCallback, useEffect, useRef } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getStraightPath,
  getSmoothStepPath,
  type EdgeProps,
} from 'reactflow';
import { Trash2, ArrowRight, ArrowLeftRight, Circle, Repeat2 } from 'lucide-react';
import type { Connection, LineStyle, ArrowType } from '@/types/database';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ConnectionEdgeData {
  connection: Connection;
  onUpdate: (id: string, updates: Partial<Connection>) => void;
  onDelete: (id: string) => void;
  showGrid?: boolean;
}

const ConnectionEdge = memo(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    selected,
  }: EdgeProps<ConnectionEdgeData>) => {
    const connection = data?.connection;
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [labelText, setLabelText] = useState(connection?.label || '');

    // Sync label when connection updates
    useEffect(() => {
      setLabelText(connection?.label || '');
    }, [connection?.label]);

    // Touch double-tap detection ref
    const lastTapRef = useRef<number>(0);
    const DOUBLE_TAP_DELAY = 300; // ms

    // Calculate path based on grid state (elbowed when grid on, curved when off)
    const pathParams = { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition };

    let edgePath: string;
    let labelX: number;
    let labelY: number;

    if (connection?.curvature === 'straight') {
      [edgePath, labelX, labelY] = getStraightPath(pathParams);
    } else if (data?.showGrid) {
      // Elbowed/orthogonal path when grid is shown
      [edgePath, labelX, labelY] = getSmoothStepPath({ ...pathParams, borderRadius: 8 });
    } else {
      // Curved path when grid is hidden
      [edgePath, labelX, labelY] = getBezierPath(pathParams);
    }

    // Style based on connection properties - dark mode aware with gray default
    const strokeColor = connection?.color || '#6b7280';
    const strokeWidth = connection?.thickness || 2;

    let strokeDasharray: string | undefined;
    if (connection?.style === 'dashed') {
      strokeDasharray = '8,4';
    } else if (connection?.style === 'dotted') {
      strokeDasharray = '2,4';
    }

    // Arrow markers based on arrow_type
    let markerEnd: string | undefined;
    let markerStart: string | undefined;

    if (connection?.arrow_type === 'single' || connection?.arrow_type === 'double') {
      markerEnd = `url(#arrow-end-${id})`;
    }
    if (connection?.arrow_type === 'double') {
      markerStart = `url(#arrow-start-${id})`;
    }

    const handleDoubleClick = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      setIsEditorOpen(true);
    }, []);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
      e.stopPropagation();
      const now = Date.now();
      if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
        // Double tap detected
        setIsEditorOpen(true);
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
      }
    }, []);

    const handleLabelChange = useCallback((value: string) => {
      setLabelText(value);
    }, []);

    const handleLabelSave = useCallback(() => {
      if (data?.onUpdate && connection) {
        data.onUpdate(connection.id, { label: labelText || null });
      }
    }, [data, connection, labelText]);

    const handleStyleChange = useCallback(
      (style: LineStyle) => {
        if (data?.onUpdate && connection) {
          data.onUpdate(connection.id, { style });
        }
      },
      [data, connection]
    );

    const handleColorChange = useCallback(
      (color: string) => {
        if (data?.onUpdate && connection) {
          data.onUpdate(connection.id, { color });
        }
      },
      [data, connection]
    );

    const handleThicknessChange = useCallback(
      (thickness: number) => {
        if (data?.onUpdate && connection) {
          data.onUpdate(connection.id, { thickness });
        }
      },
      [data, connection]
    );

    const handleArrowChange = useCallback(
      (arrowType: ArrowType) => {
        if (data?.onUpdate && connection) {
          data.onUpdate(connection.id, { arrow_type: arrowType });
        }
      },
      [data, connection]
    );

    // Flip connection direction - swap source and target
    const handleFlipDirection = useCallback(() => {
      if (data?.onUpdate && connection) {
        data.onUpdate(connection.id, {
          source_note_id: connection.target_note_id,
          target_note_id: connection.source_note_id,
          source_anchor: connection.target_anchor,
          target_anchor: connection.source_anchor,
        });
      }
    }, [data, connection]);

    const handleDelete = useCallback(() => {
      if (data?.onDelete && connection) {
        data.onDelete(connection.id);
      }
    }, [data, connection]);

    const handleCloseEditor = useCallback(() => {
      handleLabelSave();
      setIsEditorOpen(false);
    }, [handleLabelSave]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsEditorOpen(false);
        } else if (e.key === 'Enter') {
          handleCloseEditor();
        }
      },
      [handleCloseEditor]
    );

    return (
      <>
        {/* Arrow marker definitions */}
        <defs>
          <marker
            id={`arrow-end-${id}`}
            markerWidth="10"
            markerHeight="10"
            refX="8"
            refY="5"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,10 L10,5 z" fill={strokeColor} />
          </marker>
          <marker
            id={`arrow-start-${id}`}
            markerWidth="10"
            markerHeight="10"
            refX="2"
            refY="5"
            orient="auto-start-reverse"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,10 L10,5 z" fill={strokeColor} />
          </marker>
        </defs>

        <BaseEdge
          id={id}
          path={edgePath}
          style={{
            stroke: strokeColor,
            strokeWidth: selected ? strokeWidth + 1 : strokeWidth,
            strokeDasharray,
          }}
          markerStart={markerStart}
          markerEnd={markerEnd}
        />

        {/* Label or Editor */}
        <EdgeLabelRenderer>
          {isEditorOpen ? (
            // Full Editor Panel
            <div
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                pointerEvents: 'all',
              }}
              className="z-50 rounded-lg border bg-background p-3 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col gap-3">
                {/* Label Input */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Label
                  </label>
                  <Input
                    type="text"
                    value={labelText}
                    onChange={(e) => handleLabelChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="h-8 w-40 text-sm"
                    placeholder="Connection label..."
                    autoFocus
                  />
                </div>

                {/* Direction */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Direction
                  </label>
                  <div className="flex gap-1">
                    <Button
                      variant={connection?.arrow_type === 'none' ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleArrowChange('none')}
                      title="No arrow"
                    >
                      <Circle className="h-3 w-3" />
                    </Button>
                    <Button
                      variant={connection?.arrow_type === 'single' ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleArrowChange('single')}
                      title="Single arrow"
                    >
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                    <Button
                      variant={connection?.arrow_type === 'double' ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleArrowChange('double')}
                      title="Bidirectional arrows"
                    >
                      <ArrowLeftRight className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={handleFlipDirection}
                      title="Flip direction"
                    >
                      <Repeat2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Style */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Style
                  </label>
                  <div className="flex gap-1">
                    <Button
                      variant={connection?.style === 'solid' ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => handleStyleChange('solid')}
                    >
                      Solid
                    </Button>
                    <Button
                      variant={connection?.style === 'dashed' ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => handleStyleChange('dashed')}
                    >
                      Dashed
                    </Button>
                    <Button
                      variant={connection?.style === 'dotted' ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => handleStyleChange('dotted')}
                    >
                      Dotted
                    </Button>
                  </div>
                </div>

                {/* Color */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Color
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { color: '#6b7280', label: 'Gray' },
                      { color: '#ef4444', label: 'Red' },
                      { color: '#f97316', label: 'Orange' },
                      { color: '#eab308', label: 'Yellow' },
                      { color: '#22c55e', label: 'Green' },
                      { color: '#3b82f6', label: 'Blue' },
                      { color: '#8b5cf6', label: 'Purple' },
                      { color: '#ec4899', label: 'Pink' },
                    ].map(({ color, label }) => (
                      <button
                        key={color}
                        className={cn(
                          'h-6 w-6 rounded-full border-2 transition-transform hover:scale-110',
                          connection?.color === color
                            ? 'border-foreground ring-2 ring-foreground/20'
                            : 'border-transparent'
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => handleColorChange(color)}
                        title={label}
                      />
                    ))}
                  </div>
                </div>

                {/* Thickness */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Thickness
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((thickness) => (
                      <Button
                        key={thickness}
                        variant={connection?.thickness === thickness ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleThicknessChange(thickness)}
                        title={`${thickness}px`}
                      >
                        <div
                          className="rounded bg-current"
                          style={{ width: 16, height: thickness }}
                        />
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between border-t pt-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-7 gap-1 px-2 text-xs"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </Button>
                  <Button size="sm" className="h-7 px-3 text-xs" onClick={handleCloseEditor}>
                    Done
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            // Simple Label Display
            <div
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                pointerEvents: 'all',
              }}
              className={cn(
                'cursor-pointer rounded border bg-background px-2 py-1 text-xs font-medium transition-opacity',
                selected && 'ring-1 ring-primary',
                !connection?.label && 'opacity-0 hover:opacity-100'
              )}
              onDoubleClick={handleDoubleClick}
              onTouchEnd={handleTouchEnd}
            >
              <span className="text-xs text-foreground">
                {connection?.label || (
                  <span className="italic text-muted-foreground">Double-tap to edit...</span>
                )}
              </span>
            </div>
          )}
        </EdgeLabelRenderer>

        {/* Branch label for conditional notes */}
        {connection?.branch_label && (
          <EdgeLabelRenderer>
            <div
              style={{
                position: 'absolute',
                transform: `translate(-50%, -100%) translate(${sourceX}px, ${sourceY - 10}px)`,
                pointerEvents: 'none',
              }}
              className="rounded bg-muted px-1 py-0.5 text-xs text-muted-foreground"
            >
              {connection.branch_label}
            </div>
          </EdgeLabelRenderer>
        )}
      </>
    );
  }
);

ConnectionEdge.displayName = 'ConnectionEdge';

export { ConnectionEdge };
