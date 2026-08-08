'use client';

import { useMemo, useState } from 'react';
import { X, Search, LayoutGrid, FolderPlus, Folder, MoreHorizontal, Trash2, Pencil } from 'lucide-react';
import type { Board, BoardFolder } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface BoardStats {
  /** boardId -> note count, for the overview. */
  [boardId: string]: number;
}

interface BoardOverviewProps {
  boards: Board[];
  folders: BoardFolder[];
  activeBoardId: string | null;
  /** Note counts per board; missing entries render as "—" rather than 0. */
  stats: BoardStats;
  isLoadingStats: boolean;
  onClose: () => void;
  onSelect: (boardId: string) => void;
  onCreateFolder: (name: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  onMoveBoard: (boardId: string, folderId: string | null) => void;
}

export function BoardOverview({
  boards,
  folders,
  activeBoardId,
  stats,
  isLoadingStats,
  onClose,
  onSelect,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveBoard,
}: BoardOverviewProps) {
  const [search, setSearch] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [folderDraft, setFolderDraft] = useState('');

  const matching = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return boards;
    return boards.filter(
      (b) =>
        b.title.toLowerCase().includes(query) ||
        (b.description ?? '').toLowerCase().includes(query)
    );
  }, [boards, search]);

  // Group by folder, keeping unfiled boards in their own bucket at the end.
  const grouped = useMemo(() => {
    const byFolder = new Map<string | null, Board[]>();
    matching.forEach((board) => {
      const key = board.folder_id ?? null;
      byFolder.set(key, [...(byFolder.get(key) ?? []), board]);
    });

    const ordered: { folder: BoardFolder | null; boards: Board[] }[] = folders
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((folder) => ({ folder, boards: byFolder.get(folder.id) ?? [] }));

    ordered.push({ folder: null, boards: byFolder.get(null) ?? [] });
    return ordered;
  }, [matching, folders]);

  const submitFolder = () => {
    const name = newFolderName.trim();
    if (name) onCreateFolder(name);
    setNewFolderName('');
    setIsAddingFolder(false);
  };

  const renderBoard = (board: Board) => {
    const count = stats[board.id];
    return (
      <div
        key={board.id}
        className={cn(
          'group flex items-center gap-2 rounded-md border px-2 py-1.5',
          board.id === activeBoardId ? 'border-violet-500 bg-violet-500/10' : 'bg-card'
        )}
      >
        <button
          type="button"
          onClick={() => onSelect(board.id)}
          className="min-w-0 flex-1 text-left"
        >
          <p className="truncate text-sm font-medium">{board.title}</p>
          <p className="text-xs text-muted-foreground">
            {isLoadingStats ? '…' : count === undefined ? '—' : `${count} ${count === 1 ? 'note' : 'notes'}`}
          </p>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
              aria-label={`Move ${board.title}`}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Folder className="mr-2 h-4 w-4" />
                Move to folder
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => onMoveBoard(board.id, null)}>
                  No folder
                </DropdownMenuItem>
                {folders.length > 0 && <DropdownMenuSeparator />}
                {folders.map((folder) => (
                  <DropdownMenuItem key={folder.id} onClick={() => onMoveBoard(board.id, folder.id)}>
                    {folder.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  return (
    <div className="absolute left-4 top-4 z-20 flex max-h-[calc(100%-2rem)] w-80 flex-col rounded-lg border bg-background shadow-xl">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <LayoutGrid className="h-4 w-4 text-violet-500" />
          Boards
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-normal text-muted-foreground">
            {boards.length}
          </span>
        </h2>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose} aria-label="Close">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2 border-b p-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search boards..."
            className="h-8 pl-8 text-sm"
          />
        </div>

        {isAddingFolder ? (
          <div className="flex gap-1.5">
            <Input
              autoFocus
              value={newFolderName}
              maxLength={100}
              placeholder="Folder name"
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitFolder();
                if (e.key === 'Escape') setIsAddingFolder(false);
              }}
              className="h-7 text-sm"
            />
            <Button size="sm" className="h-7 text-xs" onClick={submitFolder}>
              Add
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-7 w-full gap-1.5 text-xs"
            onClick={() => setIsAddingFolder(true)}
          >
            <FolderPlus className="h-3.5 w-3.5" />
            New folder
          </Button>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-2">
        {matching.length === 0 && (
          <p className="px-1 py-6 text-center text-xs text-muted-foreground">
            No boards match &ldquo;{search}&rdquo;.
          </p>
        )}

        {grouped.map(({ folder, boards: folderBoards }) => {
          // Hide empty folders while searching, so results aren't buried.
          if (folderBoards.length === 0 && (search.trim() || !folder)) return null;

          return (
            <div key={folder?.id ?? '__unfiled__'} className="space-y-1.5">
              <div className="flex items-center gap-1.5 px-1">
                {folder ? (
                  renamingFolderId === folder.id ? (
                    <Input
                      autoFocus
                      value={folderDraft}
                      maxLength={100}
                      onChange={(e) => setFolderDraft(e.target.value)}
                      onBlur={() => {
                        if (folderDraft.trim()) onRenameFolder(folder.id, folderDraft.trim());
                        setRenamingFolderId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                        if (e.key === 'Escape') setRenamingFolderId(null);
                      }}
                      className="h-6 text-xs"
                    />
                  ) : (
                    <>
                      <Folder className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {folder.name}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 shrink-0"
                            aria-label={`Folder options for ${folder.name}`}
                          >
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setFolderDraft(folder.name);
                              setRenamingFolderId(folder.id);
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => onDeleteFolder(folder.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete folder
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )
                ) : (
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {folders.length > 0 ? 'Unfiled' : 'All boards'}
                  </span>
                )}
              </div>

              <div className="space-y-1">{folderBoards.map(renderBoard)}</div>

              {folder && folderBoards.length === 0 && (
                <p className="px-1 text-xs text-muted-foreground">Empty</p>
              )}
            </div>
          );
        })}
      </div>

      <p className="border-t px-3 py-2 text-xs text-muted-foreground">
        Deleting a folder keeps its boards — they move to Unfiled.
      </p>
    </div>
  );
}
