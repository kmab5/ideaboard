'use client';

import { useState } from 'react';
import { Plus, MoreHorizontal, Pencil, Trash2, Copy } from 'lucide-react';
import type { Board } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface BoardTabsProps {
  boards: Board[];
  activeBoardId: string | null;
  onSelect: (boardId: string) => void;
  onCreate: (title: string) => void;
  onRename: (boardId: string, title: string) => void;
  onDelete: (boardId: string) => void;
  onDuplicate: (boardId: string) => void;
}

export function BoardTabs({
  boards,
  activeBoardId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  onDuplicate,
}: BoardTabsProps) {
  const [dialog, setDialog] = useState<
    { mode: 'create' } | { mode: 'rename'; board: Board } | { mode: 'delete'; board: Board } | null
  >(null);
  const [titleValue, setTitleValue] = useState('');

  const openCreate = () => {
    setTitleValue('');
    setDialog({ mode: 'create' });
  };

  const openRename = (board: Board) => {
    setTitleValue(board.title);
    setDialog({ mode: 'rename', board });
  };

  const submitTitle = () => {
    const title = titleValue.trim();
    if (!title || !dialog) return;
    if (dialog.mode === 'create') onCreate(title);
    if (dialog.mode === 'rename') onRename(dialog.board.id, title);
    setDialog(null);
  };

  // The last board can't be deleted — a story always has at least one board.
  const canDelete = boards.length > 1;

  return (
    <>
      <div className="flex items-center gap-1 overflow-x-auto border-b bg-muted/30 px-2 py-1">
        {boards.map((board) => {
          const isActive = board.id === activeBoardId;
          return (
            <div
              key={board.id}
              className={cn(
                'group flex shrink-0 items-center gap-0.5 rounded-t-md border-b-2 px-1 transition-colors',
                isActive
                  ? 'border-violet-500 bg-background'
                  : 'border-transparent hover:bg-background/60'
              )}
            >
              <button
                type="button"
                onClick={() => onSelect(board.id)}
                onDoubleClick={() => openRename(board)}
                className={cn(
                  'max-w-[10rem] truncate px-2 py-1.5 text-sm',
                  isActive ? 'font-medium' : 'text-muted-foreground'
                )}
                title={board.title}
              >
                {board.title}
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100',
                      isActive && 'opacity-100'
                    )}
                    aria-label={`Board options for ${board.title}`}
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => openRename(board)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDuplicate(board.id)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    disabled={!canDelete}
                    onClick={() => canDelete && setDialog({ mode: 'delete', board })}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={openCreate}
          aria-label="New board"
          title="New board"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Create / rename */}
      <Dialog
        open={dialog?.mode === 'create' || dialog?.mode === 'rename'}
        onOpenChange={(open) => !open && setDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog?.mode === 'create' ? 'New board' : 'Rename board'}</DialogTitle>
            <DialogDescription>
              {dialog?.mode === 'create'
                ? 'Boards let you split a story across separate canvases. Components are shared across every board in the story.'
                : 'Give this board a clearer name.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="board-title">Title</Label>
            <Input
              id="board-title"
              autoFocus
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitTitle()}
              placeholder="e.g. Act 1, Side Quests, Characters"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button onClick={submitTitle} disabled={!titleValue.trim()}>
              {dialog?.mode === 'create' ? 'Create board' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={dialog?.mode === 'delete'}
        onOpenChange={(open) => !open && setDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Delete &ldquo;{dialog?.mode === 'delete' ? dialog.board.title : ''}&rdquo;?
            </DialogTitle>
            <DialogDescription>
              This permanently deletes the board and every note, drawing, and connection on it. Your
              story&apos;s components are not affected. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (dialog?.mode === 'delete') onDelete(dialog.board.id);
                setDialog(null);
              }}
            >
              Delete board
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
