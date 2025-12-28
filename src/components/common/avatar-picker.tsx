'use client';

import { useState, useCallback, useRef } from 'react';
import { createAvatar } from '@dicebear/core';
import {
  adventurer,
  avataaars,
  bottts,
  funEmoji,
  lorelei,
  micah,
  miniavs,
  personas,
} from '@dicebear/collection';
import { RefreshCw, Check, Upload, Loader2 } from 'lucide-react';
import type { DicebearStyle, AvatarType } from '@/types/database';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const DICEBEAR_STYLES: { value: DicebearStyle; label: string; style: unknown }[] = [
  { value: 'adventurer', label: 'Adventurer', style: adventurer },
  { value: 'avataaars', label: 'Avataaars', style: avataaars },
  { value: 'bottts', label: 'Bottts', style: bottts },
  { value: 'fun-emoji', label: 'Fun Emoji', style: funEmoji },
  { value: 'lorelei', label: 'Lorelei', style: lorelei },
  { value: 'micah', label: 'Micah', style: micah },
  { value: 'miniavs', label: 'Miniavs', style: miniavs },
  { value: 'personas', label: 'Personas', style: personas },
];

interface AvatarPickerProps {
  currentStyle: DicebearStyle;
  currentSeed: string | null;
  currentAvatarUrl?: string | null;
  avatarType?: AvatarType;
  onSelect: (style: DicebearStyle, seed: string) => void;
  onUpload?: (file: File) => void;
  isLoading?: boolean;
}

export function AvatarPicker({
  currentStyle,
  currentSeed,
  currentAvatarUrl,
  avatarType = 'dicebear',
  onSelect,
  onUpload,
  isLoading = false,
}: AvatarPickerProps) {
  const [selectedStyle, setSelectedStyle] = useState<DicebearStyle>(currentStyle);
  const [seed, setSeed] = useState(currentSeed || generateSeed());
  const [activeTab, setActiveTab] = useState<string>(
    avatarType === 'custom' ? 'upload' : 'generate'
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  function generateSeed(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  const generateAvatar = useCallback((style: DicebearStyle, avatarSeed: string) => {
    const styleConfig = DICEBEAR_STYLES.find((s) => s.value === style);
    if (!styleConfig) return '';

    const avatar = createAvatar(styleConfig.style as Parameters<typeof createAvatar>[0], {
      seed: avatarSeed,
      size: 128,
    });

    return avatar.toDataUri();
  }, []);

  const handleRandomize = useCallback(() => {
    const newSeed = generateSeed();
    setSeed(newSeed);
  }, []);

  const handleStyleSelect = useCallback((style: DicebearStyle) => {
    setSelectedStyle(style);
  }, []);

  const handleConfirm = useCallback(() => {
    onSelect(selectedStyle, seed);
  }, [selectedStyle, seed, onSelect]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && onUpload) {
        onUpload(file);
      }
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [onUpload]
  );

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const previewUrl = generateAvatar(selectedStyle, seed);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid h-10 w-full grid-cols-2">
        <TabsTrigger value="generate" className="text-sm">
          Generate
        </TabsTrigger>
        <TabsTrigger value="upload" className="text-sm">
          Upload
        </TabsTrigger>
      </TabsList>

      <TabsContent value="generate" className="space-y-4 pt-4">
        {/* Preview */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element -- data URI doesn't benefit from next/image */}
            <img
              src={previewUrl}
              alt="Avatar preview"
              className="h-24 w-24 rounded-full border-4 border-background shadow-lg"
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleRandomize} disabled={isLoading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Randomize
          </Button>
        </div>

        {/* Style Selection */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Choose a style</label>
          <div className="grid grid-cols-4 gap-1.5">
            {DICEBEAR_STYLES.map((style) => {
              const avatarUrl = generateAvatar(style.value, seed);
              return (
                <button
                  key={style.value}
                  type="button"
                  onClick={() => handleStyleSelect(style.value)}
                  disabled={isLoading}
                  className={cn(
                    'relative rounded-lg border-2 p-1.5 transition-all hover:border-primary/50',
                    selectedStyle === style.value
                      ? 'border-primary bg-primary/5'
                      : 'border-transparent bg-muted'
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- data URI doesn't benefit from next/image */}
                  <img src={avatarUrl} alt={style.label} className="aspect-square w-full rounded" />
                  {selectedStyle === style.value && (
                    <div className="absolute right-0.5 top-0.5 rounded-full bg-primary p-0.5 text-primary-foreground">
                      <Check className="h-2.5 w-2.5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Confirm Button */}
        <Button onClick={handleConfirm} className="w-full" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save Avatar
        </Button>
      </TabsContent>

      <TabsContent value="upload" className="space-y-4 pt-4">
        {/* Current Custom Avatar Preview */}
        <div className="flex flex-col items-center gap-3">
          {avatarType === 'custom' && currentAvatarUrl ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- user uploaded image */}
              <img
                src={currentAvatarUrl}
                alt="Current avatar"
                className="h-24 w-24 rounded-full border-4 border-background object-cover shadow-lg"
              />
              <div className="absolute -bottom-1 -right-1 rounded-full bg-green-500 p-1 text-white">
                <Check className="h-3 w-3" />
              </div>
            </div>
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-dashed border-muted-foreground/25 bg-muted">
              <Upload className="h-8 w-8 text-muted-foreground/50" />
            </div>
          )}
        </div>

        {/* Upload Area */}
        <div
          onClick={handleUploadClick}
          className="cursor-pointer rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 text-center transition-colors hover:border-primary/50 hover:bg-muted/50"
        >
          <input
            ref={fileInputRef}
            type="file"
            title="Upload avatar"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleFileChange}
            className="hidden"
          />
          <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium">Click to upload</p>
          <p className="mt-1 text-xs text-muted-foreground">PNG or JPG (max 512KB)</p>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading...
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
