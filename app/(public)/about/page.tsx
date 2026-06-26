export const metadata = { title: 'About — Golden Pages' }

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="font-display text-5xl font-medium text-cream">About</h1>
      <p className="mt-6 text-lg text-cream-dim">
        More about Golden Pages coming soon.
      </p>

      <div className="mt-12 border-t border-line/60 pt-8">
        <h2 className="font-display text-2xl text-cream">Get in touch</h2>
        <p className="mt-3 text-cream-dim">
          Questions about a listing or getting found in the directory? Reach out
          directly:
        </p>
        <a
          href="mailto:contact@purelygoldenco.com"
          className="mt-3 inline-block text-gold hover:underline"
        >
          contact@purelygoldenco.com
        </a>
      </div>
    </div>
  )
}
