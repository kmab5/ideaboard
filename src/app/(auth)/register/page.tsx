import { RegisterForm } from '@/components/auth';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register | IdeaBoard',
  description: 'Create your IdeaBoard account',
};

export default function RegisterPage() {
  return <RegisterForm />;
}
