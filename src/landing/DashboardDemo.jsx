import { useEffect, useRef, useState } from 'react'
import { DOC_TYPE_LABELS, AGENCY_BADGE, AGENCY_BADGE_COLOR, CARD_THEME, CARD_FIELD_SCHEMAS, DOC_CATEGORIES } from '../data/docTypes'
import satellitesIcon from '../assets/satellites.png'
import spaceTravelIcon from '../assets/space-travel.png'
import dangerIcon from '../assets/danger.png'
import fileIcon from '../assets/file.png'
import calendarIcon from '../assets/calendar.png'
import spaceIcon from '../assets/space.png'
import dfaLogo from '../assets/DFA logo.webp'
import orbitLogo from '../assets/orbit logo.png'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'My Space', iconSrc: satellitesIcon },
  { id: 'my_orbits', label: 'My Orbits', iconSrc: spaceTravelIcon },
  { id: 'notifications', label: 'Notifications', iconSrc: dangerIcon },
  { id: 'documents', label: 'Documents', iconSrc: fileIcon },
  { id: 'calendar', label: 'Calendar', iconSrc: calendarIcon },
  { id: 'history', label: 'History', iconSrc: spaceIcon },
]

const TRAVEL_CATEGORY = DOC_CATEGORIES.find((c) => c.id === 'travel')
const TRAVEL_TYPES = TRAVEL_CATEGORY.docTypeIds.slice(0, 6)

const CATEGORY_ICONS = {
  civil_registry: <><path d="M8 3h8l4 4v14H4V3z" /><path d="M8 3v4H4M9 12h6M9 16h6" /></>,
  local_gov: <><path d="M3 21h18M4 21V10l8-6 8 6v11M9 21v-6h6v6" /></>,
  identification: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8.5" cy="11" r="1.8" /><path d="M6 16c.5-1.8 1.9-2.5 2.5-2.5s2 .7 2.5 2.5M14 9h5M14 13h5" /></>,
  social_security: <><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" /><path d="M9 12l2 2 4-4" /></>,
  background_checks: <><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" /></>,
  taxation: <><path d="M4 3h13l3 3v15H4z" /><path d="M9 8h6M9 12h6M9 16h4" /></>,
  transportation: <><path d="M5 11l1.5-5A2 2 0 018.4 4.5h7.2a2 2 0 011.9 1.5L19 11" /><rect x="3" y="11" width="18" height="6" rx="2" /><circle cx="7.5" cy="17" r="1.3" /><circle cx="16.5" cy="17" r="1.3" /></>,
  travel: <><path d="M2.5 19.5L21 12.5 2.5 5.5l2 6.5-2 7.5z" /><path d="M4.5 12h5" /></>,
  other: <><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></>,
}

function Icon({ children, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}

function Bubble({ code, size = 26 }) {
  const color = AGENCY_BADGE_COLOR[code] || 'bg-slate-600'
  return (
    <div className={`rounded-full flex items-center justify-center shrink-0 ring-2 ring-[#0b1120] ${color}`} style={{ width: size, height: size }}>
      <span className="text-white font-bold tracking-tight leading-none" style={{ fontSize: size * 0.28 }}>{code}</span>
    </div>
  )
}

// Ten timeline "beats" driving the whole loop: which page/modal to show,
// where the fake cursor should travel to (a registered ref id), how long to
// rest there, and whether a click pulse fires before advancing.
const STEPS = [
  { page: 'dashboard', modal: null, target: null, hold: 3000 },
  { page: 'dashboard', modal: null, target: 'nav-my-orbits', hold: 450, click: true },
  { page: 'my_orbits', modal: null, target: null, hold: 1000 },
  { page: 'my_orbits', modal: null, target: 'add-orbit-tile', hold: 450, click: true },
  { page: 'my_orbits', modal: 'intent', target: null, hold: 750 },
  { page: 'my_orbits', modal: 'intent', target: 'intent-renewal', hold: 450, click: true },
  { page: 'my_orbits', modal: 'category', target: null, hold: 750 },
  { page: 'my_orbits', modal: 'category', target: 'category-travel', hold: 450, click: true },
  { page: 'my_orbits', modal: 'doctype', target: null, hold: 750 },
  { page: 'my_orbits', modal: 'doctype', target: 'doctype-passport', hold: 450, click: true },
  { page: 'my_orbits', modal: 'fill', target: null, hold: 1600 },
  { page: 'my_orbits', modal: 'fill', target: 'save-check', hold: 450, click: true },
  { page: 'my_orbits_saved', modal: null, target: null, hold: 2800 },
]

function Sidebar({ page, register }) {
  const activeId = page === 'dashboard' ? 'dashboard' : 'my_orbits'
  return (
    <aside className="w-48 shrink-0 flex flex-col gap-6 py-5 px-3">
      <div className="flex items-center gap-2 px-2">
        <img src={orbitLogo} alt="" className="w-6 h-6 object-contain" />
        <span className="font-dancing text-lg text-slate-100">Orbit</span>
      </div>
      <nav className="flex flex-col gap-1.5 flex-1">
        {NAV_ITEMS.map((item) => (
          <div
            key={item.id}
            ref={item.id === 'my_orbits' ? (el) => register('nav-my-orbits', el) : undefined}
            className={`flex items-center gap-3 px-2 py-2 rounded-xl text-sm ${
              item.id === activeId ? 'glass-chip-dark text-slate-100' : 'text-slate-400'
            }`}
          >
            <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0">
              <img src={item.iconSrc} alt="" className="w-[16px] h-[16px] object-contain" style={{ filter: 'invert(1) brightness(1.3)' }} />
            </span>
            {item.label}
          </div>
        ))}
      </nav>
    </aside>
  )
}

function Topbar() {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="glass-dark flex items-center gap-2 rounded-full px-4 py-2 text-slate-500 text-sm w-64">
        <Icon size={14}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></Icon>
        Search documents...
      </div>
      <div className="flex items-center gap-3">
        <span className="w-8 h-8 rounded-full glass-dark flex items-center justify-center text-slate-400">
          <Icon size={15}><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" /></Icon>
        </span>
        <span className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">E</span>
      </div>
    </div>
  )
}

function DashboardPage() {
  const points = 'M0,120 C 60,60 100,140 160,90 C 220,40 260,110 320,70 C 380,30 420,95 480,55'
  return (
    <div key="dashboard" style={{ animation: 'rise-in 0.6s cubic-bezier(0.16,1,0.3,1) both' }}>
      <h1 className="font-instrument text-[32px] leading-none text-slate-100" style={{ animation: 'hero-line-up 0.8s cubic-bezier(0.16,1,0.3,1) both' }}>
        Good morning, Explorer
      </h1>
      <p className="text-slate-400 text-sm mt-3">You're all set. Everything is up to date.</p>
      <svg viewBox="0 0 500 160" className="w-full mt-8" style={{ height: 140 }}>
        <path d={points} fill="none" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round" pathLength="1"
          style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: 'chart-draw 1.3s cubic-bezier(0.37,0.01,0.2,1) 0.4s forwards' }} />
      </svg>
      <div className="grid grid-cols-3 gap-3 mt-6">
        {['Passport', "Driver's License", 'NBI Clearance'].map((label, i) => (
          <div key={label} className="glass-dark rounded-xl p-3" style={{ animation: `slide-in-right 0.6s cubic-bezier(0.16,1,0.3,1) ${0.5 + i * 0.1}s both` }}>
            <p className="text-xs text-slate-400 truncate">{label}</p>
            <p className="text-sm font-semibold text-slate-100 mt-1">Active</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function MyOrbitsPage({ page, register }) {
  const saved = page === 'my_orbits_saved'
  return (
    <div key="my_orbits" style={{ animation: 'rise-in 0.5s cubic-bezier(0.16,1,0.3,1) both' }}>
      <h1 className="font-instrument text-3xl text-slate-100 mb-5">My Orbits</h1>
      <div
        ref={(el) => register('add-orbit-tile', el)}
        className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/15 text-slate-500 py-4 mb-4"
      >
        <Icon size={16}><path d="M12 5v14M5 12h14" /></Icon>
        Add Orbit
      </div>
      {saved && (
        <div className="glass-dark rounded-2xl p-4 flex items-center gap-3" style={{ animation: 'rise-in 0.5s cubic-bezier(0.16,1,0.3,1) both' }}>
          <img src={dfaLogo} alt="" className="w-9 h-9 rounded-full bg-white object-contain p-1" />
          <div>
            <p className="text-sm font-medium text-slate-100">Department of Foreign Affairs</p>
            <p className="text-xs text-slate-500 mt-0.5">1 document</p>
          </div>
        </div>
      )}
    </div>
  )
}

function ModalShell({ children }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
      <div className="glass-dark rounded-2xl p-5 w-[380px]" style={{ animation: 'rise-in 0.35s cubic-bezier(0.16,1,0.3,1) both' }}>
        {children}
      </div>
    </div>
  )
}

function IntentModal({ register }) {
  return (
    <ModalShell>
      <p className="font-semibold text-slate-100 mb-1">First time, or renewing?</p>
      <p className="text-xs text-slate-400 mb-4">This decides which steps we'll show you.</p>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/10 text-center">
          <span className="w-9 h-9 rounded-full bg-blue-500/15 text-blue-300 flex items-center justify-center">
            <Icon size={16}><path d="M12 5v14M5 12h14" /></Icon>
          </span>
          <span className="text-xs font-medium text-slate-100">Applying first time</span>
        </div>
        <div
          ref={(el) => register('intent-renewal', el)}
          className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/10 text-center"
        >
          <span className="w-9 h-9 rounded-full bg-emerald-500/15 text-emerald-300 flex items-center justify-center">
            <Icon size={16}><path d="M3 12a9 9 0 0115.3-6.4M21 12a9 9 0 01-15.3 6.4" /><path d="M21 3v6h-6M3 21v-6h6" /></Icon>
          </span>
          <span className="text-xs font-medium text-slate-100">I already have it</span>
        </div>
      </div>
    </ModalShell>
  )
}

function CategoryModal({ register }) {
  return (
    <ModalShell>
      <p className="font-semibold text-slate-100 mb-1">What are you adding?</p>
      <p className="text-xs text-slate-400 mb-4">Choose a category to get started.</p>
      <div className="grid grid-cols-3 gap-2">
        {DOC_CATEGORIES.slice(0, 6).map((cat) => (
          <div
            key={cat.id}
            ref={cat.id === 'travel' ? (el) => register('category-travel', el) : undefined}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-white/10 text-center"
          >
            <span className="w-8 h-8 rounded-lg bg-white/10 text-slate-200 flex items-center justify-center">
              <Icon size={15}>{CATEGORY_ICONS[cat.id]}</Icon>
            </span>
            <span className="text-[9px] text-slate-300 leading-tight">{cat.id === 'travel' ? 'Travel & Immigration' : cat.label}</span>
          </div>
        ))}
      </div>
    </ModalShell>
  )
}

function DocTypeModal({ register }) {
  return (
    <ModalShell>
      <p className="font-semibold text-slate-100 mb-1">Which one exactly?</p>
      <p className="text-xs text-slate-400 mb-4">Pick the specific document.</p>
      <div className="grid grid-cols-3 gap-2">
        {TRAVEL_TYPES.map((id) => (
          <div
            key={id}
            ref={id === 'passport' ? (el) => register('doctype-passport', el) : undefined}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-white/10 text-center"
          >
            <Bubble code={AGENCY_BADGE[id].label} size={28} />
            <span className="text-[9px] text-slate-300 leading-tight">{DOC_TYPE_LABELS[id]}</span>
          </div>
        ))}
      </div>
    </ModalShell>
  )
}

function FillModal({ register }) {
  const theme = CARD_THEME.passport
  const schema = CARD_FIELD_SCHEMAS.passport
  return (
    <ModalShell>
      <div className="flex items-center gap-2 mb-3">
        <div className="flex gap-1 flex-1">
          {[0, 1, 2].map((i) => <div key={i} className="h-1 flex-1 rounded-full bg-blue-400" />)}
        </div>
      </div>
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-medium text-slate-100">Passport</span>
        <div className="flex items-center gap-1">
          <span className="p-1.5 rounded-full text-slate-500"><Icon size={14}><path d="M15 18l-6-6 6-6" /></Icon></span>
          <span ref={(el) => register('save-check', el)} className="p-1.5 rounded-full text-emerald-400">
            <Icon size={14}><path d="M20 6L9 17l-5-5" /></Icon>
          </span>
          <span className="p-1.5 rounded-full text-slate-500"><Icon size={14}><path d="M18 6L6 18M6 6l12 12" /></Icon></span>
        </div>
      </div>
      <div className={`bg-gradient-to-br ${theme.gradient} rounded-2xl overflow-hidden text-white p-4 border border-white/15`}>
        <p className="text-[8px] font-semibold tracking-wide opacity-75">{theme.agency}</p>
        <p className="text-[8px] font-semibold tracking-wide opacity-75">{theme.office}</p>
        <p className="text-sm font-bold tracking-wide mt-1 mb-3">{theme.docName}</p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
          {schema.slice(0, 4).map((f) => (
            <div key={f.key} className={f.span === 2 ? 'col-span-2' : ''}>
              <p className="text-[7px] uppercase tracking-wide opacity-70">{f.label}</p>
              <p className="text-[11px] font-medium">{f.default || '—'}</p>
            </div>
          ))}
        </div>
      </div>
    </ModalShell>
  )
}

export default function DashboardDemo() {
  const [stepIndex, setStepIndex] = useState(0)
  const [cursor, setCursor] = useState({ x: 0, y: 0, visible: false })
  const [pulseKey, setPulseKey] = useState(0)
  const [paused, setPaused] = useState(false)
  const refs = useRef({})
  const containerRef = useRef(null)
  const [reducedMotion] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)

  function register(id, el) {
    refs.current[id] = el
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => setPaused(!entry.isIntersecting), { threshold: 0.15 })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (paused || reducedMotion) return
    const step = STEPS[stepIndex]
    let mountTimer, arriveTimer, advanceTimer

    mountTimer = setTimeout(() => {
      if (step.target) {
        const el = refs.current[step.target]
        const container = containerRef.current
        if (el && container) {
          const elRect = el.getBoundingClientRect()
          const containerRect = container.getBoundingClientRect()
          setCursor({
            x: elRect.left - containerRect.left + elRect.width / 2,
            y: elRect.top - containerRect.top + elRect.height / 2,
            visible: true,
          })
        }
        arriveTimer = setTimeout(() => {
          if (step.click) setPulseKey((k) => k + 1)
          advanceTimer = setTimeout(() => setStepIndex((i) => (i + 1) % STEPS.length), step.hold)
        }, 650)
      } else {
        advanceTimer = setTimeout(() => setStepIndex((i) => (i + 1) % STEPS.length), step.hold)
      }
    }, 80)

    return () => {
      clearTimeout(mountTimer)
      clearTimeout(arriveTimer)
      clearTimeout(advanceTimer)
    }
  }, [stepIndex, paused, reducedMotion])

  const step = STEPS[stepIndex]

  return (
    <div className="w-full max-w-6xl mx-auto px-6">
      <div className="text-center mb-8">
        <h2 className="font-instrument text-white text-3xl md:text-4xl">See Orbit in action</h2>
        <p className="text-white/50 text-sm mt-3">A quick look at tracking a document from start to finish.</p>
      </div>
      <div
        ref={containerRef}
        className="relative w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
        style={{ aspectRatio: '16 / 9.2', background: 'linear-gradient(160deg, #0b1220 0%, #060c16 100%)' }}
      >
        <div className="flex h-full">
          <Sidebar page={step.page} register={register} />
          <div className="flex-1 min-w-0 p-6 pt-5 relative overflow-hidden">
            <Topbar />
            {step.page === 'dashboard' && <DashboardPage />}
            {(step.page === 'my_orbits' || step.page === 'my_orbits_saved') && (
              <MyOrbitsPage page={step.page} register={register} />
            )}
            {step.modal === 'intent' && <IntentModal register={register} />}
            {step.modal === 'category' && <CategoryModal register={register} />}
            {step.modal === 'doctype' && <DocTypeModal register={register} />}
            {step.modal === 'fill' && <FillModal register={register} />}
          </div>
        </div>

        {cursor.visible && !reducedMotion && (
          <>
            <div
              className="absolute w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)] pointer-events-none z-20"
              style={{
                left: cursor.x,
                top: cursor.y,
                transform: 'translate(-50%, -50%)',
                transition: 'left 0.65s cubic-bezier(0.65,0,0.35,1), top 0.65s cubic-bezier(0.65,0,0.35,1)',
              }}
            />
            <div
              key={pulseKey}
              className="absolute w-3.5 h-3.5 rounded-full pointer-events-none z-10"
              style={{
                left: cursor.x,
                top: cursor.y,
                transform: 'translate(-50%, -50%)',
                animation: pulseKey ? 'pulse-ring 0.6s ease-out' : 'none',
              }}
            />
          </>
        )}
      </div>
    </div>
  )
}
