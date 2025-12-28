'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/common';
import { AppIcon } from '@/components/icons';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const leftPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (leftPanelRef.current) {
        const rect = leftPanelRef.current.getBoundingClientRect();
        // Calculate position relative to the left panel, even when mouse is outside
        const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
        const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
        setMousePosition({ x, y });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="flex min-h-screen transition-all duration-300">
      {/* Left Panel - Branding */}
      <div
        ref={leftPanelRef}
        className="relative hidden flex-col justify-between overflow-hidden bg-[#1a1a2e] p-8 transition-all duration-300 ease-in-out lg:flex lg:w-1/2 lg:p-12"
      >
        {/* Animated background */}
        <div className="absolute inset-0 -z-0">
          {/* Floating orbs - responsive to mouse */}
          <div
            className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-blue-500/20 blur-2xl"
            style={{
              transform: `translate(${mousePosition.x * 30}px, ${mousePosition.y * 30}px)`,
              transition: 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              animation: 'pulse 3s ease-in-out infinite',
            }}
          />
          <div
            className="absolute bottom-1/3 right-1/4 h-96 w-96 rounded-full bg-purple-500/15 blur-2xl"
            style={{
              transform: `translate(${mousePosition.x * -40}px, ${mousePosition.y * -40}px)`,
              transition: 'transform 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              animation: 'pulse 4s ease-in-out infinite',
            }}
          />
          <div
            className="absolute left-1/3 top-2/3 h-72 w-72 rounded-full bg-cyan-500/15 blur-2xl"
            style={{
              transform: `translate(${mousePosition.x * 25}px, ${mousePosition.y * 25}px)`,
              transition: 'transform 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              animation: 'pulse 5s ease-in-out infinite 1s',
            }}
          />
          {/* Smaller accent orbs */}
          <div
            className="absolute right-[15%] top-[20%] h-32 w-32 rounded-full bg-indigo-400/20 blur-xl"
            style={{
              transform: `translate(${mousePosition.x * -50}px, ${mousePosition.y * -50}px)`,
              transition: 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}
          />
          <div
            className="absolute bottom-[15%] left-[10%] h-24 w-24 rounded-full bg-pink-400/15 blur-xl"
            style={{
              transform: `translate(${mousePosition.x * 60}px, ${mousePosition.y * 60}px)`,
              transition: 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}
          />
          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.25]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '50px 50px',
            }}
          />
        </div>

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2 text-white transition-all duration-200">
            <AppIcon className="h-8 w-8 transition-all duration-200 sm:h-10 sm:w-10" />
            <span className="text-xl font-bold transition-all duration-200 sm:text-2xl">
              IdeaBoard
            </span>
          </Link>
        </div>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center">
          <AppIcon className="h-32 w-32 opacity-80" />
          <p className="mt-6 text-center text-lg text-white/70">Organize your ideas visually</p>
        </div>

        <div className="relative z-10 text-sm text-white/50">
          © 2025 IdeaBoard. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="relative flex flex-1 items-center justify-center p-4 backdrop-blur-2xl transition-all duration-300 ease-in-out sm:p-6 md:p-8">
        {/* Theme Toggle */}
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md transition-all duration-200">
          {/* Mobile Logo */}
          <div className="mb-6 text-center transition-all duration-200 sm:mb-8 lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2 transition-all duration-200">
              <AppIcon className="h-8 w-8 transition-all duration-200 sm:h-10 sm:w-10" />
              <span className="text-xl font-bold transition-all duration-200 sm:text-2xl">
                IdeaBoard
              </span>
            </Link>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
