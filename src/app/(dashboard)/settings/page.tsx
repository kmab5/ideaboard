'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Loader2, User, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/lib/store';
import { profileUpdateSchema, type ProfileUpdateInput } from '@/lib/validations';
import type { DicebearStyle } from '@/types/database';
import { generateDicebearDataUri } from '@/lib/avatar';
import { validateImageFile, safeExtensionForType, AVATAR_MAX_BYTES } from '@/lib/upload';
import { ensureProfile } from '@/lib/profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AvatarPicker } from '@/components/common/avatar-picker';
import { PageLoader } from '@/components/common';
import { toast } from 'sonner';

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();
  const { user, profile, setProfile, setUser } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Permanently delete the account. The server route derives the target user
  // from the session, so no identifier is sent from the client.
  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch('/api/account/delete', { method: 'POST' });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(result.error ?? 'Failed to delete account');
        return;
      }

      toast.success('Your account has been deleted');
      setUser(null);
      setProfile(null);
      router.push('/');
    } catch (error) {
      console.error('Account deletion failed:', error);
      toast.error('Failed to delete account');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      display_name: '',
      bio: '',
    },
  });

  // Initialize user and profile
  useEffect(() => {
    const initializeData = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (authUser) {
          setUser({ id: authUser.id, email: authUser.email! });
          setIsEmailVerified(authUser.email_confirmed_at != null);

          const profileData = await ensureProfile(supabase, authUser);
          if (profileData) {
            setProfile(profileData);
            reset({
              display_name: profileData.display_name,
              bio: profileData.bio || '',
            });
          }
        }
      } catch (error) {
        console.error('Error initializing data:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeData();
  }, [supabase, setUser, setProfile, reset]);

  const onSubmit = async (data: ProfileUpdateInput) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: data.display_name,
          bio: data.bio,
        })
        .eq('id', user.id);

      if (error) throw error;

      setProfile({
        ...profile!,
        display_name: data.display_name!,
        bio: data.bio || null,
      });

      toast.success('Profile updated!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarSelect = async (style: DicebearStyle, seed: string) => {
    if (!user) return;

    const avatarUrl = generateDicebearDataUri(style, seed);

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          avatar_type: 'dicebear',
          dicebear_style: style,
          dicebear_seed: seed,
          avatar_url: avatarUrl,
        })
        .eq('id', user.id);

      if (error) throw error;

      setProfile({
        ...profile!,
        avatar_type: 'dicebear',
        dicebear_style: style,
        dicebear_seed: seed,
        avatar_url: avatarUrl,
      });

      toast.success('Avatar updated!');
    } catch (error) {
      console.error('Error updating avatar:', error);
      toast.error('Failed to update avatar');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomAvatarUpload = async (file: File) => {
    if (!user) return;

    // Validate file (bucket-level limits must mirror this).
    const validation = validateImageFile(file, AVATAR_MAX_BYTES);
    if (!validation.valid) {
      toast.error(validation.error ?? 'Invalid image');
      return;
    }

    setIsLoading(true);
    try {
      // Upload to Supabase Storage
      // Path format: {user_id}/avatar-{timestamp}.{ext} - matches storage policy
      const fileExt = safeExtensionForType(file.type);
      const filePath = `${user.id}/avatar-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        if (uploadError.message?.includes('bucket') || uploadError.message?.includes('not found')) {
          toast.error('Avatar storage not configured. Please contact support.');
        } else if (uploadError.message?.includes('policy')) {
          toast.error('Permission denied. Please try again.');
        } else {
          toast.error(`Upload failed: ${uploadError.message}`);
        }
        return;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_type: 'custom',
          avatar_url: publicUrl,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile({
        ...profile!,
        avatar_type: 'custom',
        avatar_url: publicUrl,
      });

      toast.success('Avatar uploaded!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isInitialized) {
    return <PageLoader />;
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 transition-all duration-300 ease-in-out sm:px-6 sm:py-8 md:px-8 lg:px-12">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold tracking-tight transition-all duration-300 sm:text-3xl">
          Settings
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground transition-all duration-300 sm:mt-2 sm:text-base">
          Manage your account and preferences
        </p>
      </div>

      <div className="grid gap-4 transition-all duration-300 ease-in-out sm:gap-6 lg:grid-cols-[1fr,minmax(280px,360px)]">
        {/* Left Column - Profile and Account */}
        <div className="space-y-4 sm:space-y-6">
          {/* Profile Section */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-primary" />
                Profile
              </CardTitle>
              <CardDescription>Update your display name and bio</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="display_name" className="font-medium">
                    Display Name
                  </Label>
                  <Input
                    id="display_name"
                    placeholder="Your display name"
                    disabled={isLoading}
                    {...register('display_name')}
                  />
                  {errors.display_name && (
                    <p className="text-sm text-destructive">{errors.display_name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="font-medium">
                    Bio
                  </Label>
                  <Input
                    id="bio"
                    placeholder="Tell us about yourself"
                    disabled={isLoading}
                    {...register('bio')}
                  />
                  {errors.bio && <p className="text-sm text-destructive">{errors.bio.message}</p>}
                </div>

                <Button type="submit" disabled={isLoading || !isDirty} className="mt-2">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="text-lg">Account</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3">
                <div className="flex-1">
                  <Label className="text-sm text-muted-foreground">Email</Label>
                  <p className="font-medium">{user?.email}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {isEmailVerified ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium text-green-500">Verified</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-medium text-amber-500">Not verified</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3">
                <div>
                  <Label className="text-sm text-muted-foreground">Member since</Label>
                  <p className="font-medium">
                    {profile?.created_at
                      ? new Date(profile.created_at).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Avatar */}
        <div>
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="text-lg">Avatar</CardTitle>
              <CardDescription>Choose or upload your avatar</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <AvatarPicker
                currentStyle={profile?.dicebear_style || 'adventurer'}
                currentSeed={profile?.dicebear_seed || null}
                currentAvatarUrl={profile?.avatar_url || null}
                avatarType={profile?.avatar_type || 'dicebear'}
                onSelect={handleAvatarSelect}
                onUpload={handleCustomAvatarUpload}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="overflow-hidden border-destructive/40">
            <CardHeader className="border-b border-destructive/30 bg-destructive/5">
              <CardTitle className="flex items-center gap-2 text-lg text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>Permanently delete your account and all its data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <p className="text-sm text-muted-foreground">
                Deleting your account removes your profile, every story and board you&apos;ve
                created, and all uploaded images. This cannot be undone.
              </p>
              <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                Delete account
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete account confirmation */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              This permanently deletes your profile, all stories and boards, and every uploaded
              image. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="delete-confirm">
              Type <span className="font-mono font-semibold">DELETE</span> to confirm
            </Label>
            <Input
              id="delete-confirm"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              autoComplete="off"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteConfirmText !== 'DELETE' || isDeleting}
              onClick={handleDeleteAccount}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Permanently delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
