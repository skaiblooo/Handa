import { useEffect, useRef, useState } from 'react'
import { DOC_TYPE_LABELS, AGENCY_BADGE, AGENCY_BADGE_COLOR, CARD_THEME, CARD_FIELD_SCHEMAS, DOC_CATEGORIES } from '../data/docTypes'
import PeekingBlip from './PeekingBlip'
import { ScreenGrain } from './ScreenTexture'
import satellitesIcon from '../assets/satellites.png'
import spaceTravelIcon from '../assets/space-travel.png'
import notificationIcon from '../assets/notification.png'
import documentIcon from '../assets/document.png'
import calendarSettingsIcon from '../assets/calendar (1).png'
import historyIcon from '../assets/history.png'
import settingsIcon from '../assets/settings.png'
import dfaLogo from '../assets/DFA logo.webp'
import nbiLogo from '../assets/NBI logo.webp'
import ltoLogo from '../assets/LTO LOGO.webp'
import philhealthLogo from '../assets/PHILHEALTH logo.webp'
import biLogo from '../assets/bi logo.webp'
import praLogo from '../assets/pra logo.webp'
import orbitLogo from '../assets/orbit logo.png'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'My Space', iconSrc: satellitesIcon },
  { id: 'my_orbits', label: 'My Orbits', iconSrc: spaceTravelIcon },
  { id: 'notifications', label: 'Notifs', iconSrc: notificationIcon },
  { id: 'documents', label: 'Documents', iconSrc: documentIcon },
  { id: 'calendar', label: 'Calendar', iconSrc: calendarSettingsIcon },
  { id: 'history', label: 'History', iconSrc: historyIcon },
]

const DEPARTMENT_LOGOS = { DFA: dfaLogo, NBI: nbiLogo, LTO: ltoLogo, PH: philhealthLogo, BI: biLogo, PRA: praLogo }

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

function Bubble({ code, size = 26, ring = true }) {
  const logo = DEPARTMENT_LOGOS[code]
  const color = AGENCY_BADGE_COLOR[code] || 'bg-slate-600'
  return (
    <div
      className={`rounded-full overflow-hidden flex items-center justify-center shrink-0 ${ring ? 'ring-2 ring-[#0b1120]' : ''} ${logo ? 'bg-white' : color}`}
      style={{ width: size, height: size }}
    >
      {logo ? (
        <img src={logo} alt="" className="w-full h-full object-contain" style={{ padding: size <= 20 ? 1.5 : 4 }} />
      ) : (
        <span className="text-white font-bold tracking-tight leading-none" style={{ fontSize: size * 0.28 }}>{code}</span>
      )}
    </div>
  )
}

// Same hover/press visual language as the real dashboard's glass-interactive
// utility (translateY(-1px) scale(1.012) + highlight on hover, scale(0.965)
// on press) — reproduced with inline styles here because the demo's cursor
// is scripted, not a real pointer, so CSS :hover/:active never fire on
// their own; this is driven by the timeline instead.
function liftStyle(hovered, pressed) {
  if (pressed) return { transform: 'scale(0.965)', transition: 'transform 0.15s cubic-bezier(0.34,1.56,0.64,1)' }
  if (hovered) {
    return {
      transform: 'translateY(-1px) scale(1.012)',
      boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.4), 0 10px 24px -10px rgba(15,23,42,0.35)',
      transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease',
    }
  }
  return { transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease' }
}

// Sample data typed into the ID card mid-loop, to make "filling out a
// document" a visible beat rather than a jump from blank to saved.
const TYPED_NAME = 'Capacio, Marc Santos'
const TYPED_DOB = '04/12/1998'
const TYPED_EXPIRY = '08/15/2035'

// FillModal only ever mounts while the 'fill' step is active and unmounts
// the moment it isn't (the parent conditionally renders it), so the typing
// effect just needs to run once per mount — no separate "active" flag or
// reset branch needed.
function useTypewriter(text, { startDelay = 0, speed = 42 } = {}) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let i = 0
    let interval
    const start = setTimeout(() => {
      interval = setInterval(() => {
        i += 1
        setCount(i)
        if (i >= text.length) clearInterval(interval)
      }, speed)
    }, startDelay)
    return () => {
      clearTimeout(start)
      clearInterval(interval)
    }
  }, [text, startDelay, speed])
  return text.slice(0, count)
}

// Ticks a stat up from 0 to `target` on mount, ease-out — the classic
// promo-video "number that lands" beat. Since DashboardPage/DemoChart only
// exist in the tree while step.page === 'dashboard', they get a fresh
// mount (and a fresh count-up) every time the loop comes back around.
function useCountUp(target, { duration = 900, delay = 0 } = {}) {
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const [value, setValue] = useState(prefersReduced ? target : 0)
  useEffect(() => {
    if (prefersReduced) return
    let raf
    const startTimer = setTimeout(() => {
      const start = performance.now()
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration)
        setValue(Math.round((1 - Math.pow(1 - t, 3)) * target))
        if (t < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }, delay)
    return () => {
      clearTimeout(startTimer)
      cancelAnimationFrame(raf)
    }
  }, [target, duration, delay, prefersReduced])
  return value
}

// Windows-style arrow pointer (white glyph, dark outline) — positioned by
// its tip rather than centered, like a real cursor. Tilts and shrinks
// slightly on "click" instead of drawing a separate ripple, so it reads as
// the cursor itself clicking rather than an overlay effect.
function CursorGlyph({ x, y, clicking }) {
  return (
    <div
      className="absolute pointer-events-none z-30"
      style={{
        left: x - 2,
        top: y - 1,
        transform: clicking ? 'scale(0.82) rotate(-6deg)' : 'scale(1) rotate(0deg)',
        transformOrigin: '4px 2px',
        transition: clicking
          ? 'left 0.5s cubic-bezier(0.65,0,0.35,1), top 0.5s cubic-bezier(0.65,0,0.35,1), transform 0.09s ease-out'
          : 'left 0.5s cubic-bezier(0.65,0,0.35,1), top 0.5s cubic-bezier(0.65,0,0.35,1), transform 0.15s cubic-bezier(0.34,1.56,0.64,1)',
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.55))' }}>
        <path
          d="M4 2 L4 19.5 L8.4 15.6 L11.4 21.8 L14.2 20.4 L11.2 14.3 L17.2 14.3 Z"
          fill="white"
          stroke="#1a1a1a"
          strokeWidth="1.3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

// Twelve timeline "beats" driving the whole loop: which page/modal to show,
// where the fake cursor should travel to (a registered ref id), how long to
// rest there, whether a click fires before advancing, and whether the whole
// screen should punch in on that spot (see the zoom transform below) so a
// viewer's eye is pointed at the same thing the cursor is doing.
//
// `zoom` is deliberately marked on more than just the click beats: the
// intent/category/doctype modal-picking run (steps 4-9) is three clicks in
// quick succession, and zooming out to show the full page between each one
// just to zoom straight back in on the next tiny option was the "too much
// zooming" complaint — those in-between "modal just opened" beats stay
// zoomed (zoom:true, no target of their own) so the screen only pans to the
// next spot instead of pulsing out and back in every ~500ms. Steps that are
// a genuine new full-page view worth seeing whole (my_orbits list, the fill
// modal's typing animation, the saved list, the final steps modal) are left
// zoom:false so the loop actually zooms out there instead of never resting.
const STEPS = [
  { page: 'dashboard', modal: null, target: null, hold: 2200 },
  { page: 'dashboard', modal: null, target: 'nav-my-orbits', hold: 400, click: true, zoom: true },
  { page: 'my_orbits', modal: null, target: null, hold: 800 },
  { page: 'my_orbits', modal: null, target: 'add-orbit-tile', hold: 400, click: true, zoom: true },
  { page: 'my_orbits', modal: 'intent', target: null, hold: 550, zoom: true },
  { page: 'my_orbits', modal: 'intent', target: 'intent-renewal', hold: 400, click: true, zoom: true },
  { page: 'my_orbits', modal: 'category', target: null, hold: 550, zoom: true },
  { page: 'my_orbits', modal: 'category', target: 'category-travel', hold: 400, click: true, zoom: true },
  { page: 'my_orbits', modal: 'doctype', target: null, hold: 550, zoom: true },
  { page: 'my_orbits', modal: 'doctype', target: 'doctype-passport', hold: 400, click: true, zoom: true },
  { page: 'my_orbits', modal: 'fill', target: null, hold: 2900 },
  { page: 'my_orbits', modal: 'fill', target: 'save-check', hold: 400, click: true, zoom: true },
  { page: 'my_orbits_saved', modal: null, target: null, hold: 900 },
  { page: 'my_orbits_saved', modal: null, target: 'saved-orbit-card', hold: 400, click: true, zoom: true },
  { page: 'my_orbits_saved', modal: 'steps', target: null, hold: 4400 },
]

// Collapses to icon-only once on My Orbits, matching the real dashboard's
// collapsed sidebar (small label under the icon, not hidden entirely).
function Sidebar({ page, hoveredId, pressedId, register }) {
  const activeId = page === 'dashboard' ? 'dashboard' : 'my_orbits'
  const collapsed = page === 'my_orbits' || page === 'my_orbits_saved'
  return (
    <aside className={`shrink-0 flex flex-col gap-6 py-5 transition-all duration-300 ${collapsed ? 'w-20 px-3' : 'w-48 px-3'}`}>
      <div className={`flex items-center gap-2 ${collapsed ? 'justify-center' : 'px-2'}`}>
        <img src={orbitLogo} alt="" className="w-6 h-6 object-contain shrink-0" />
        {!collapsed && <span className="font-dancing text-lg text-slate-100 whitespace-nowrap">Orbit</span>}
      </div>
      <nav className="flex flex-col gap-1.5 flex-1">
        {NAV_ITEMS.map((item) => {
          const isTarget = item.id === 'my_orbits'
          const hovered = isTarget && hoveredId === 'nav-my-orbits'
          const pressed = isTarget && pressedId === 'nav-my-orbits'
          const active = item.id === activeId
          return (
            <div
              key={item.id}
              ref={isTarget ? (el) => register('nav-my-orbits', el) : undefined}
              className={`flex items-center rounded-xl text-sm transition-colors duration-150 ${
                collapsed ? 'flex-col gap-0.5 py-2 px-1 justify-center text-center' : 'gap-3 px-2 py-2'
              } ${
                active ? 'glass-chip-dark text-slate-100' : hovered ? 'bg-white/5 text-slate-100' : 'text-slate-400'
              }`}
              style={liftStyle(hovered, pressed)}
            >
              <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0">
                <img src={item.iconSrc} alt="" className="w-[18px] h-[18px] object-contain" style={{ filter: 'invert(1) brightness(1.3)' }} />
              </span>
              {collapsed ? <span className="text-[9px] leading-tight font-medium">{item.label}</span> : item.label}
            </div>
          )
        })}
      </nav>
      <div className="flex flex-col gap-1 pt-4">
        <div className={`flex items-center rounded-xl text-sm text-slate-400 ${collapsed ? 'flex-col gap-0.5 py-2 px-1 justify-center text-center' : 'gap-3 px-2 py-2'}`}>
          <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0">
            <img src={settingsIcon} alt="" className="w-[18px] h-[18px] object-contain" style={{ filter: 'invert(1) brightness(1.3)' }} />
          </span>
          {collapsed ? <span className="text-[9px] leading-tight font-medium">Settings</span> : 'Settings'}
        </div>
        <div className={`flex items-center rounded-xl text-sm text-slate-400 ${collapsed ? 'flex-col gap-0.5 py-2 px-1 justify-center text-center' : 'gap-3 px-2 py-2'}`}>
          <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0">
            <Icon size={15}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></Icon>
          </span>
          {collapsed ? <span className="text-[9px] leading-tight font-medium">Log out</span> : 'Log out'}
        </div>
      </div>
    </aside>
  )
}

// Matches the real topbar's user-menu pill exactly: letter avatar, name +
// email stacked, chevron — just with a placeholder letter instead of a
// real photo, since this is a demo account.
function Topbar() {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="glass-dark flex items-center gap-2 rounded-full px-4 py-2 text-slate-500 text-sm w-64">
        <Icon size={14}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></Icon>
        Search documents...
      </div>
      <div className="flex items-center gap-3">
        <span className="w-8 h-8 rounded-full glass-dark flex items-center justify-center text-slate-400">
          <img src={notificationIcon} alt="" className="w-[16px] h-[16px] object-contain" style={{ filter: 'invert(1) brightness(1.3)' }} />
        </span>
        <div className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-full">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-semibold text-white shrink-0">E</div>
          <div className="hidden sm:flex flex-col items-start leading-tight">
            <span className="text-sm font-semibold text-slate-100">Explorer</span>
            <span className="text-xs text-slate-400">explorer@orbit.app</span>
          </div>
          <Icon size={14}><path d="M6 9l6 6 6-6" /></Icon>
        </div>
      </div>
    </div>
  )
}

// Faithful, condensed recreation of buildSmoothPath + DocumentStatsChart —
// same viewBox proportions, same gradient defs, same chart-draw/
// chart-fill-wipe animation names, same month-label row underneath.
function buildSmoothPath(points) {
  if (points.length < 2) return ''
  let d = `M ${points[0].x},${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i]
    const p1 = points[i + 1]
    const midX = (p0.x + p1.x) / 2
    d += ` C ${midX},${p0.y} ${midX},${p1.y} ${p1.x},${p1.y}`
  }
  return d
}

const CHART_MONTHS = [
  { label: 'Aug', count: 1 },
  { label: 'Sep', count: 0 },
  { label: 'Oct', count: 2 },
  { label: 'Nov', count: 1 },
  { label: 'Dec', count: 3 },
  { label: 'Jan', count: 1 },
]

function DemoChart() {
  const width = 500
  const height = 160
  const topPad = 18
  const bottomPad = 24
  const maxCount = Math.max(1, ...CHART_MONTHS.map((m) => m.count))
  const totalUpcoming = CHART_MONTHS.reduce((sum, m) => sum + m.count, 0)
  const displayedTotal = useCountUp(totalUpcoming, { duration: 900, delay: 600 })
  const points = CHART_MONTHS.map((m, i) => ({
    x: (i / (CHART_MONTHS.length - 1)) * width,
    y: height - bottomPad - (m.count / maxCount) * (height - topPad - bottomPad),
  }))
  const linePath = buildSmoothPath(points)
  const fillPath = `${linePath} L ${width},${height} L 0,${height} Z`

  return (
    <div className="glass-dark rounded-2xl p-5 mt-6" style={{ animation: 'rise-in 0.8s cubic-bezier(0.16,1,0.3,1) 0.75s both' }}>
      <p className="text-xs font-semibold tracking-widest uppercase text-slate-400">UPCOMING EXPIRATIONS</p>
      <p className="font-instrument text-4xl mt-1.5 text-slate-100">{displayedTotal}</p>
      <p className="text-xs mt-0.5 text-slate-500 mb-4">Due over the next 6 months</p>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full" style={{ height: 120, display: 'block' }}>
        <defs>
          <linearGradient id="demo-chart-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="12%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="88%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="demo-chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
          </linearGradient>
          <clipPath id="demo-chart-clip"><rect width={width} height={height} /></clipPath>
        </defs>
        <g clipPath="url(#demo-chart-clip)">
          <g style={{ transformOrigin: '0px 0px', animation: 'chart-fill-wipe 1.1s cubic-bezier(0.37,0.01,0.2,1) 1.1s both' }}>
            <path d={fillPath} fill="url(#demo-chart-fill)" />
          </g>
          <path
            d={linePath}
            fill="none"
            stroke="url(#demo-chart-line)"
            strokeWidth="3"
            strokeLinecap="round"
            pathLength="1"
            style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: 'chart-draw 1.3s cubic-bezier(0.37,0.01,0.2,1) 0.85s both' }}
          />
        </g>
      </svg>
      <div className="flex justify-between mt-1">
        {CHART_MONTHS.map((m, i) => (
          <span key={`${m.label}-${i}`} className={`text-xs ${i === 0 ? 'text-slate-100 font-semibold' : 'text-slate-500'}`}>{m.label}</span>
        ))}
      </div>
    </div>
  )
}

// Mirrors the real My Space's second stat card (Estimated Renewal Costs) —
// static numbers here since the demo has no real documents to sum, but the
// card chrome matches so this column reads as the same two-card stack the
// actual dashboard shows, not an invented layout.
function DemoCostCard() {
  const low = useCountUp(715, { duration: 900, delay: 700 })
  const high = useCountUp(1430, { duration: 900, delay: 700 })
  return (
    <div className="glass-dark rounded-2xl p-5 mt-4" style={{ animation: 'rise-in 0.8s cubic-bezier(0.16,1,0.3,1) 0.85s both' }}>
      <p className="text-xs font-semibold tracking-widest uppercase text-slate-400">ESTIMATED RENEWAL COSTS</p>
      <p className="font-instrument text-4xl mt-1.5 text-slate-100">&#8369;{low.toLocaleString('en-US')}&ndash;&#8369;{high.toLocaleString('en-US')}</p>
      <p className="text-xs mt-0.5 text-slate-500">Across 3 tracked documents</p>
    </div>
  )
}

const RAIL_DOCS = [
  { label: 'NBI Clearance', code: 'NBI', day: 'Expired', status: 'Expired', big: true },
  { label: "Driver's License", day: '1 year, 6 months left' },
  { label: 'PhilHealth', day: '2 years left' },
]

// Mounts once per loop (DashboardPage only renders while step.page ===
// 'dashboard', so it's a fresh mount every cycle) — the staggered
// slide-in-right delays are relative to that mount, not to any external
// clock, so they can't drift out of sync with re-renders from cursor state
// changes elsewhere in the tree.
function UrgentRail() {
  return (
    <div className="flex flex-col gap-3 lg:w-[190px] shrink-0">
      {RAIL_DOCS.map((doc, i) => (
        <div
          key={doc.label}
          className={`glass-dark rounded-2xl w-full ${doc.big ? 'p-4' : 'p-3 flex items-center justify-between gap-3'}`}
          style={{ animation: `slide-in-right 0.7s cubic-bezier(0.16,1,0.3,1) ${0.55 + i * 0.12}s both` }}
        >
          {doc.big ? (
            <>
              <p className="flex items-center gap-1.5 text-xs text-slate-400">
                <Bubble code={doc.code} size={16} ring={false} />
                <span className="truncate">{doc.label}</span>
              </p>
              <p className="text-2xl font-medium tracking-tight mt-2 text-slate-100">{doc.day}</p>
              <p className="text-xs mt-1.5 text-slate-400">{doc.status}</p>
            </>
          ) : (
            <div className="min-w-0">
              <p className="text-xs truncate text-slate-400">{doc.label}</p>
              <p className="text-sm font-semibold mt-0.5 text-slate-100">{doc.day}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function DashboardPage() {
  return (
    <div key="dashboard" className="flex flex-col lg:flex-row gap-8" style={{ animation: 'rise-in 0.6s cubic-bezier(0.16,1,0.3,1) both' }}>
      <div className="flex-1 min-w-0">
        <h1 className="font-instrument text-[30px] leading-[0.98] tracking-tight text-slate-100">
          <span className="block overflow-hidden pb-[0.15em] -mb-[0.15em]">
            <span className="block" style={{ animation: 'hero-line-up 0.9s cubic-bezier(0.16,1,0.3,1) 0.05s both' }}>Welcome Aboard,</span>
          </span>
          <span className="block overflow-hidden pb-[0.15em] -mb-[0.15em]">
            <span className="block" style={{ animation: 'hero-line-up 0.9s cubic-bezier(0.16,1,0.3,1) 0.16s both' }}>Explorer</span>
          </span>
        </h1>
        <p className="mt-3 text-sm text-slate-400" style={{ animation: 'rise-in 0.7s cubic-bezier(0.16,1,0.3,1) 0.5s both' }}>
          You're all set. Everything is up to date.
        </p>
        <DemoChart />
        <DemoCostCard />
      </div>
      <UrgentRail />
    </div>
  )
}

// Pre-existing orbits shown before the demo adds a 4th — matches the three
// documents already visible in the My Space rail (NBI, Driver's License,
// PhilHealth), so "3 documents tracked" reads the same on both tabs.
const EXISTING_ORBITS = [
  { code: 'NBI', name: 'National Bureau of Investigation', count: 1 },
  { code: 'LTO', name: 'Land Transportation Office', count: 1 },
  { code: 'PH', name: 'PhilHealth', count: 1 },
]

function OrbitRow({ code, name, count, id, register, hoveredId, pressedId }) {
  const hovered = id && hoveredId === id
  const pressed = id && pressedId === id
  return (
    <div
      ref={id ? (el) => register(id, el) : undefined}
      className="glass-dark rounded-2xl p-4 flex items-center gap-3"
      style={{ animation: 'rise-in 0.5s cubic-bezier(0.16,1,0.3,1) both', ...liftStyle(hovered, pressed) }}
    >
      <Bubble code={code} size={36} ring={false} />
      <div>
        <p className="text-sm font-medium text-slate-100">{name}</p>
        <p className="text-xs text-slate-500 mt-0.5">{count} document{count === 1 ? '' : 's'}</p>
      </div>
    </div>
  )
}

function MyOrbitsPage({ page, hoveredId, pressedId, register }) {
  const saved = page === 'my_orbits_saved'
  const hovered = hoveredId === 'add-orbit-tile'
  return (
    <div key="my_orbits" style={{ animation: 'rise-in 0.5s cubic-bezier(0.16,1,0.3,1) both' }}>
      <h1 className="font-instrument text-3xl text-slate-100 mb-5">My Orbits</h1>
      <div
        ref={(el) => register('add-orbit-tile', el)}
        className={`flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-4 mb-4 ${
          hovered ? 'border-white/30 text-slate-300' : 'border-white/15 text-slate-500'
        }`}
        style={{ transition: 'color 0.2s ease, border-color 0.2s ease', ...(pressedId === 'add-orbit-tile' ? { transform: 'scale(0.98)' } : {}) }}
      >
        <Icon size={16}><path d="M12 5v14M5 12h14" /></Icon>
        Add Orbit
      </div>
      <div className="flex flex-col gap-3">
        {EXISTING_ORBITS.map((orbit) => (
          <OrbitRow key={orbit.code} {...orbit} register={register} hoveredId={hoveredId} pressedId={pressedId} />
        ))}
        {saved && (
          <OrbitRow code="DFA" name="Department of Foreign Affairs" count={1} id="saved-orbit-card" register={register} hoveredId={hoveredId} pressedId={pressedId} />
        )}
      </div>
    </div>
  )
}

function ModalShell({ children, wide }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl p-4">
      <div
        className={`overflow-y-auto no-scrollbar rounded-2xl ${wide ? 'w-full h-full p-4 bg-[#0a0a0f] border border-white/10' : 'w-[380px] p-5 md:p-6 glass-dark'}`}
        style={{ animation: 'rise-in 0.35s cubic-bezier(0.16,1,0.3,1) both' }}
      >
        {children}
      </div>
    </div>
  )
}

function OptionTile({ id, hoveredId, pressedId, register, children, className }) {
  const hovered = hoveredId === id
  const pressed = pressedId === id
  return (
    <div
      ref={(el) => register(id, el)}
      className={`${className} ${hovered ? 'bg-white/5 border-white/20' : 'border-white/10'}`}
      style={pressed ? { transform: 'scale(0.97)', transition: 'transform 0.15s ease' } : { transition: 'background-color 0.2s ease, border-color 0.2s ease' }}
    >
      {children}
    </div>
  )
}

function IntentModal({ hoveredId, pressedId, register }) {
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
        <OptionTile id="intent-renewal" hoveredId={hoveredId} pressedId={pressedId} register={register} className="flex flex-col items-center gap-2 p-4 rounded-xl border text-center">
          <span className="w-9 h-9 rounded-full bg-emerald-500/15 text-emerald-300 flex items-center justify-center">
            <Icon size={16}><path d="M3 12a9 9 0 0115.3-6.4M21 12a9 9 0 01-15.3 6.4" /><path d="M21 3v6h-6M3 21v-6h6" /></Icon>
          </span>
          <span className="text-xs font-medium text-slate-100">I already have it</span>
        </OptionTile>
      </div>
    </ModalShell>
  )
}

function CategoryModal({ hoveredId, pressedId, register }) {
  return (
    <ModalShell>
      <p className="font-semibold text-slate-100 mb-1">What are you adding?</p>
      <p className="text-xs text-slate-400 mb-4">Choose a category to get started.</p>
      <div className="grid grid-cols-3 gap-2">
        {DOC_CATEGORIES.map((cat) => (
          <OptionTile
            key={cat.id}
            id={cat.id === 'travel' ? 'category-travel' : `cat-${cat.id}`}
            hoveredId={hoveredId}
            pressedId={pressedId}
            register={register}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-center"
          >
            <span className="w-8 h-8 rounded-lg bg-white/10 text-slate-200 flex items-center justify-center">
              <Icon size={15}>{CATEGORY_ICONS[cat.id]}</Icon>
            </span>
            <span className="text-[9px] text-slate-300 leading-tight">{cat.id === 'travel' ? 'Travel & Immigration' : cat.label}</span>
          </OptionTile>
        ))}
      </div>
    </ModalShell>
  )
}

function DocTypeModal({ hoveredId, pressedId, register }) {
  return (
    <ModalShell>
      <p className="font-semibold text-slate-100 mb-1">Which one exactly?</p>
      <p className="text-xs text-slate-400 mb-4">Pick the specific document.</p>
      <div className="grid grid-cols-3 gap-2">
        {TRAVEL_TYPES.map((id) => (
          <OptionTile
            key={id}
            id={id === 'passport' ? 'doctype-passport' : `doctype-${id}`}
            hoveredId={hoveredId}
            pressedId={pressedId}
            register={register}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-center"
          >
            <Bubble code={AGENCY_BADGE[id].label} size={28} />
            <span className="text-[9px] text-slate-300 leading-tight">{DOC_TYPE_LABELS[id]}</span>
          </OptionTile>
        ))}
      </div>
    </ModalShell>
  )
}

function FillModal({ hoveredId, pressedId, register }) {
  const theme = CARD_THEME.passport
  const schema = CARD_FIELD_SCHEMAS.passport
  const name = useTypewriter(TYPED_NAME, { startDelay: 300, speed: 32 })
  const dob = useTypewriter(TYPED_DOB, { startDelay: 1200, speed: 55 })
  const expiry = useTypewriter(TYPED_EXPIRY, { startDelay: 2000, speed: 55 })
  const typingName = name.length > 0 && name.length < TYPED_NAME.length
  const typingDob = dob.length > 0 && dob.length < TYPED_DOB.length
  const typingExpiry = expiry.length > 0 && expiry.length < TYPED_EXPIRY.length
  const fieldValue = { fullName: name, dob, nationality: 'FILIPINO' }
  const hovered = hoveredId === 'save-check'
  const pressed = pressedId === 'save-check'

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
          <span
            ref={(el) => register('save-check', el)}
            className={`p-1.5 rounded-full text-emerald-400 ${hovered ? 'drop-shadow-[0_0_6px_rgba(52,211,153,0.9)]' : ''}`}
            style={pressed ? { transform: 'scale(0.9)', transition: 'transform 0.15s ease' } : { transition: 'transform 0.2s ease' }}
          >
            <Icon size={14}><path d="M20 6L9 17l-5-5" /></Icon>
          </span>
          <span className="p-1.5 rounded-full text-slate-500"><Icon size={14}><path d="M18 6L6 18M6 6l12 12" /></Icon></span>
        </div>
      </div>
      <div className={`${theme.card} rounded-2xl overflow-hidden text-white p-4 border border-white/15`}>
        <p className="text-[8px] font-semibold tracking-wide opacity-75">{theme.agency}</p>
        <p className="text-[8px] font-semibold tracking-wide opacity-75">{theme.office}</p>
        <p className="text-sm font-bold tracking-wide mt-1 mb-3">{theme.docName}</p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
          {schema.slice(0, 4).map((f) => {
            const value = fieldValue[f.key]
            const isTyping = (f.key === 'fullName' && typingName) || (f.key === 'dob' && typingDob)
            return (
              <div key={f.key} className={f.span === 2 ? 'col-span-2' : ''}>
                <p className="text-[7px] uppercase tracking-wide opacity-70">{f.label}</p>
                <p className="text-[11px] font-medium min-h-[13px]">
                  {value || f.default || '—'}
                  {isTyping && <span className="animate-pulse">|</span>}
                </p>
              </div>
            )
          })}
        </div>
        <div className="flex justify-end mt-2.5 pt-2 border-t border-white/15">
          <div className="text-right">
            <p className="text-[7px] uppercase tracking-wide opacity-70">Expiry Date</p>
            <p className="text-[11px] font-medium min-h-[13px]">
              {expiry || '—'}
              {typingExpiry && <span className="animate-pulse">|</span>}
            </p>
          </div>
        </div>
      </div>
    </ModalShell>
  )
}

// Real passport-renewal step data (data/playbooks.js: passport.renewal),
// since the demo's flow chose "I already have it" earlier.
const PASSPORT_RENEWAL_STEPS = [
  { title: 'Book DFA Appointment', description: 'Book an appointment through the DFA appointment website', tags: ['Stable internet connection', 'Email address'] },
  { title: 'Fill Out & Pay Online', description: 'Fill out the online application form and pay the applicable fee', tags: ['Payment method', 'Basic personal info'] },
  { title: 'Appear at DFA Site', description: 'Appear at your chosen DFA site on your appointment date with required documents', tags: ['Current passport', 'Valid ID', 'Confirmed appointment'] },
  { title: 'Biometrics Capture', description: 'Have your biometrics (photo, fingerprints) captured on-site', tags: ['Appear in person'] },
  { title: 'Track & Receive', description: 'Track your passport status online and claim or wait for delivery', tags: ['Reference number', 'Valid ID for claiming'] },
]

// Full recreation of PlaybookModal's "How to Apply" step view — same
// pieces as the real modal (header, progress bar, step counter + dots,
// the illustration/number step card with tags and a "mark as done" row,
// Previous/Next controls, the emerald accent once the final step is
// reached, the all-steps chip grid, the cost/time footer, and the
// feedback prompt at the bottom) using the real passport-renewal step
// data, just condensed to fit the demo frame's fixed height. Cycles
// currentStep on its own timer, "checking off" each step shortly before
// advancing, so every step — and the completed/final states — actually
// gets shown rather than freezing on step 1.
function StepsModal() {
  const totalSteps = PASSPORT_RENEWAL_STEPS.length
  const [currentStep, setCurrentStep] = useState(0)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    setChecked(false)
    const checkTimer = setTimeout(() => setChecked(true), 500)
    let advanceTimer
    if (currentStep < totalSteps - 1) {
      advanceTimer = setTimeout(() => setCurrentStep((i) => i + 1), 850)
    }
    return () => {
      clearTimeout(checkTimer)
      clearTimeout(advanceTimer)
    }
  }, [currentStep, totalSteps])

  const step = PASSPORT_RENEWAL_STEPS[currentStep]
  const isStepDone = checked
  const isFinalStep = currentStep === totalSteps - 1
  const accent = isFinalStep ? 'emerald' : 'blue'
  const accentBar = accent === 'emerald' ? 'bg-emerald-400' : 'bg-[var(--accent-400,#60a5fa)]'
  const accentDot = accent === 'emerald' ? 'bg-emerald-400' : 'bg-[var(--accent-400,#60a5fa)]'
  const accentText = accent === 'emerald' ? 'text-emerald-950' : 'text-slate-950'
  const accentSolid = accent === 'emerald' ? 'bg-emerald-400' : 'bg-[var(--accent-400,#60a5fa)]'

  return (
    <ModalShell wide>
      <div className="flex items-start justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-300 flex items-center justify-center shrink-0">
            <Icon size={14}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></Icon>
          </span>
          <div>
            <p className="text-[11px] font-semibold tracking-widest text-slate-400">PASSPORT</p>
            <p className="text-[10px] text-slate-600">Last verified 2026-08-01</p>
          </div>
        </div>
        <span className="text-slate-500 text-lg leading-none">&times;</span>
      </div>

      <h2 className="text-lg font-semibold text-slate-100 mb-1.5">How to Apply</h2>

      <div className="flex gap-1.5 mb-1.5">
        {PASSPORT_RENEWAL_STEPS.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= currentStep ? accentBar : 'bg-white/10'}`} />
        ))}
      </div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] text-slate-500">Step {currentStep + 1} of {totalSteps}</span>
        <div className="flex items-center gap-1.5">
          {PASSPORT_RENEWAL_STEPS.map((_, i) => (
            <span key={i} className={`rounded-full transition-all duration-300 ${i === currentStep ? `w-2.5 h-2.5 ${accentDot}` : 'w-1.5 h-1.5 bg-white/15'}`} />
          ))}
        </div>
      </div>

      <div
        className="rounded-xl border p-2.5 mb-2 overflow-hidden transition-colors duration-300"
        style={
          accent === 'emerald'
            ? { borderColor: 'rgba(52,211,153,0.2)', backgroundColor: 'rgba(52,211,153,0.04)' }
            : { borderColor: 'rgba(96,165,250,0.2)', backgroundColor: 'rgba(96,165,250,0.04)' }
        }
      >
        <div className="grid md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.3fr)] gap-2.5 items-center">
          <div
            className="rounded-lg flex items-center justify-center h-14 md:h-16"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
              backgroundSize: '16px 16px',
              backgroundColor: accent === 'emerald' ? 'rgba(52,211,153,0.05)' : 'color-mix(in srgb, #60a5fa 6%, transparent)',
            }}
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold ${isStepDone ? accentSolid : 'bg-white/10'} ${isStepDone ? accentText : 'text-slate-400'}`}>
              {isStepDone ? <Icon size={16}><path d="M20 6L9 17l-5-5" /></Icon> : <span className="text-sm">{currentStep + 1}</span>}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 mb-0.5">{step.title}</h3>
            <p className="text-[11px] text-slate-400 mb-1 leading-snug">{step.description}</p>
            <div className="flex flex-wrap gap-1 mb-1">
              {step.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] px-1.5 py-0.5 rounded-full border"
                  style={
                    accent === 'emerald'
                      ? { borderColor: 'rgba(52,211,153,0.2)', color: '#6ee7b7', backgroundColor: 'rgba(52,211,153,0.05)' }
                      : { borderColor: 'rgba(96,165,250,0.2)', color: '#93c5fd', backgroundColor: 'rgba(96,165,250,0.05)' }
                  }
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-300">
              <span className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors duration-200 ${isStepDone ? `${accentSolid} ${accentText}` : 'border border-white/20 text-transparent'}`}>
                <Icon size={9}><path d="M20 6L9 17l-5-5" /></Icon>
              </span>
              Mark this step as done
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
          <span className={`flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-lg ${currentStep === 0 ? 'text-slate-600' : 'text-slate-300'}`}>
            <Icon size={11}><path d="M15 18l-6-6 6-6" /></Icon>
            Previous
          </span>
          {isFinalStep ? (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-300 bg-emerald-500/15 px-2.5 py-1 rounded-lg">
              <Icon size={10}><path d="M20 6L9 17l-5-5" /></Icon>
              {isStepDone ? 'All Steps Done' : 'Final Step'}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-white px-2.5 py-1 rounded-lg bg-[var(--accent-600,#2563eb)]">
              Next Step
              <Icon size={11}><path d="M9 18l6-6-6-6" /></Icon>
            </span>
          )}
        </div>
      </div>

      <p className="text-[10px] font-semibold tracking-widest text-slate-500 mb-1.5">ALL STEPS</p>
      <div className="grid grid-cols-5 gap-1.5 mb-2">
        {PASSPORT_RENEWAL_STEPS.map((s, i) => {
          const done = i < currentStep || (i === currentStep && checked)
          const active = i === currentStep
          return (
            <div key={i} className={`rounded-lg border p-1.5 text-left transition-colors duration-300 ${active ? (accent === 'emerald' ? 'border-emerald-400/50 bg-emerald-400/5' : 'border-blue-400/50 bg-blue-400/5') : 'border-white/10'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold mb-1 transition-colors duration-300 ${done ? 'bg-emerald-400 text-emerald-950' : 'bg-white/10 text-slate-400'}`}>
                {done ? <Icon size={10}><path d="M20 6L9 17l-5-5" /></Icon> : i + 1}
              </span>
              <p className="text-[9px] text-slate-300 leading-tight">{s.title}</p>
            </div>
          )
        })}
      </div>

      <div className="flex flex-col gap-1 text-[11px] text-slate-300 mb-2">
        <p className="flex items-center gap-2">
          <span className="text-slate-500 shrink-0"><Icon size={12}><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" /></Icon></span>
          ₱950 (regular processing) to ₱1,200 (expedited)
        </p>
        <p className="flex items-center gap-2">
          <span className="text-slate-500 shrink-0"><Icon size={12}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></Icon></span>
          6-15 business days depending on processing type
        </p>
      </div>

      <div className="flex flex-col items-center text-center pt-1.5 border-t border-white/10">
        <p className="text-[11px] font-medium text-slate-100 mb-1.5">Was this accurate for you?</p>
        <div className="flex gap-1.5">
          <span className="w-6 h-6 rounded-full bg-emerald-400/10 text-emerald-300 flex items-center justify-center">
            <Icon size={12}><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></Icon>
          </span>
          <span className="w-6 h-6 rounded-full bg-red-400/10 text-red-300 flex items-center justify-center">
            <Icon size={12}><circle cx="12" cy="12" r="10" /><path d="M16 16s-1.5-2-4-2-4 2-4 2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></Icon>
          </span>
        </div>
      </div>
    </ModalShell>
  )
}

// Layout-only position of `el` relative to `ancestor`, walking the
// offsetParent chain rather than reading getBoundingClientRect(). The
// difference matters here specifically: the target elements the cursor aims
// at live inside the zoomed content wrapper below, and getBoundingClientRect
// reports the current *painted* (transform-affected) position, which is
// wrong mid-transition — it was why clicks landed off-target whenever a
// zoom from the previous step hadn't finished settling yet. offsetLeft/Top
// are pure CSS-box-model values, untouched by transform, so this stays
// accurate regardless of what the zoom is doing at measurement time.
function offsetWithin(el, ancestor) {
  let x = 0
  let y = 0
  let node = el
  while (node && node !== ancestor) {
    x += node.offsetLeft
    y += node.offsetTop
    node = node.offsetParent
  }
  return { x, y }
}

export default function DashboardDemo() {
  const [stepIndex, setStepIndex] = useState(0)
  const [cursor, setCursor] = useState({ x: 0, y: 0, visible: false })
  const [clicking, setClicking] = useState(false)
  const [hoveredId, setHoveredId] = useState(null)
  const [pressedId, setPressedId] = useState(null)
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
    let mountTimer, arriveTimer, pressTimer, releaseTimer, advanceTimer

    mountTimer = setTimeout(() => {
      if (step.target) {
        const el = refs.current[step.target]
        const container = containerRef.current
        if (el && container) {
          const { x: ox, y: oy } = offsetWithin(el, container)
          setCursor({
            x: ox + el.offsetWidth / 2,
            y: oy + el.offsetHeight / 2,
            visible: true,
          })
        }
        arriveTimer = setTimeout(() => {
          setHoveredId(step.target)
          if (step.click) {
            pressTimer = setTimeout(() => {
              setPressedId(step.target)
              setClicking(true)
              releaseTimer = setTimeout(() => {
                setPressedId(null)
                setClicking(false)
              }, 150)
            }, 150)
          }
          advanceTimer = setTimeout(() => {
            setHoveredId(null)
            setStepIndex((i) => (i + 1) % STEPS.length)
          }, step.hold)
        }, 500)
      } else {
        advanceTimer = setTimeout(() => setStepIndex((i) => (i + 1) % STEPS.length), step.hold)
      }
    }, 60)

    return () => {
      clearTimeout(mountTimer)
      clearTimeout(arriveTimer)
      clearTimeout(pressTimer)
      clearTimeout(releaseTimer)
      clearTimeout(advanceTimer)
    }
  }, [stepIndex, paused, reducedMotion])

  const step = STEPS[stepIndex]
  // Nudges the screen in on the cursor's target during a "click" beat,
  // transform-origin pinned to that exact point, then eases back out to
  // scale(1) once the loop reaches a genuine full-page rest (see the STEPS
  // comment above for which beats count as "still zoomed"). Kept gentle
  // (1.08, not a dramatic punch-in) and transform/transform-origin share one
  // transition so the pivot point and the scale move in lockstep instead of
  // drifting at different speeds, which read as a swimmy, disorienting
  // motion rather than a clean camera move.
  const zoomActive = step.zoom && cursor.visible
  const zoomStyle = {
    transform: zoomActive ? 'scale(1.08)' : 'scale(1)',
    transformOrigin: zoomActive ? `${cursor.x}px ${cursor.y}px` : '50% 50%',
    transition: reducedMotion ? 'none' : 'transform 0.6s cubic-bezier(0.16,1,0.3,1), transform-origin 0.6s cubic-bezier(0.16,1,0.3,1)',
  }

  return (
    <div className="relative w-full">
      {/* Peeks out from the mockup's own edge rather than inside it — sits
          earlier in the DOM than the tilted browser-window box, so that
          box's own opaque body is what "hides" the rest of it, same trick
          as the phone mockup. Glances toward the mockup on every step
          change, as if it's watching the demo play out. */}
      <PeekingBlip edge="right" look={stepIndex} lookAt="left" />
      {/* perspective on the outer box, the actual rotation on the mockup
          itself — the whole browser-window plane tilts as one rigid unit
          in 3D space (like a screenshot mockup tool), so everything inside
          it keeps its exact same relative layout, just viewed at an angle. */}
      <div className="w-full" style={{ perspective: '1800px' }}>
      <div style={{ transformStyle: 'preserve-3d', transform: 'rotateX(4deg) rotateY(-22deg) rotate(-1deg)' }}>
      {/* Metal bezel + browser-chrome strip, the same "real device" treatment
          as the phone mockup — without it this was just a screenshot in a
          rounded div, which reads as flat/cheap next to the phone's bezel,
          buttons, glow and grain. */}
      <div
        className="relative w-full rounded-[1.6rem] p-[3px]"
        style={{
          backgroundColor: '#101216',
          boxShadow: '0 70px 120px -30px rgba(0,0,0,0.75), 0 25px 50px -20px rgba(0,0,0,0.55), inset 0 1px 0 0 rgba(255,255,255,0.12)',
        }}
      >
        <div className="relative w-full rounded-[1.4rem] overflow-hidden">
          <div className="relative h-8 flex items-center gap-1.5 px-4 bg-[#0b0d11]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
            <div className="flex-1 flex justify-center">
              <span className="text-[10px] text-white/35 px-3 py-[3px] rounded-full bg-white/[0.05] tracking-wide">orbit.app/dashboard</span>
            </div>
            <div className="w-[38px]" />
          </div>
          <div
            ref={containerRef}
            className="relative w-full overflow-hidden glass-panel"
            style={{
              // Taller than a typical 16:9 screenshot on purpose — the actual
              // My Space page stacks two full stat cards (Upcoming Expirations,
              // Estimated Renewal Costs) under the greeting, and a wide/short
              // box was clipping the second card and the chart's own bottom
              // edge rather than actually showing "the real dashboard."
              aspectRatio: '4 / 3.7',
            }}
          >
            <ScreenGrain />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ backgroundColor: 'rgba(3,6,10,0.38)' }}
            />
            <div className="relative flex h-full" style={zoomStyle}>
              <Sidebar page={step.page} hoveredId={hoveredId} pressedId={pressedId} register={register} />
              <div className="flex-1 min-w-0 p-6 pt-5 relative overflow-hidden">
                <Topbar />
                {step.page === 'dashboard' && <DashboardPage />}
                {(step.page === 'my_orbits' || step.page === 'my_orbits_saved') && (
                  <MyOrbitsPage page={step.page} hoveredId={hoveredId} pressedId={pressedId} register={register} />
                )}
                {step.modal === 'intent' && <IntentModal hoveredId={hoveredId} pressedId={pressedId} register={register} />}
                {step.modal === 'category' && <CategoryModal hoveredId={hoveredId} pressedId={pressedId} register={register} />}
                {step.modal === 'doctype' && <DocTypeModal hoveredId={hoveredId} pressedId={pressedId} register={register} />}
                {step.modal === 'fill' && <FillModal hoveredId={hoveredId} pressedId={pressedId} register={register} />}
                {step.modal === 'steps' && <StepsModal />}
              </div>
            </div>

            {cursor.visible && !reducedMotion && <CursorGlyph x={cursor.x} y={cursor.y} clicking={clicking} />}
          </div>
        </div>
      </div>
      </div>
      </div>
    </div>
  )
}
