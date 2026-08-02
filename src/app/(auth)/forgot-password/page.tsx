import { ForgotPasswordForm } from '@/components/auth';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset Password | IdeaBoard',
  description: 'Reset your IdeaBoard account password',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
