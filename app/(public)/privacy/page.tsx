export const metadata = { title: 'Privacy — Golden Pages' }

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="font-display text-5xl font-medium text-cream">Privacy</h1>
      <p className="mt-6 text-lg text-cream-dim">
        Golden Pages is a curated directory operated by Purely Golden LLC. This
        page explains what information we collect and how it is used.
      </p>

      <div className="mt-12 space-y-8 text-cream-dim">
        <section>
          <h2 className="font-display text-2xl text-cream">What we collect</h2>
          <p className="mt-3">
            When a business submits a request through our “Get Listed” form, we
            collect the details it provides: business name, contact name, email
            address, phone number, website, business hours, location, and a short
            description. We also record a hashed form of the submitter’s IP address
            to prevent spam and abuse. We do not use tracking cookies or sell any
            information.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-cream">How it is used</h2>
          <p className="mt-3">
            Submissions are reviewed by our team before anything is published. Once
            a listing is approved and published, the business name, service type,
            location, and the contact details provided (such as phone and website)
            are shown publicly in the directory so that potential clients can reach
            the business directly. The email address is used only to communicate
            with the business about its listing and is not displayed publicly.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-cream">Removing a listing</h2>
          <p className="mt-3">
            If you would like your listing edited or removed, or have any question
            about the information we hold, email us and we’ll take care of it.
          </p>
          <a
            href="mailto:contact@purelygoldenco.com"
            className="mt-3 inline-block text-gold hover:underline"
          >
            contact@purelygoldenco.com
          </a>
        </section>
      </div>
    </div>
  )
}
