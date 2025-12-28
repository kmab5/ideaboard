'use client';

import { memo, useState, useCallback, useEffect } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getStraightPath,
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

    // Calculate path based on curvature type
    const pathParams = { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition };

    let edgePath: string;
    let labelX: number;
    let labelY: number;

    if (connection?.curvature === 'straight') {
      [edgePath, labelX, labelY] = getStraightPath(pathParams);
    } else {
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
            refX="9"
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
            refX="1"
            refY="5"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M10,0 L10,10 L0,5 z" fill={strokeColor} />
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
            >
              <span className="text-xs text-foreground">
                {connection?.label || (
                  <span className="italic text-muted-foreground">Double-click to edit...</span>
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
