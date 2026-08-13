import { useEffect } from 'react'

const LAST_UPDATED = 'August 14, 2026'

const PRIVACY_SECTIONS = [
  {
    title: 'What we collect',
    body: [
      'Account info: your email address and password (handled by our authentication provider, Supabase — we never see or store your raw password), or your Google account details if you sign in with Google.',
      'Guest sessions: if you try Orbit without signing up, we create an anonymous session so your data isn’t lost if you come back — no email or password is required until you choose to save it.',
      'Document data you enter: the fields you fill in for each tracked document (names, dates, ID numbers, expiry dates) and which renewal steps you’ve marked done. This is the data Orbit exists to help you manage, so it’s stored to power reminders and the app itself.',
      'Usage basics: things like which requirement checklists you viewed and optional feedback you submit on whether a checklist was accurate.',
    ],
  },
  {
    title: 'What we don’t do',
    body: [
      'We don’t sell your data, and we don’t share your document details with third parties for advertising.',
      'We’re not a government service and have no official connection to the DFA, LTO, PSA, or any other agency named in the app — the requirement checklists are informational, sourced from public processes and kept dated so you can judge how current they are.',
    ],
  },
  {
    title: 'How we use it',
    body: [
      'To show your dashboard, track expiry dates, and send renewal reminder emails at 30, 7, and 1 day before a document expires — one email per milestone, not repeated nudges.',
      'To let you export a JSON copy of everything you’re tracking at any time from Settings → Data & Privacy.',
      'To improve the requirement checklists, using the accuracy feedback you optionally submit.',
    ],
  },
  {
    title: 'Where it’s stored',
    body: [
      'Your data is stored with Supabase (Postgres + authentication) and reminder emails are sent through Resend. Both are standard infrastructure providers — we don’t run our own servers to store your documents.',
    ],
  },
  {
    title: 'Your controls',
    body: [
      'Export: download everything you’re tracking as JSON at any time.',
      'Delete: you can delete individual documents and orbits yourself from the app. Full account deletion isn’t self-serve yet — contact us and we’ll take care of it by hand.',
      'Guest data: if you’re using Orbit as a guest and never save an account, that data lives only in that anonymous session and isn’t linked to any email of yours.',
    ],
  },
]

const TERMS_SECTIONS = [
  {
    title: 'Using Orbit',
    body: [
      'Orbit is a personal document tracker: you tell it what you’re tracking, it tracks expiry dates and reminds you before they lapse. It’s free to use.',
      'You’re responsible for the accuracy of what you enter — Orbit reminds you based on the dates you provide, and doesn’t independently verify them against any government system.',
    ],
  },
  {
    title: 'Not official guidance',
    body: [
      'The requirement checklists and step-by-step guides in Orbit are informational summaries of public government processes, not official instructions from any agency. Processes change; we date each checklist with when it was last verified, but you should confirm current requirements with the relevant agency before relying on a deadline that matters.',
      'Orbit is not affiliated with, endorsed by, or operated on behalf of the Philippine government or any of the agencies referenced in the app.',
    ],
  },
  {
    title: 'Your account',
    body: [
      'Keep your login credentials to yourself — you’re responsible for activity under your account.',
      'Guest sessions are convenient but temporary in spirit: if you want to keep your data long-term, save an account with an email and password from the guest banner.',
    ],
  },
  {
    title: 'Availability',
    body: [
      'Orbit is provided as-is. We aim to keep reminders and the app itself reliable, but as with any service, we can’t guarantee uninterrupted availability, and we’re not liable for a missed deadline that results from a missed or delayed reminder.',
    ],
  },
  {
    title: 'Changes',
    body: [
      'We may update these terms or the privacy policy as the app evolves. Material changes will be reflected here with an updated date at the top of the page.',
    ],
  },
]

function LegalSection({ title, body }) {
  return (
    <div className="mb-10">
      <h2 className="font-instrument text-white text-xl md:text-2xl mb-3">{title}</h2>
      <div className="flex flex-col gap-3">
        {body.map((p, i) => (
          <p key={i} className="text-white/70 text-sm md:text-base leading-relaxed">{p}</p>
        ))}
      </div>
    </div>
  )
}

// A lightweight standalone page (not a modal) so it reads like a real,
// linkable destination rather than a popup — matches the plain dark
// background/instrument-serif heading style the rest of the landing page
// uses, just without the video/photo backdrops those sections carry.
export default function LegalPage({ page, onBack }) {
  const isPrivacy = page === 'privacy'
  const sections = isPrivacy ? PRIVACY_SECTIONS : TERMS_SECTIONS

  // Swapping in from the footer keeps whatever scroll position the landing
  // page was at (FAQ/footer is usually far down), so without this the page
  // opens mid-scroll instead of at its own top.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [page])

  return (
    <div className="min-h-screen w-full bg-[#0a0608]">
      <nav className="sticky top-0 z-10 bg-black/40 backdrop-blur-md border-b border-white/10 px-6 md:px-12 py-5">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors duration-300"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            Back
          </button>
          <span className="font-dancing text-white text-2xl">Orbit</span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 pt-16 pb-24">
        <h1 className="font-instrument text-white text-4xl md:text-5xl mb-2">
          {isPrivacy ? 'Privacy Policy' : 'Terms of Service'}
        </h1>
        <p className="text-white/40 text-sm mb-14">Last updated {LAST_UPDATED}</p>

        {sections.map((s) => (
          <LegalSection key={s.title} title={s.title} body={s.body} />
        ))}

        <p className="text-white/40 text-xs mt-16 pt-8 border-t border-white/10">
          Questions about either of these? Reach out and we’ll help however we can.
        </p>
      </div>
    </div>
  )
}
