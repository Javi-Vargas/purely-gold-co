export const metadata = { title: 'Privacy Policy — Golden Pages' }

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="font-display text-5xl font-medium text-cream">Privacy Policy</h1>

      <div className="mt-12 space-y-10 text-cream-dim">
        <section className="space-y-3">
          <h2 className="font-display text-2xl text-cream">How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>Create and manage your profile.</li>
            <li>Connect businesses with qualified marketing professionals.</li>
            <li>Verify professional credentials.</li>
            <li>Improve search results and recommendations.</li>
            <li>Respond to customer support inquiries.</li>
            <li>Send platform updates and service notifications.</li>
            <li>Improve our website and user experience.</li>
            <li>Prevent fraud and maintain platform security.</li>
            <li>Comply with legal obligations.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl text-cream">Professional Directory</h2>
          <p>
            By submitting your information, you acknowledge that certain professional
            information may be displayed publicly within our directory, including:
          </p>
          <ul className="list-disc space-y-1 pl-6">
            <li>Name</li>
            <li>Business name</li>
            <li>Services</li>
            <li>Portfolio</li>
            <li>Website</li>
            <li>Social media links</li>
            <li>City and state</li>
            <li>Professional bio</li>
          </ul>
          <p>Sensitive personal information will never be published without your consent.</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl text-cream">Vetted Professional Network</h2>
          <p>Unlike open directories, our platform reviews applicants before inclusion.</p>
          <p>
            Submission of an application does not guarantee acceptance into our directory.
          </p>
          <p>
            Purely Golden Co. reserves the right to approve, deny, suspend, or remove any
            listing at its sole discretion.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl text-cream">How We Share Information</h2>
          <p>We do not sell your personal information.</p>
          <p>We may share information with:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>Brands seeking marketing professionals</li>
            <li>Businesses using our platform</li>
            <li>Service providers that support our operations</li>
            <li>Legal authorities when required by law</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl text-cream">Cookies and Analytics</h2>
          <p>We use cookies and analytics technologies to:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>Improve website performance</li>
            <li>Understand visitor behavior</li>
            <li>Save user preferences</li>
            <li>Measure marketing effectiveness</li>
          </ul>
          <p>Users may disable cookies through their browser settings.</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl text-cream">Data Security</h2>
          <p>
            We implement commercially reasonable administrative, technical, and physical
            safeguards to protect your information. While we strive to protect your data, no
            online transmission or storage system can be guaranteed to be 100% secure.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl text-cream">Your Rights</h2>
          <p>Depending on your location, you may have the right to:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>Access your personal information</li>
            <li>Update your information</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your account</li>
            <li>Withdraw consent where applicable</li>
            <li>Request a copy of your personal data</li>
          </ul>
          <p>Requests may be submitted by contacting us using the information below.</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl text-cream">Third-Party Links</h2>
          <p>
            Our platform may contain links to third-party websites and social media
            platforms. We are not responsible for the privacy practices of those third
            parties.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl text-cream">Children&rsquo;s Privacy</h2>
          <p>
            Our platform is intended for individuals who are at least 18 years old. We do
            not knowingly collect personal information from children under 18.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl text-cream">Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy periodically. Any changes will be posted on
            this page with an updated Effective Date.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl text-cream">Contact Us</h2>
          <p>If you have questions about this Privacy Policy, please contact:</p>
          <p>Purely Golden LLC</p>
          <a
            href="mailto:contact@purelygoldenco.com"
            className="inline-block text-gold hover:underline"
          >
            contact@purelygoldenco.com
          </a>
        </section>
      </div>
    </div>
  )
}
