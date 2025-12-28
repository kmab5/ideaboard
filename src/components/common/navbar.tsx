'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Settings, LogOut, User, Menu, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from './theme-toggle';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function Navbar() {
  const router = useRouter();
  const { profile, logout } = useUserStore();
  const supabase = createClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error('Logout failed', { description: error.message });
        return;
      }
      logout();
      router.push('/login');
      router.refresh();
    } catch {
      toast.error('An unexpected error occurred');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur transition-all duration-300 ease-in-out supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 w-full items-center justify-between px-4 transition-all duration-300 ease-in-out sm:px-6 md:px-8 lg:px-12">
        <Link href="/stories" className="flex items-center gap-2 transition-all duration-200">
          <AppIcon className="h-7 w-7 transition-all duration-200 sm:h-8 sm:w-8" />
          <span className="text-lg font-bold transition-all duration-200 sm:text-xl">
            IdeaBoard
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-2 transition-all duration-200 sm:flex sm:gap-3">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative flex h-auto items-center gap-2 rounded-full px-2 py-1.5"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={profile?.avatar_url || undefined}
                    alt={profile?.display_name || 'User'}
                  />
                  <AvatarFallback>
                    {profile?.display_name ? getInitials(profile.display_name) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium md:inline-block">
                  {profile?.display_name || 'User'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  {profile?.display_name && <p className="font-medium">{profile.display_name}</p>}
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/stories" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  My Stories
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 sm:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          'overflow-hidden border-t transition-all duration-300 ease-in-out sm:hidden',
          mobileMenuOpen ? 'max-h-64 opacity-100' : 'max-h-0 border-t-0 opacity-0'
        )}
      >
        <div className="flex flex-col gap-1 p-4">
          {/* User Info */}
          <div className="mb-2 flex items-center gap-3 border-b pb-3">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={profile?.avatar_url || undefined}
                alt={profile?.display_name || 'User'}
              />
              <AvatarFallback>
                {profile?.display_name ? getInitials(profile.display_name) : 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">{profile?.display_name || 'User'}</span>
          </div>

          {/* Menu Items */}
          <Link
            href="/stories"
            className="flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-muted"
            onClick={() => setMobileMenuOpen(false)}
          >
            <User className="h-4 w-4" />
            My Stories
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-muted"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
          <button
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-destructive transition-colors hover:bg-muted"
            onClick={() => {
              setMobileMenuOpen(false);
              handleLogout();
            }}
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
