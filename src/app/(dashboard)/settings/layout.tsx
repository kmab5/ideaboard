import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings | IdeaBoard',
  description: 'Manage your account settings and preferences on IdeaBoard.',
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
