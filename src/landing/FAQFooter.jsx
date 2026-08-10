import { useState } from 'react'

const FAQS = [
  {
    q: 'Is Orbit free to use?',
    a: 'Yes. Tracking your documents, getting reminders, and viewing requirement checklists is free. We may introduce optional paid features later, but the core tracking experience stays free.',
  },
  {
    q: 'How accurate are the requirement checklists?',
    a: "We source them from official government processes and keep a ‘last verified’ date on each one. If something’s changed, you can flag it directly from the app so we can update it.",
  },
  {
    q: 'What documents can I track right now?',
    a: "Driver's license, passport, and NBI clearance to start, with more document types coming as we expand.",
  },
  {
    q: 'Will I get spammed with reminders?',
    a: 'No — you get one email per document at each milestone (30 days, 7 days, and 1 day before expiry), not repeated daily nudges.',
  },
]

const FOOTER_COLUMNS = [
  { title: 'Product', links: ['Features', 'Pricing', 'About'] },
  { title: 'Support', links: ['Contact', 'FAQ'] },
  { title: 'Legal', links: ['Privacy Policy', 'Terms of Service'] },
]

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

export default function FAQFooter() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <section
      className="relative w-full"
      style={{ background: 'linear-gradient(180deg, #060c16 0%, #030609 100%)' }}
    >
      <div className="max-w-3xl mx-auto px-6 pt-28 pb-20">
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

      <footer className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 grid gap-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <span className="font-dancing text-white text-2xl">Orbit</span>
            <p className="text-white/60 text-sm mt-3 max-w-xs">
              A simplified tracker for all of your documents.
            </p>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-white font-medium text-sm mb-4">{col.title}</p>
              <div className="flex flex-col gap-3">
                {col.links.map((link) => (
                  <a key={link} href="#" className="text-white/60 hover:text-white text-sm transition-colors duration-300">
                    {link}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-6 border-t border-white/10 text-white/40 text-xs">
          © {new Date().getFullYear()} Orbit. All rights reserved.
        </div>
      </footer>
    </section>
  )
}
