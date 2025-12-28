import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Terms of Service | IdeaBoard',
  description: 'Terms of Service for IdeaBoard - Read our terms and conditions.',
};

export default function TermsPage() {
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
          <h1>Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: December 29, 2025</p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using IdeaBoard (&quot;Service&quot;), you agree to be bound by these
            Terms of Service (&quot;Terms&quot;). If you do not agree, please do not use the
            Service.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            IdeaBoard is a visual whiteboard application that allows users to create, organize, and
            connect ideas on an infinite canvas. The Service includes web-based tools for creating
            notes, boards, stories, and connections.
          </p>

          <h2>3. User Accounts</h2>

          <h3>3.1 Registration</h3>
          <p>
            To use certain features, you must create an account with a valid email address. You are
            responsible for maintaining the confidentiality of your account credentials.
          </p>

          <h3>3.2 Account Responsibility</h3>
          <p>
            You are responsible for all activities that occur under your account. Notify us
            immediately of any unauthorized use.
          </p>

          <h3>3.3 Age Requirement</h3>
          <p>You must be at least 13 years old to use this Service.</p>

          <h2>4. User Content</h2>

          <h3>4.1 Ownership</h3>
          <p>
            You retain ownership of all content you create using the Service (&quot;User
            Content&quot;). We do not claim ownership of your notes, boards, or other creations.
          </p>

          <h3>4.2 License to Us</h3>
          <p>
            By using the Service, you grant us a limited license to store, display, and process your
            User Content solely for the purpose of providing the Service to you.
          </p>

          <h3>4.3 Prohibited Content</h3>
          <p>You agree not to create or upload content that:</p>
          <ul>
            <li>Is illegal, harmful, or offensive</li>
            <li>Infringes on intellectual property rights</li>
            <li>Contains malware or malicious code</li>
            <li>Violates any applicable laws</li>
          </ul>

          <h2>5. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the Service for any illegal purpose</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Interfere with or disrupt the Service</li>
            <li>Reverse engineer or decompile any part of the Service</li>
            <li>Use automated systems to access the Service without permission</li>
          </ul>

          <h2>6. Intellectual Property</h2>
          <p>
            The Service, including its design, features, and code (excluding User Content), is owned
            by IdeaBoard and protected by intellectual property laws. The Service is open source
            under the MIT License.
          </p>

          <h2>7. Privacy</h2>
          <p>
            Your use of the Service is also governed by our{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            , which describes how we collect and use your information.
          </p>

          <h2>8. Service Availability</h2>

          <h3>8.1 Availability</h3>
          <p>
            We strive to maintain Service availability but do not guarantee uninterrupted access.
            The Service may be temporarily unavailable for maintenance or updates.
          </p>

          <h3>8.2 Modifications</h3>
          <p>
            We reserve the right to modify, suspend, or discontinue any part of the Service at any
            time.
          </p>

          <h2>9. Disclaimer of Warranties</h2>
          <p>
            THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR
            IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE ERROR-FREE OR UNINTERRUPTED.
          </p>

          <h2>10. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, IDEABOARD SHALL NOT BE LIABLE FOR ANY INDIRECT,
            INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING FROM YOUR USE OF THE SERVICE.
          </p>

          <h2>11. Termination</h2>

          <h3>11.1 By You</h3>
          <p>
            You may terminate your account at any time by deleting it through the Settings page.
          </p>

          <h3>11.2 By Us</h3>
          <p>
            We may suspend or terminate your account if you violate these Terms or for any other
            reason at our discretion.
          </p>

          <h2>12. Changes to Terms</h2>
          <p>
            We may update these Terms from time to time. Continued use of the Service after changes
            constitutes acceptance of the new Terms.
          </p>

          <h2>13. Governing Law</h2>
          <p>
            These Terms shall be governed by the laws of the jurisdiction in which IdeaBoard
            operates, without regard to conflict of law principles.
          </p>

          <h2>14. Contact</h2>
          <p>
            For questions about these Terms, contact us at:{' '}
            <a href="mailto:samuelworash@gmail.com">samuelworash@gmail.com</a>
          </p>

          <hr />
          <p className="text-sm text-muted-foreground">
            By using IdeaBoard, you acknowledge that you have read and agree to these Terms of
            Service.
          </p>
        </article>
      </div>
    </div>
  );
}
