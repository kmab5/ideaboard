import { LoginForm } from '@/components/auth';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login | IdeaBoard',
  description: 'Sign in to your IdeaBoard account',
};

export default function LoginPage() {
  return <LoginForm />;
}
