import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Privacy Policy | IdeaBoard',
  description: 'Privacy Policy for IdeaBoard - Learn how we collect, use, and protect your data.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <article className="prose prose-neutral dark:prose-invert max-w-none">
          <h1>Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: December 29, 2025</p>

          <h2>Overview</h2>
          <p>
            IdeaBoard (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to
            protecting your privacy. This policy explains how we collect, use, and safeguard your
            information.
          </p>

          <h2>Information We Collect</h2>

          <h3>Account Information</h3>
          <ul>
            <li>Email address (for authentication)</li>
            <li>Display name (optional)</li>
            <li>Avatar preferences</li>
          </ul>

          <h3>Content Data</h3>
          <ul>
            <li>Stories, boards, notes, and connections you create</li>
            <li>Component library items</li>
          </ul>

          <h3>Usage Data</h3>
          <ul>
            <li>Basic analytics (page views, feature usage)</li>
            <li>Device type and browser information</li>
          </ul>

          <h2>How We Use Your Information</h2>
          <ul>
            <li>
              <strong>Provide the Service:</strong> Store and sync your boards and notes
            </li>
            <li>
              <strong>Authentication:</strong> Verify your identity and secure your account
            </li>
            <li>
              <strong>Improve the Service:</strong> Analyze usage patterns to enhance features
            </li>
            <li>
              <strong>Communication:</strong> Send important service updates (no marketing emails)
            </li>
          </ul>

          <h2>Data Storage</h2>
          <p>Your data is stored securely using Supabase, which provides:</p>
          <ul>
            <li>Encrypted data at rest and in transit</li>
            <li>Row Level Security (RLS) ensuring you can only access your own data</li>
            <li>Data centers in compliance with industry standards</li>
          </ul>

          <h2>Data Sharing</h2>
          <p>
            We do <strong>not</strong> sell, trade, or share your personal data with third parties,
            except:
          </p>
          <ul>
            <li>
              <strong>Service Providers:</strong> Supabase (database), Vercel (hosting)
            </li>
            <li>
              <strong>Legal Requirements:</strong> If required by law
            </li>
          </ul>

          <h2>Your Rights</h2>
          <p>You can:</p>
          <ul>
            <li>
              <strong>Access</strong> your data at any time through the app
            </li>
            <li>
              <strong>Export</strong> your content (coming soon)
            </li>
            <li>
              <strong>Delete</strong> your account and all associated data
            </li>
            <li>
              <strong>Update</strong> your profile information in settings
            </li>
          </ul>

          <h2>Cookies</h2>
          <p>We use minimal cookies for:</p>
          <ul>
            <li>Authentication session management</li>
            <li>Theme preferences (dark/light mode)</li>
          </ul>

          <h2>Analytics</h2>
          <p>
            We use Vercel Analytics to collect anonymous usage data. No personal information is
            tracked.
          </p>

          <h2>Children&apos;s Privacy</h2>
          <p>
            IdeaBoard is not intended for children under 13. We do not knowingly collect data from
            children.
          </p>

          <h2>Changes to This Policy</h2>
          <p>
            We may update this policy occasionally. Significant changes will be communicated via the
            app.
          </p>

          <h2>Contact</h2>
          <p>
            For privacy questions or data requests, contact us at:{' '}
            <a href="mailto:samuelworash@gmail.com">samuelworash@gmail.com</a>
          </p>

          <hr />
          <p className="text-sm text-muted-foreground">
            By using IdeaBoard, you agree to this Privacy Policy.
          </p>
        </article>
      </div>
    </div>
  );
}
