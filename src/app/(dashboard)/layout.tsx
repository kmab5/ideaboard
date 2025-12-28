import { Navbar } from '@/components/common';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-background transition-all duration-300">
      <Navbar />
      <main className="w-full transition-all duration-300 ease-in-out">{children}</main>
    </div>
  );
}
