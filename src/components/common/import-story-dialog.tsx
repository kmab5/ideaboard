'use client';

import { useRef, useState } from 'react';
import { Upload, Loader2, FileJson, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { readStoryExportFile } from '@/lib/story-transfer';
import { EXPORT_FILE_EXTENSION, type StoryExport } from '@/lib/export-import';

interface ImportStoryDialogProps {
  /** Resolves once the story has been created. */
  onImport: (doc: StoryExport, title: string) => Promise<void>;
  /** Titles already in use, so we can warn about duplicates before importing. */
  existingTitles?: string[];
}

export function ImportStoryDialog({ onImport, existingTitles = [] }: ImportStoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [doc, setDoc] = useState<StoryExport | null>(null);
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setDoc(null);
    setTitle('');
    setError(null);
    setIsImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      const parsed = await readStoryExportFile(file);
      setDoc(parsed);
      setTitle(parsed.story.title);
    } catch (err) {
      setDoc(null);
      setError(err instanceof Error ? err.message : 'Could not read that file.');
    }
  };

  const handleImport = async () => {
    if (!doc) return;
    setIsImporting(true);
    try {
      await onImport(doc, title.trim() || doc.story.title);
      setOpen(false);
      reset();
    } catch {
      // The caller surfaces its own error toast; keep the dialog open so the
      // person can retry without re-picking the file.
      setIsImporting(false);
    }
  };

  const isDuplicateTitle = existingTitles.some(
    (t) => t.trim().toLowerCase() === title.trim().toLowerCase()
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <Upload className="h-4 w-4" />
        Import
      </Button>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import a story</DialogTitle>
          <DialogDescription>
            Choose a story export ({EXPORT_FILE_EXTENSION}). It&apos;s always imported as a new
            story, so nothing you already have is overwritten.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="import-file">Export file</Label>
            <Input
              id="import-file"
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <p className="text-destructive">{error}</p>
            </div>
          )}

          {doc && (
            <div className="space-y-3 rounded-md border bg-muted/40 p-3">
              <div className="flex items-center gap-2">
                <FileJson className="h-4 w-4 shrink-0 text-violet-500" />
                <p className="text-sm font-medium">Ready to import</p>
              </div>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <dt>Boards</dt>
                <dd className="text-right font-mono">{doc.manifest.counts.boards}</dd>
                <dt>Notes</dt>
                <dd className="text-right font-mono">{doc.manifest.counts.notes}</dd>
                <dt>Connections</dt>
                <dd className="text-right font-mono">{doc.manifest.counts.connections}</dd>
                <dt>Containers</dt>
                <dd className="text-right font-mono">{doc.manifest.counts.containers}</dd>
                <dt>Components</dt>
                <dd className="text-right font-mono">{doc.manifest.counts.components}</dd>
              </dl>

              <div className="space-y-1.5">
                <Label htmlFor="import-title">Story title</Label>
                <Input
                  id="import-title"
                  value={title}
                  maxLength={255}
                  onChange={(e) => setTitle(e.target.value)}
                />
                {isDuplicateTitle && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    You already have a story with this title. Importing will create a second one.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isImporting}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!doc || !title.trim() || isImporting}>
            {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import story
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
