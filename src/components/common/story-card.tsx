'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { MoreHorizontal, Star, Archive, Trash2, Edit2, BookOpen, Calendar } from 'lucide-react';
import type { Story } from '@/types/database';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface StoryCardProps {
  story: Story;
  onToggleFavorite: (id: string) => void;
  onToggleArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
}

export function StoryCard({
  story,
  onToggleFavorite,
  onToggleArchive,
  onDelete,
  onRename,
}: StoryCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState(story.title);

  const handleRename = () => {
    if (newTitle.trim() && newTitle !== story.title) {
      onRename(story.id, newTitle.trim());
    }
    setIsRenameDialogOpen(false);
  };

  const handleDelete = () => {
    onDelete(story.id);
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <Card
        className={cn(
          'group relative flex h-full flex-col overflow-hidden transition-all duration-200 hover:shadow-lg hover:ring-2 hover:ring-primary/20',
          story.is_archived && 'opacity-60',
          story.is_favorite && 'ring-1 ring-yellow-400/30'
        )}
      >
        <Link href={`/board/${story.id}`} className="absolute inset-0 z-0" />

        {/* Gradient Header Background */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3 pt-6">
          <div className="min-w-0 flex-1 pr-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 shrink-0 text-primary" />
              <h3 className="truncate font-semibold leading-tight">{story.title}</h3>
            </div>
            {story.description && (
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                {story.description}
              </p>
            )}
          </div>

          <div className="z-10 flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-8 w-8 transition-all',
                story.is_favorite
                  ? 'text-yellow-500 hover:text-yellow-600'
                  : 'opacity-0 group-hover:opacity-100'
              )}
              onClick={(e) => {
                e.preventDefault();
                onToggleFavorite(story.id);
              }}
            >
              <Star className={cn('h-4 w-4', story.is_favorite && 'fill-current')} />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 transition-all group-hover:opacity-100"
                  onClick={(e) => e.preventDefault()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    setIsRenameDialogOpen(true);
                  }}
                >
                  <Edit2 className="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    onToggleArchive(story.id);
                  }}
                >
                  <Archive className="mr-2 h-4 w-4" />
                  {story.is_archived ? 'Unarchive' : 'Archive'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="mt-auto pb-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{formatDistanceToNow(new Date(story.updated_at), { addSuffix: true })}</span>
            </div>
            <div className="flex gap-1.5">
              {story.is_favorite && !story.is_archived && (
                <Badge
                  variant="secondary"
                  className="bg-yellow-100 text-xs text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500"
                >
                  Favorite
                </Badge>
              )}
              {story.is_archived && (
                <Badge variant="secondary" className="text-xs">
                  Archived
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Story</DialogTitle>
            <DialogDescription>Enter a new name for your story.</DialogDescription>
          </DialogHeader>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Story title"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Story</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{story.title}&rdquo;? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
