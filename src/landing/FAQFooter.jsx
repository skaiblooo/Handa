import { useState } from 'react'
import StarfieldBackground from '../StarfieldBackground'

const FAQS = [
  {
    q: 'Is Orbit free to use?',
    a: 'Yup! Tracking your documents, getting reminders, and viewing requirement checklists is absolutely free.',
  },
  {
    q: 'How accurate are the requirement checklists?',
    a: "We source them from official government processes and keep a ‘last verified’ date on each one. If something’s changed, you can flag it directly from the app so we can update it.",
  },
  {
    q: 'What documents can I track right now?',
    a: "Driver's License, passport, health insurance, and way more.",
  },
  {
    q: 'Will I get spammed with reminders?',
    a: 'Nope! You get one email per document at each milestone: 30 days, 7 days, and 1 day before expiry.',
  },
]

const GITHUB_URL = 'https://github.com/skaiblooo/Orbit'

// Product/Support links scroll to the matching landing-page section (same
// ids Navbar targets); Legal links open a standalone page via onOpenLegal
// instead of pointing at nothing like they used to.
const FOOTER_COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'About', targetId: 'about' },
      { label: 'Demo', targetId: 'demo' },
    ],
  },
  {
    title: 'Support',
    links: [{ label: 'FAQ', targetId: 'faq' }],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', legal: 'privacy' },
      { label: 'Terms of Service', legal: 'terms' },
    ],
  },
]

function GithubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.333-1.754-1.333-1.754-1.089-.745.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.775.42-1.305.762-1.605-2.665-.303-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.435.375.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  )
}

function FAQItem({ q, a, open, onToggle }) {
  return (
    <div className="border-b border-white/10 py-6">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-6 text-left"
        style={{ cursor: 'pointer' }}
      >
        <span className="font-instrument text-white text-xl md:text-2xl">{q}</span>
        <span
          className="shrink-0 w-8 h-8 rounded-full glass-btn flex items-center justify-center text-black text-lg leading-none"
          style={{ transition: 'transform 300ms cubic-bezier(0.22,1,0.36,1)', transform: open ? 'rotate(45deg)' : 'rotate(0deg)' }}
        >
          +
        </span>
      </button>
      <div
        className="overflow-hidden"
        style={{
          transition: 'grid-template-rows 350ms cubic-bezier(0.22,1,0.36,1)',
          display: 'grid',
          gridTemplateRows: open ? '1fr' : '0fr',
        }}
      >
        <div className="min-h-0">
          <p className="text-white/70 text-sm md:text-base leading-relaxed mt-4 max-w-2xl">{a}</p>
        </div>
      </div>
    </div>
  )
}

export default function FAQFooter({ onOpenLegal }) {
  const [openIndex, setOpenIndex] = useState(0)

  function scrollToSection(targetId) {
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section id="faq" className="relative w-full overflow-hidden bg-[#020308]">
      <StarfieldBackground />
      <div className="relative max-w-3xl mx-auto px-6 pt-28 pb-20">
        <h2 className="font-instrument text-white text-4xl md:text-5xl text-center mb-16">Frequently asked</h2>
        <div>
          {FAQS.map((item, i) => (
            <FAQItem
              key={item.q}
              q={item.q}
              a={item.a}
              open={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>
      </div>

      <footer className="relative border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 grid gap-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <span className="font-dancing text-white text-2xl">Orbit</span>
            <p className="text-white/60 text-sm mt-3 max-w-xs">
              A simplified tracker for all of your documents.
            </p>
            <a href="tel:+639611374148" className="text-white/60 hover:text-white text-sm mt-2 inline-block transition-colors duration-300">
              0961-137-4148
            </a>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Orbit on GitHub"
              className="inline-flex items-center justify-center w-9 h-9 rounded-full mt-4 text-white/60 hover:text-white hover:bg-white/10 transition-colors duration-300"
            >
              <GithubIcon />
            </a>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-white font-medium text-sm mb-4">{col.title}</p>
              <div className="flex flex-col gap-3">
                {col.links.map((link) => (
                  <button
                    key={link.label}
                    type="button"
                    onClick={() => (link.legal ? onOpenLegal?.(link.legal) : scrollToSection(link.targetId))}
                    className="text-white/60 hover:text-white text-sm text-left transition-colors duration-300"
                  >
                    {link.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-6 border-t border-white/10 text-white/40 text-xs flex flex-wrap items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} Orbit. All rights reserved.</span>
          <span>A solo project made by Jeremy Tan</span>
        </div>
      </footer>
    </section>
  )
}
