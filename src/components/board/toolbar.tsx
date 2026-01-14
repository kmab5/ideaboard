'use client';

import { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Plus,
  MousePointer2,
  Hand,
  Grid3X3,
  Cloud,
  Save,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Undo2,
  Redo2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ToolbarProps {
  zoom: number;
  showGrid: boolean;
  activeTool: 'select' | 'pan';
  canUndo: boolean;
  canRedo: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onAddNote: () => void;
  onAddDrawing: () => void;
  onToolChange: (tool: 'select' | 'pan') => void;
  onToggleGrid: () => void;
  onManualSave?: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

export function Toolbar({
  zoom,
  showGrid,
  activeTool,
  canUndo,
  canRedo,
  onZoomIn,
  onZoomOut,
  onFitView,
  onAddNote,
  onAddDrawing,
  onToolChange,
  onToggleGrid,
  onManualSave,
  onUndo,
  onRedo,
}: ToolbarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          'absolute left-4 top-4 z-10 flex flex-col items-center gap-1 rounded-lg border bg-background/95 p-1 shadow-sm backdrop-blur transition-all duration-300',
          isCollapsed && 'p-1'
        )}
      >
        {/* Collapse Toggle Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {isCollapsed ? 'Expand Toolbar' : 'Collapse Toolbar'}
          </TooltipContent>
        </Tooltip>

        {/* Collapsible Content */}
        <div
          className={cn(
            'flex flex-col items-center gap-1 overflow-hidden transition-all duration-300',
            isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'
          )}
        >
          <Separator orientation="horizontal" className="w-6" />

          {/* Undo/Redo */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onUndo}
                disabled={!canUndo}
              >
                <Undo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Undo (Ctrl+Z)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onRedo}
                disabled={!canRedo}
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Redo (Ctrl+Shift+Z)</TooltipContent>
          </Tooltip>

          <Separator orientation="horizontal" className="w-6" />

          {/* Tools */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activeTool === 'select' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => onToolChange('select')}
              >
                <MousePointer2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Select (V)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activeTool === 'pan' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => onToolChange('pan')}
              >
                <Hand className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Pan (H)</TooltipContent>
          </Tooltip>

          <Separator orientation="horizontal" className="w-6" />

          {/* Add Note */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onAddNote}>
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Add Note (N)</TooltipContent>
          </Tooltip>

          {/* Add Drawing */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onAddDrawing}>
                <Pencil className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Add Drawing (D)</TooltipContent>
          </Tooltip>

          <Separator orientation="horizontal" className="w-6" />

          {/* Zoom Controls */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Zoom In (+)</TooltipContent>
          </Tooltip>

          <span className="w-8 text-center text-xs font-medium">{Math.round(zoom * 100)}%</span>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Zoom Out (-)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onFitView}>
                <Maximize className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Fit to Screen (0)</TooltipContent>
          </Tooltip>

          <Separator orientation="horizontal" className="w-6" />

          {/* Grid Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showGrid ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={onToggleGrid}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Toggle Grid (G)</TooltipContent>
          </Tooltip>

          <Separator orientation="horizontal" className="w-6" />

          {/* Manual Save Button */}
          {onManualSave && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onManualSave}>
                  <Save className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Save (Ctrl+S)</TooltipContent>
            </Tooltip>
          )}

          {/* Autosave Indicator */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex flex-col items-center gap-0.5 py-1">
                <Cloud className="h-4 w-4 text-green-500" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">Changes are saved automatically</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
