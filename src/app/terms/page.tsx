import Link from 'next/link';
import { LegalPage, type LegalSection } from '@/components/marketing';

export const metadata = {
  title: 'Terms of Service | IdeaBoard',
  description: 'Terms of Service for IdeaBoard — read our terms and conditions.',
};

const sections: LegalSection[] = [
  {
    id: 'acceptance',
    heading: 'Acceptance of terms',
    body: (
      <p>
        By accessing or using IdeaBoard (the &quot;Service&quot;), you agree to be bound by these
        Terms of Service (&quot;Terms&quot;). If you do not agree, please do not use the Service.
      </p>
    ),
  },
  {
    id: 'description',
    heading: 'Description of service',
    body: (
      <p>
        IdeaBoard is a visual whiteboard application for creating, organizing, and connecting ideas
        on an infinite canvas. It includes web-based tools for creating notes, boards, stories, and
        connections.
      </p>
    ),
  },
  {
    id: 'accounts',
    heading: 'User accounts',
    body: (
      <>
        <h3>Registration</h3>
        <p>
          To use certain features you must create an account with a valid email address. You are
          responsible for keeping your credentials confidential.
        </p>
        <h3>Account responsibility</h3>
        <p>
          You are responsible for all activity under your account. Notify us immediately of any
          unauthorized use.
        </p>
        <h3>Age requirement</h3>
        <p>You must be at least 13 years old to use the Service.</p>
      </>
    ),
  },
  {
    id: 'content',
    heading: 'User content',
    body: (
      <>
        <h3>Ownership</h3>
        <p>
          You retain ownership of everything you create with the Service (&quot;User Content&quot;).
          We do not claim ownership of your notes, boards, or other creations.
        </p>
        <h3>License to us</h3>
        <p>
          You grant us a limited license to store, display, and process your User Content solely to
          provide the Service to you.
        </p>
        <h3>Prohibited content</h3>
        <p>You agree not to create or upload content that:</p>
        <ul>
          <li>Is illegal, harmful, or offensive</li>
          <li>Infringes intellectual property rights</li>
          <li>Contains malware or malicious code</li>
          <li>Violates any applicable law</li>
        </ul>
      </>
    ),
  },
  {
    id: 'acceptable-use',
    heading: 'Acceptable use',
    body: (
      <>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Service for any illegal purpose</li>
          <li>Attempt to gain unauthorized access to our systems</li>
          <li>Interfere with or disrupt the Service</li>
          <li>Reverse engineer or decompile any part of the Service</li>
          <li>Use automated systems to access the Service without permission</li>
        </ul>
      </>
    ),
  },
  {
    id: 'ip',
    heading: 'Intellectual property',
    body: (
      <p>
        The Service — including its design, features, and code, excluding User Content — is owned by
        IdeaBoard and protected by intellectual property laws. The Service is open source under the
        MIT License.
      </p>
    ),
  },
  {
    id: 'privacy',
    heading: 'Privacy',
    body: (
      <p>
        Your use of the Service is also governed by our{' '}
        <Link href="/privacy">Privacy Policy</Link>, which describes how we collect and use your
        information.
      </p>
    ),
  },
  {
    id: 'availability',
    heading: 'Service availability',
    body: (
      <>
        <h3>Availability</h3>
        <p>
          We strive to keep the Service available but do not guarantee uninterrupted access. It may
          be temporarily unavailable for maintenance or updates.
        </p>
        <h3>Modifications</h3>
        <p>
          We reserve the right to modify, suspend, or discontinue any part of the Service at any
          time.
        </p>
      </>
    ),
  },
  {
    id: 'warranties',
    heading: 'Disclaimer of warranties',
    body: (
      <p>
        The Service is provided &quot;as is&quot; without warranties of any kind, express or
        implied. We do not warrant that the Service will be error-free or uninterrupted.
      </p>
    ),
  },
  {
    id: 'liability',
    heading: 'Limitation of liability',
    body: (
      <p>
        To the maximum extent permitted by law, IdeaBoard shall not be liable for any indirect,
        incidental, special, or consequential damages arising from your use of the Service.
      </p>
    ),
  },
  {
    id: 'termination',
    heading: 'Termination',
    body: (
      <>
        <h3>By you</h3>
        <p>You may terminate your account at any time by deleting it from the Settings page.</p>
        <h3>By us</h3>
        <p>
          We may suspend or terminate your account if you violate these Terms, or at our discretion.
        </p>
      </>
    ),
  },
  {
    id: 'changes',
    heading: 'Changes to terms',
    body: (
      <p>
        We may update these Terms from time to time. Continued use of the Service after changes take
        effect constitutes acceptance of the revised Terms.
      </p>
    ),
  },
  {
    id: 'governing-law',
    heading: 'Governing law',
    body: (
      <p>
        These Terms are governed by the laws of the jurisdiction in which IdeaBoard operates,
        without regard to conflict-of-law principles.
      </p>
    ),
  },
  {
    id: 'contact',
    heading: 'Contact',
    body: (
      <p>
        For questions about these Terms, email{' '}
        <a href="mailto:samuelworash@gmail.com">samuelworash@gmail.com</a>.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      lastUpdated="December 29, 2025"
      intro="The agreement between you and IdeaBoard when you use the app."
      sections={sections}
      closing="By using IdeaBoard, you acknowledge that you have read and agree to these Terms of Service."
    />
  );
}
