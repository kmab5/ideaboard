'use client';

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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ToolbarProps {
  zoom: number;
  showGrid: boolean;
  activeTool: 'select' | 'pan';
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onAddNote: () => void;
  onToolChange: (tool: 'select' | 'pan') => void;
  onToggleGrid: () => void;
  onManualSave?: () => void;
}

export function Toolbar({
  zoom,
  showGrid,
  activeTool,
  onZoomIn,
  onZoomOut,
  onFitView,
  onAddNote,
  onToolChange,
  onToggleGrid,
  onManualSave,
}: ToolbarProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="absolute left-4 top-4 z-10 flex items-center gap-1 rounded-lg border bg-background/95 p-1 shadow-sm backdrop-blur">
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
          <TooltipContent>Select (V)</TooltipContent>
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
          <TooltipContent>Pan (H)</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6" />

        {/* Add Note */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onAddNote}>
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add Note (N)</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6" />

        {/* Zoom Controls */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom Out (-)</TooltipContent>
        </Tooltip>

        <span className="w-12 text-center text-xs font-medium">{Math.round(zoom * 100)}%</span>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom In (+)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onFitView}>
              <Maximize className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Fit to Screen (0)</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6" />

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
          <TooltipContent>Toggle Grid (G)</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6" />

        {/* Manual Save Button */}
        {onManualSave && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onManualSave}>
                <Save className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Save (Ctrl+S)</TooltipContent>
          </Tooltip>
        )}

        {/* Autosave Indicator */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 px-2">
              <Cloud className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Autosaved</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>Changes are saved automatically</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
