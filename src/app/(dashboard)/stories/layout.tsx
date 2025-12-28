import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Stories | IdeaBoard',
  description: 'View and manage your stories and boards on IdeaBoard.',
};

export default function StoriesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
