'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, User, CheckCircle2, XCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/lib/store';
import { profileUpdateSchema, type ProfileUpdateInput } from '@/lib/validations';
import type { DicebearStyle } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AvatarPicker } from '@/components/common/avatar-picker';
import { PageLoader } from '@/components/common';
import { toast } from 'sonner';

export default function SettingsPage() {
  const supabase = createClient();
  const { user, profile, setProfile, setUser } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

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

          let { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();

          // If no profile exists, create one
          if (!profileData) {
            const displayName =
              authUser.user_metadata?.display_name ||
              authUser.user_metadata?.name ||
              authUser.email?.split('@')[0] ||
              'User';

            const seed = authUser.id;
            const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`;

            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                id: authUser.id,
                display_name: displayName,
                avatar_type: 'dicebear',
                dicebear_style: 'adventurer',
                dicebear_seed: seed,
                avatar_url: avatarUrl,
              })
              .select()
              .single();

            if (!createError && newProfile) {
              profileData = newProfile;
            }
          }

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

    const avatarUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;

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

    // Validate file
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      toast.error('Only PNG and JPG images are allowed');
      return;
    }

    if (file.size > 512 * 1024) {
      toast.error('Image must be less than 512KB');
      return;
    }

    setIsLoading(true);
    try {
      // Upload to Supabase Storage
      // Path format: {user_id}/avatar.{ext} - matches storage policy
      const fileExt = file.name.split('.').pop();
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
    <div className="container max-w-5xl px-8 py-8 md:px-12 lg:px-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-2 text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
        {/* Left Column - Profile and Account */}
        <div className="space-y-6">
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
        </div>
      </div>
    </div>
  );
}
