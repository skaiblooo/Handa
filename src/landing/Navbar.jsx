import { useState } from 'react'
import Button from './Button'

// Each label maps to the id of the landing-page section it should scroll
// to (see Hero/DashboardShowcase/FAQFooter). No "Journal" entry — there's
// no blog/journal content anywhere in the app, so a link for it would just
// be another dead button.
const NAV_LINKS = [
  { label: 'About', targetId: 'about' },
  { label: 'Demo', targetId: 'demo' },
  { label: 'FAQ', targetId: 'faq' },
]
const EASE = 'cubic-bezier(0.22,1,0.36,1)'

export default function Navbar({ onGetStarted }) {
  const [isOpen, setIsOpen] = useState(false)

  function scrollToSection(targetId) {
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      {/* backdrop-blur + a dark scrim keep the links legible once page content
          scrolls underneath this fixed bar — without it, text from whatever
          section is currently at the top of the viewport shows straight
          through and visually collides with the nav links. */}
      <nav className="fixed top-0 left-0 right-0 z-50 grid grid-cols-2 md:grid-cols-3 items-center px-6 md:px-12 py-5 bg-black/20 backdrop-blur-md">
        <a href="#" className="font-dancing text-white text-2xl md:text-3xl justify-self-start">
          Orbit
        </a>

        <div className="hidden md:flex items-center justify-center gap-12">
          {NAV_LINKS.map((link) => (
            <button
              key={link.label}
              type="button"
              onClick={() => scrollToSection(link.targetId)}
              className="text-white/80 hover:text-white text-sm tracking-wide transition-colors duration-300"
            >
              {link.label}
            </button>
          ))}
        </div>

        <div className="hidden md:block justify-self-end">
          <Button onClick={onGetStarted}>Start tracking for free</Button>
        </div>

        <button
          type="button"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setIsOpen((v) => !v)}
          className="md:hidden relative w-8 h-8 flex items-center justify-center justify-self-end"
        >
          <span
            className="absolute w-6 h-[1.5px] bg-white"
            style={{
              transition: `transform 400ms ${EASE}`,
              transform: isOpen ? 'translateY(0px) rotate(45deg)' : 'translateY(-9px) rotate(0deg)',
            }}
          />
          <span
            className="absolute w-6 h-[1.5px] bg-white"
            style={{
              transition: `opacity 250ms ${EASE}, transform 250ms ${EASE}`,
              opacity: isOpen ? 0 : 1,
              transform: isOpen ? 'scale(0)' : 'scale(1)',
            }}
          />
          <span
            className="absolute w-6 h-[1.5px] bg-white"
            style={{
              transition: `transform 400ms ${EASE}`,
              transform: isOpen ? 'translateY(0px) rotate(-45deg)' : 'translateY(9px) rotate(0deg)',
            }}
          />
        </button>
      </nav>

      {/* Backdrop */}
      <div
        onClick={() => setIsOpen(false)}
        className="fixed inset-0 z-40 bg-black/40 md:hidden"
        style={{
          transition: `opacity 400ms ${EASE}`,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      />

      {/* Slide-in panel */}
      <div
        className="fixed top-0 right-0 bottom-0 z-40 w-[85%] max-w-[340px] bg-[#0a0608]/95 backdrop-blur-xl border-l border-white/10 md:hidden flex flex-col px-8 py-24 gap-2"
        style={{
          transition: `transform 450ms ${EASE}`,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {NAV_LINKS.map((link, i) => (
          <button
            key={link.label}
            type="button"
            onClick={() => { setIsOpen(false); scrollToSection(link.targetId) }}
            className="font-instrument text-white text-3xl py-3 border-b border-white/10 text-left"
            style={{
              transition: `opacity 400ms ${EASE}, transform 400ms ${EASE}`,
              transitionDelay: isOpen ? `${150 + i * 75}ms` : '0ms',
              opacity: isOpen ? 1 : 0,
              transform: isOpen ? 'translateX(0)' : 'translateX(24px)',
            }}
          >
            {link.label}
          </button>
        ))}
        <div
          className="mt-8"
          style={{
            transition: `opacity 400ms ${EASE}, transform 400ms ${EASE}`,
            transitionDelay: isOpen ? '450ms' : '0ms',
            opacity: isOpen ? 1 : 0,
            transform: isOpen ? 'translateX(0)' : 'translateX(24px)',
          }}
        >
          <Button
            className="w-full"
            onClick={() => {
              setIsOpen(false)
              onGetStarted?.()
            }}
          >
            Start tracking for free
          </Button>
        </div>
      </div>
    </>
  )
}
