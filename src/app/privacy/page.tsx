import { LegalPage, type LegalSection } from '@/components/marketing';

export const metadata = {
  title: 'Privacy Policy | IdeaBoard',
  description: 'Privacy Policy for IdeaBoard — learn how we collect, use, and protect your data.',
};

const sections: LegalSection[] = [
  {
    id: 'overview',
    heading: 'Overview',
    body: (
      <p>
        IdeaBoard (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting
        your privacy. This policy explains what we collect, how we use it, and the choices you have.
      </p>
    ),
  },
  {
    id: 'information',
    heading: 'Information we collect',
    body: (
      <>
        <h3>Account information</h3>
        <ul>
          <li>Email address, used for authentication</li>
          <li>Display name (optional)</li>
          <li>Avatar preferences</li>
        </ul>
        <h3>Content you create</h3>
        <ul>
          <li>Stories, boards, notes, and connections</li>
          <li>Component library items</li>
        </ul>
        <h3>Usage data</h3>
        <ul>
          <li>Basic analytics such as page views and feature usage</li>
          <li>Device type and browser information</li>
        </ul>
      </>
    ),
  },
  {
    id: 'use',
    heading: 'How we use your information',
    body: (
      <ul>
        <li>
          <strong>Provide the service:</strong> store and sync your boards and notes
        </li>
        <li>
          <strong>Authentication:</strong> verify your identity and secure your account
        </li>
        <li>
          <strong>Improve the service:</strong> analyze usage patterns to enhance features
        </li>
        <li>
          <strong>Communication:</strong> send important service updates — never marketing email
        </li>
      </ul>
    ),
  },
  {
    id: 'storage',
    heading: 'Data storage',
    body: (
      <>
        <p>Your data is stored securely using Supabase, which provides:</p>
        <ul>
          <li>Encryption of data at rest and in transit</li>
          <li>Row Level Security, so you can only access your own data</li>
          <li>Data centers that comply with industry standards</li>
        </ul>
      </>
    ),
  },
  {
    id: 'sharing',
    heading: 'Data sharing',
    body: (
      <>
        <p>
          We do <strong>not</strong> sell, trade, or share your personal data with third parties,
          except:
        </p>
        <ul>
          <li>
            <strong>Service providers:</strong> Supabase (database) and Vercel (hosting)
          </li>
          <li>
            <strong>Legal requirements:</strong> when required by law
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'rights',
    heading: 'Your rights',
    body: (
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
    ),
  },
  {
    id: 'cookies',
    heading: 'Cookies',
    body: (
      <>
        <p>We use a minimal set of cookies for:</p>
        <ul>
          <li>Authentication session management</li>
          <li>Theme preference (light or dark mode)</li>
        </ul>
      </>
    ),
  },
  {
    id: 'analytics',
    heading: 'Analytics',
    body: (
      <p>
        We use Vercel Analytics to collect anonymous usage data. No personally identifying
        information is tracked.
      </p>
    ),
  },
  {
    id: 'children',
    heading: "Children's privacy",
    body: (
      <p>
        IdeaBoard is not intended for children under 13, and we do not knowingly collect data from
        them.
      </p>
    ),
  },
  {
    id: 'changes',
    heading: 'Changes to this policy',
    body: (
      <p>
        We may update this policy occasionally. Significant changes will be communicated within the
        app.
      </p>
    ),
  },
  {
    id: 'contact',
    heading: 'Contact',
    body: (
      <p>
        For privacy questions or data requests, email{' '}
        <a href="mailto:samuelworash@gmail.com">samuelworash@gmail.com</a>.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      lastUpdated="December 29, 2025"
      intro="How IdeaBoard collects, uses, and protects your information — in plain language."
      sections={sections}
      closing="By using IdeaBoard, you agree to this Privacy Policy."
    />
  );
}
