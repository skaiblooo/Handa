import { useEffect, useState } from 'react'
import orbitLogo from '../assets/orbit logo.png'

// Mirrors the real push notification format send-reminders actually
// sends (title "Documents expiring soon", body "<document> expires in
// <n> days") rather than inventing marketing copy that doesn't match
// what the feature really does.
const NOTIFICATIONS = [
  { doc: "Driver's License", days: 7 },
  { doc: 'SSS ID', days: 30 },
  { doc: 'Passport', days: 1 },
]

const CYCLE_MS = 3200

function NotificationBanner({ doc, days, visible }) {
  return (
    <div
      className="glass-dark absolute inset-x-0 top-0 rounded-2xl px-3.5 py-3 flex items-start gap-3"
      style={{
        transition: 'transform 500ms cubic-bezier(0.22,1,0.36,1), opacity 400ms ease',
        transform: visible ? 'translateY(0)' : 'translateY(-24px)',
        opacity: visible ? 1 : 0,
      }}
    >
      <img src={orbitLogo} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-white text-[13px] font-semibold">Documents expiring soon</span>
          <span className="text-white/40 text-[10px] shrink-0">now</span>
        </div>
        <p className="text-white/70 text-[12px] mt-0.5 truncate">{doc} expires in {days} day{days === 1 ? '' : 's'}</p>
      </div>
    </div>
  )
}

// A looping phone mockup showing the real push-notification format
// arriving, so "get reminded before it expires" is something you watch
// happen instead of just a claim in the copy next to it.
export default function AnimatedPhone() {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)
  const [reducedMotion] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)

  useEffect(() => {
    if (reducedMotion) return
    let hideTimer
    const interval = setInterval(() => {
      setVisible(false)
      hideTimer = setTimeout(() => {
        setIndex((i) => (i + 1) % NOTIFICATIONS.length)
        setVisible(true)
      }, 450)
    }, CYCLE_MS)
    return () => { clearInterval(interval); clearTimeout(hideTimer) }
  }, [reducedMotion])

  const current = NOTIFICATIONS[index]

  return (
    <div className="flex justify-center">
      {/* Phone bezel */}
      <div
        className="relative w-[260px] h-[540px] rounded-[2.75rem] p-3"
        style={{
          background: 'linear-gradient(160deg, #1a1d24 0%, #08090c 100%)',
          boxShadow: '0 40px 80px -20px rgba(0,0,0,0.7), inset 0 1px 0 0 rgba(255,255,255,0.08)',
        }}
      >
        <div className="relative w-full h-full rounded-[2.1rem] overflow-hidden bg-[#020308]">
          <StarfieldBackgroundInline />
          {/* Dynamic island */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-6 rounded-full bg-black z-20" />
          {/* Lock-screen clock, then the notification in normal flow below
              it (with real reserved height) so the two can never overlap
              regardless of how tall either one renders. */}
          <div className="relative z-10 h-full flex flex-col items-center pt-16 px-3">
            <span className="font-instrument text-white text-5xl leading-none">9:41</span>
            <span className="text-white/50 text-xs mt-2 tracking-wide">Tuesday, August 18</span>
            <div className="relative w-full mt-8" style={{ height: 68 }}>
              {reducedMotion ? (
                <NotificationBanner doc={NOTIFICATIONS[0].doc} days={NOTIFICATIONS[0].days} visible={true} />
              ) : (
                <NotificationBanner doc={current.doc} days={current.days} visible={visible} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// A lighter-weight starfield just for the small phone screen — the shared
// StarfieldBackground's two full drifting layers are tuned for a full
// section-width backdrop and read as too busy at this scale.
function StarfieldBackgroundInline() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `radial-gradient(1px 1px at 20px 30px, rgba(255,255,255,0.8), transparent),
          radial-gradient(1px 1px at 90px 80px, rgba(255,255,255,0.6), transparent),
          radial-gradient(1.2px 1.2px at 150px 200px, rgba(255,255,255,0.75), transparent),
          radial-gradient(1px 1px at 60px 260px, rgba(255,255,255,0.5), transparent),
          radial-gradient(1px 1px at 190px 340px, rgba(255,255,255,0.6), transparent),
          radial-gradient(1px 1px at 40px 420px, rgba(255,255,255,0.5), transparent)`,
        backgroundRepeat: 'repeat',
        backgroundSize: '220px 480px',
        animation: 'starfield-drift 150s linear infinite alternate',
      }}
    />
  )
}
