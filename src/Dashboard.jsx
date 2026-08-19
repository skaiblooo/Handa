import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'
import { getPlaybook, parseCostRange } from './data/playbooks'
import PlaybookModal from './PlaybookModal'
import ProfilePage from './ProfilePage'
import { getDaysUntilExpiry, getUrgencyLevel, formatDaysUntil, formatExpiryDisplay, formatTimeAgo, formatCompactDaysUntil } from './utils/dateHelpers'
import { getActivityLog, logActivity } from './utils/activityLog'
import { getActualPushSubscription, subscribeToPush, unsubscribeFromPush, isPushSupported } from './utils/push'
import { validatePhotoFile, uploadDocumentPhoto, getDocumentPhotoUrl } from './utils/documentPhotos'
import { downloadIcs } from './utils/calendarExport'
import StarfieldBackground from './StarfieldBackground'
import { useLanguage } from './i18n'
import { AVATAR_COLORS, AVATAR_ACCENT_HEX } from './avatarColors'
import { DOC_TYPE_LABELS, AGENCY_BADGE, URGENCY_META, CARD_THEME, CARD_FIELD_SCHEMAS, DOC_CATEGORIES, AGENCY_NAMES, AGENCY_BADGE_COLOR, TYPICAL_VALIDITY_YEARS } from './data/docTypes'
import ltoLogo from './assets/LTO LOGO.webp'
import psaLogo from './assets/PSA LOGO.webp'
import dfaLogo from './assets/DFA logo.webp'
import nbiLogo from './assets/NBI logo.webp'
import sssLogo from './assets/SSS logo.webp'
import philhealthLogo from './assets/PHILHEALTH logo.webp'
import hdmfLogo from './assets/HDMF logo.png'
import birLogo from './assets/BIR logo.png'
import courtLogo from './assets/court logo.webp'
import pnpLogo from './assets/pnp logo.webp'
import biLogo from './assets/bi logo.webp'
import prcLogo from './assets/prc logo.webp'
import marinaLogo from './assets/marina logo.webp'
import comelecLogo from './assets/comelec logo.webp'
import afpLogo from './assets/afp logo.webp'
import dswdLogo from './assets/dswd logo.webp'
import rdLogo from './assets/rd logo.webp'
import ncipLogo from './assets/ncip logo.webp'
import gsisLogo from './assets/gsis logo.webp'
import owwaLogo from './assets/owwa logo.webp'
import bjmpLogo from './assets/bjmp logo.webp'
import bucorLogo from './assets/bucor logo.webp'
import praLogo from './assets/pra logo.webp'
import ibpLogo from './assets/ibp logo.webp'
import cscLogo from './assets/csc logo.webp'
import postLogo from './assets/post logo.webp'
import pcgLogo from './assets/pcg logo.webp'
import pvaoLogo from './assets/pvao logo.webp'
import ncmfLogo from './assets/ncmf logo.webp'
import orbitLogo from './assets/orbit logo.png'
import satellitesIcon from './assets/satellites.png'
import spaceTravelIcon from './assets/space-travel.png'
import notificationIcon from './assets/notification.png'
import documentIcon from './assets/document.png'
import calendarSettingsIcon from './assets/calendar (1).png'
import historyIcon from './assets/history.png'
import settingsIcon from './assets/settings.png'
import brokenImageIcon from './assets/image.png'
import accountIcon from './assets/account.png'
import contrastIcon from './assets/contrast.png'
import languageIcon from './assets/language.png'
import householdIcon from './assets/household.png'
import shieldIcon from './assets/shield.png'
import logoutIcon from './assets/logout.png'
import bookmarkIcon from './assets/bookmark.png'
import trashIcon from './assets/trash.png'

// Full department names for the orbit-grouping view — AGENCY_BADGE only has
// short codes (LTO, PSA, ...), which read as cryptic on their own outside a
// small badge context.
const DEPARTMENT_NAMES = AGENCY_NAMES

const DEPARTMENT_LOGOS = {
  LTO: ltoLogo,
  PSA: psaLogo,
  DFA: dfaLogo,
  NBI: nbiLogo,
  SSS: sssLogo,
  PH: philhealthLogo,
  HDMF: hdmfLogo,
  BIR: birLogo,
  COURT: courtLogo,
  PNP: pnpLogo,
  BI: biLogo,
  PRC: prcLogo,
  MARINA: marinaLogo,
  COMELEC: comelecLogo,
  AFP: afpLogo,
  DSWD: dswdLogo,
  RD: rdLogo,
  NCIP: ncipLogo,
  GSIS: gsisLogo,
  OWWA: owwaLogo,
  BJMP: bjmpLogo,
  BUCOR: bucorLogo,
  PRA: praLogo,
  IBP: ibpLogo,
  CSC: cscLogo,
  POST: postLogo,
  PCG: pcgLogo,
  PVAO: pvaoLogo,
  NCMF: ncmfLogo,
  // FEO (PNP Firearms and Explosives Office) is a PNP unit, not a
  // separately-seal'd agency — reuses the PNP mark rather than leaving
  // firearms documents without a photo at all.
  FEO: pnpLogo,
}

export { DOC_TYPE_LABELS, AGENCY_BADGE, CARD_THEME, CARD_FIELD_SCHEMAS }

export function BlankAvatar({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="9" r="4" opacity="0.9" />
      <path d="M4 20.5a8 8 0 0116 0" opacity="0.9" />
    </svg>
  )
}

// Intentionally NOT glass-dark/glass-light here — those utilities are
// translucent, tinted by whatever page background shows through them, so on
// a light-mode page (or the light Earth photo) the "dark" card washed out
// to near-white with unreadable white-on-white text. An ID card face is
// meant to look like a physical card regardless of the app's own theme, so
// it gets its own always-dark, always-opaque-enough flat background instead
// (per document type, via CARD_THEME) — flat, not a gradient, on purpose.
function IDCardFace({ docType, children, minHeight = 208, faceStyle }) {
  const card = CARD_THEME[docType]?.card || 'bg-slate-950'
  return (
    <div
      className={`${card} rounded-2xl overflow-hidden text-white flex flex-col border border-white/15`}
      style={{
        minHeight,
        boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.22), inset 0 0 22px 0 rgba(255,255,255,0.03), 0 10px 30px -12px rgba(0,0,0,0.55)',
        ...faceStyle,
      }}
    >
      {children}
    </div>
  )
}

export function IDCardFront({ docType, title, fields, onFieldChange, expiryDate, onExpiryChange, editing }) {
  const { translate } = useLanguage()
  const theme = CARD_THEME[docType]
  const schema = CARD_FIELD_SCHEMAS[docType] || []
  const agency = AGENCY_BADGE[docType]
  return (
    <IDCardFace docType={docType}>
      <div className="px-4 pt-3.5 pb-2.5 flex items-start justify-between border-b border-white/15">
        <div className="min-w-0">
          <p className="text-[8px] font-semibold tracking-wide opacity-75 truncate">{theme.agency}</p>
          <p className="text-[8px] font-semibold tracking-wide opacity-75 truncate">{theme.office}</p>
          <p className="text-sm font-bold tracking-wide mt-1">{theme.docName}</p>
        </div>
        <AgencyBubble code={agency.label} size={32} ringClass="ring-white/25" />
      </div>
      <div className="p-4 flex gap-3 flex-1">
        <div className="w-14 h-[68px] rounded-lg bg-white/15 flex items-center justify-center shrink-0 text-white/70">
          <BlankAvatar size={34} />
        </div>
        <div className="flex-1 min-w-0 grid grid-cols-2 gap-x-3 gap-y-2 content-start">
          {schema.map((f) => (
            <div key={f.key} className={f.span === 2 ? 'col-span-2' : ''}>
              <p className="text-[7px] uppercase tracking-wide opacity-70 mb-0.5 truncate">{f.label}</p>
              {editing ? (
                <input
                  value={fields[f.key] || ''}
                  onChange={(e) => onFieldChange(f.key, e.target.value)}
                  placeholder={f.default || '—'}
                  className="w-full bg-transparent border-b border-white/30 focus:border-white text-[11px] font-medium text-white placeholder-white/40 focus:outline-none pb-0.5"
                />
              ) : (
                <p className="text-[11px] font-medium truncate">{fields[f.key] || f.default || '—'}</p>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="px-4 pb-3 flex justify-between items-end gap-2">
        <p className="text-[7px] opacity-60 truncate flex-1">{title}</p>
        <div className="text-right shrink-0">
          <p className="text-[7px] uppercase tracking-wide opacity-70 mb-0.5">{translate('add_doc_expiry_date')}</p>
          {editing ? (
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => onExpiryChange(e.target.value)}
              className="bg-transparent border-b border-white/30 focus:border-white text-[11px] font-medium text-white focus:outline-none pb-0.5 [color-scheme:dark]"
            />
          ) : (
            <p className="text-[11px] font-medium">{expiryDate || '—'}</p>
          )}
        </div>
      </div>
    </IDCardFace>
  )
}

// A photo of the real document is strictly better than our generic mockup
// once one exists — it's literally the thing being tracked, not a
// stand-in for it. Falls back to IDCardFront when there's no photo (or
// while the signed URL is still loading) so nothing changes for anyone
// who hasn't attached one.
function DocumentCardFront({ docType, title, fields, expiryDate, photoPath }) {
  const [photoUrl, setPhotoUrl] = useState(null)
  useEffect(() => {
    if (!photoPath) return
    let cancelled = false
    getDocumentPhotoUrl(supabase, photoPath).then((url) => {
      if (!cancelled) setPhotoUrl(url)
    })
    return () => { cancelled = true }
  }, [photoPath])

  if (photoPath && photoUrl) {
    return (
      <div className="rounded-2xl overflow-hidden border border-white/15" style={{ minHeight: 208 }}>
        <img src={photoUrl} alt={title} className="w-full h-full object-cover" style={{ minHeight: 208 }} />
      </div>
    )
  }
  return <IDCardFront docType={docType} title={title} fields={fields} expiryDate={expiryDate} editing={false} />
}

export function IDCardBack({ docType, doc, meta, playbook, totalSteps, completedCount, progressPct, nextStepText }) {
  const { translate } = useLanguage()
  return (
    <IDCardFace docType={docType}>
      <div className="p-4 flex flex-col flex-1">
        {doc.urgency === 'ongoing' ? (
          <p className="text-[11px] opacity-90 mb-3">{translate('card_status_ongoing_desc')}</p>
        ) : (
          <>
            <div className="flex justify-between items-center text-[11px] mb-1.5 opacity-90">
              <span>{doc.urgency === 'expired' ? translate('card_status_expired') : translate('card_time_remaining')}</span>
              <span>{formatDaysUntil(doc.daysUntil)}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/20 mb-3 overflow-hidden">
              <div className="h-full rounded-full bg-white" style={{ width: `${meta.fill}%` }} />
            </div>
          </>
        )}
        {doc.urgency === 'critical' && TYPICAL_VALIDITY_YEARS[docType] && (
          // The same 4 days reads as merely "soon" on its own, but as a sliver
          // of a multi-year validity period, it lands as "almost none left."
          <p className="text-[10px] opacity-70 -mt-2 mb-3">
            {translate('card_contrast_days', { days: doc.daysUntil, total: (TYPICAL_VALIDITY_YEARS[docType] * 365).toLocaleString() })}
          </p>
        )}
        {playbook && (
          <>
            <div className="flex justify-between items-center text-[11px] mb-1.5 opacity-90">
              <span>{translate('card_renewal_progress')}</span>
              <span>{completedCount}/{totalSteps}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/20 mb-3 overflow-hidden">
              <div className="h-full rounded-full bg-white" style={{ width: `${progressPct}%` }} />
            </div>
            <p className="text-[11px] opacity-90 mb-2 truncate">
              <span className="opacity-70">{translate('card_next')}: </span>{nextStepText}
            </p>
          </>
        )}
        <div className="mt-auto pt-2 flex items-center justify-between">
          <p className="text-[8px] opacity-60">{translate('card_last_verified')}: {playbook?.lastVerified || '—'}</p>
        </div>
        <div className="mt-2 h-6 bg-white/90 rounded-sm flex items-center gap-[1px] px-2 overflow-hidden">
          {Array.from({ length: 46 }).map((_, i) => (
            <span key={i} style={{ width: i % 3 === 0 ? 2 : 1, height: '65%', backgroundColor: '#0f172a' }} />
          ))}
        </div>
      </div>
    </IDCardFace>
  )
}

function FlipIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 2.1l4 4-4 4" />
      <path d="M3 12.7V12a9 9 0 019-9 9 9 0 016.7 3" />
      <path d="M7 21.9l-4-4 4-4" />
      <path d="M21 11.3v.7a9 9 0 01-9 9 9 9 0 01-6.7-3" />
    </svg>
  )
}

export function FlippableIDCard({ front, back, flipped, onFlip }) {
  return (
    <div className="relative" style={{ perspective: '1600px' }}>
      <div
        className="relative transition-transform duration-500"
        style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
      >
        <div style={{ backfaceVisibility: 'hidden' }}>{front}</div>
        <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>{back}</div>
      </div>
      <button
        type="button"
        title="Flip card"
        onClick={(e) => { e.stopPropagation(); onFlip() }}
        className="glass-interactive absolute bottom-2.5 right-2.5 z-10 w-6 h-6 rounded-full bg-black/25 hover:bg-black/40 text-white flex items-center justify-center"
      >
        <FlipIcon size={12} />
      </button>
    </div>
  )
}

const FILTERS = [
  { id: 'all', labelKey: 'filter_all' },
  { id: 'active', labelKey: 'filter_active' },
  { id: 'expiring_soon', labelKey: 'filter_expiring_soon' },
  { id: 'expired', labelKey: 'filter_expired' },
]

const SORT_OPTIONS = [
  { id: 'expiry', labelKey: 'sort_expiry' },
  { id: 'name', labelKey: 'sort_name' },
  { id: 'department', labelKey: 'sort_department' },
]

function Icon({ children, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}

function AgencyBadge({ docType }) {
  const agency = AGENCY_BADGE[docType]
  if (!agency) return null
  const logo = DEPARTMENT_LOGOS[agency.label]
  return (
    <div className={`w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center shrink-0 ${logo ? 'bg-white' : agency.color}`}>
      {logo ? (
        <img src={logo} alt="" className="w-full h-full object-contain p-1.5" />
      ) : (
        <span className="text-white text-[10px] font-bold tracking-tight leading-none text-center px-1">
          {agency.label}
        </span>
      )}
    </div>
  )
}

// Small circular agency mark — real logo whenever one exists for that
// agency, falling back to a colored initial(s) badge only when it doesn't.
// Used everywhere an agency needs to show up small and round: the category
// picker's bubble row, the ID card corner mark, the urgent-doc rail's tiny
// tag. One component so every one of those spots stays in sync instead of
// drifting into slightly different badge styles.
function AgencyBubble({ isDark, code, size = 28, ring = true, ringClass, letterOnly = false }) {
  const logo = DEPARTMENT_LOGOS[code]
  const color = AGENCY_BADGE_COLOR[code] || 'bg-slate-600'
  const px = `${size}px`
  return (
    <div
      className={`rounded-full overflow-hidden flex items-center justify-center shrink-0 ${
        ring ? `ring-2 ${ringClass || t(isDark, 'ring-[#0b1120]', 'ring-white')}` : ''
      } ${logo ? 'bg-white' : color}`}
      style={{ width: px, height: px }}
    >
      {logo ? (
        <img src={logo} alt="" className="w-full h-full object-contain" style={{ padding: size <= 20 ? 1.5 : 4 }} />
      ) : (
        <span className="text-white font-bold tracking-tight leading-none text-center px-0.5" style={{ fontSize: Math.max(6, size * 0.28) }}>
          {letterOnly ? code[0] : code}
        </span>
      )}
    </div>
  )
}

function ThemedCheckbox({ isDark, checked, onClick, size = 18 }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick() }}
      aria-checked={checked}
      role="checkbox"
      className={`glass-interactive rounded-md flex items-center justify-center shrink-0 ${
        checked ? 'glass-accent' : t(isDark, 'glass-chip-dark hover:border-white/40', 'glass-chip-light hover:border-slate-400')
      }`}
      style={{ width: size, height: size }}
    >
      {checked && (
        <Icon size={Math.round(size * 0.6)}>
          <path d="M20 6L9 17l-5-5" />
        </Icon>
      )}
    </button>
  )
}

export const NAV_ITEMS = [
  { id: 'dashboard', labelKey: 'nav_dashboard', iconSrc: satellitesIcon },
  { id: 'my_documents', labelKey: 'nav_my_documents', iconSrc: spaceTravelIcon },
  { id: 'reminders', labelKey: 'nav_reminders', iconSrc: notificationIcon },
  { id: 'requirements', labelKey: 'nav_requirements', iconSrc: documentIcon },
  { id: 'appointments', labelKey: 'nav_appointments', iconSrc: calendarSettingsIcon },
  { id: 'history', labelKey: 'nav_history', iconSrc: historyIcon },
]

const SETTINGS_NAV = [
  {
    sectionKey: 'settings_section_general',
    items: [
      { id: 'general', labelKey: 'settings_tab_general', iconSrc: settingsIcon },
      { id: 'account', labelKey: 'settings_tab_account', iconSrc: accountIcon },
    ],
  },
  {
    sectionKey: 'settings_section_system',
    items: [
      { id: 'theme', labelKey: 'settings_tab_theme', iconSrc: contrastIcon },
      { id: 'notifications', labelKey: 'settings_tab_notifications', iconSrc: notificationIcon },
      { id: 'linked_documents', labelKey: 'settings_tab_linked_documents', iconSrc: documentIcon },
      { id: 'language', labelKey: 'settings_tab_language', iconSrc: languageIcon },
      { id: 'calendar', labelKey: 'settings_tab_calendar', iconSrc: calendarSettingsIcon },
      { id: 'household', labelKey: 'settings_tab_household', iconSrc: householdIcon },
      { id: 'data', labelKey: 'settings_tab_data_privacy', iconSrc: shieldIcon },
    ],
  },
]

function t(isDark, darkClasses, lightClasses) {
  return isDark ? darkClasses : lightClasses
}

// There's no separate display-name field, so derive something readable from
// the email's local part (e.g. "john.mallory" -> "John Mallory").
function getDisplayName(email) {
  if (!email) return 'Explorer'
  const local = email.split('@')[0]
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

// Keeps a closing panel/modal mounted for `duration` after `isOpen` goes
// false, so its exit animation (driven by the `isOpen` flag in the caller's
// className/style) actually gets to play instead of the element just vanishing.
function useDelayedUnmount(isOpen, duration = 160) {
  const [shouldRender, setShouldRender] = useState(isOpen)
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
    } else if (shouldRender) {
      const timer = setTimeout(() => setShouldRender(false), duration)
      return () => clearTimeout(timer)
    }
  }, [isOpen])
  return shouldRender
}

function Dropdown({ open, onClose, children, backdropZ = 'z-10', contentZ = 'z-20' }) {
  return (
    <>
      {open && <div className={`fixed inset-0 ${backdropZ}`} onClick={onClose} onMouseDown={(e) => e.stopPropagation()} />}
      <div className={`relative ${contentZ}`}>{children}</div>
    </>
  )
}

function ThreeDotMenu({ isDark, options, id, openId, setOpenId }) {
  const open = openId === id
  const shouldRender = useDelayedUnmount(open, 140)
  return (
    <Dropdown open={open} onClose={() => setOpenId(null)}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpenId(open ? null : id) }}
        className={`glass-interactive p-1.5 rounded-full ${t(isDark,
          'text-slate-500 hover:text-slate-100 hover:bg-white/10',
          'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
        )}`}
      >
        <Icon size={16}><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></Icon>
      </button>
      {shouldRender && (
        <div
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          style={{ animation: open ? 'dropdown-in 140ms ease-out' : 'dropdown-out 140ms ease-in forwards' }}
          // Neither glass-dark/light (backdrop-filter nested inside another
          // already-glass panel — both current callers, a document card and
          // the notif panel, are glass themselves — double-samples the same
          // pixels and reads as glitchy) nor glass-chip (no blur, but its
          // ~7% tint alone isn't remotely opaque enough to keep text sitting
          // directly behind it from bleeding through). A solid flat fill
          // side-steps both: fully opaque so nothing behind it is legible
          // through it, and no backdrop-filter at all so there's nothing to
          // double-sample. Matches the same opaque dropdown-menu pattern
          // ProfilePage.jsx already uses (bg-[#0a0a0f] border-white/10
          // shadow-xl) rather than inventing a new one.
          className={t(isDark,
            'absolute right-0 mt-2 w-40 z-30 bg-[#0a0a0f] border border-white/10 shadow-xl rounded-xl p-1.5 origin-top-right',
            'absolute right-0 mt-2 w-40 z-30 bg-white border border-slate-200 shadow-xl rounded-xl p-1.5 origin-top-right'
          )}
        >
          {options.map((opt) => (
            <button
              key={opt.label}
              onClick={() => { opt.onClick(); setOpenId(null) }}
              className={t(isDark,
                `glass-interactive glass-interactive-flat w-full flex items-center gap-2 text-left px-3 py-1.5 rounded-lg text-sm hover:bg-white/5 ${opt.danger ? 'text-red-300' : 'text-slate-300'}`,
                `glass-interactive glass-interactive-flat w-full flex items-center gap-2 text-left px-3 py-1.5 rounded-lg text-sm hover:bg-slate-50 ${opt.danger ? 'text-red-500' : 'text-slate-600'}`
              )}
            >
              {opt.icon && <span className="shrink-0">{opt.icon}</span>}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </Dropdown>
  )
}

const DOC_TYPE_OPTIONS = Object.entries(DOC_TYPE_LABELS)
  .map(([value, label]) => ({ value, label }))
  .sort((a, b) => a.label.localeCompare(b.label))

function AddDocumentTile({ isDark, onClick, tileRef, label, fullWidth }) {
  const { translate } = useLanguage()
  return (
    <button
      ref={tileRef}
      type="button"
      onClick={onClick}
      onMouseDown={(e) => e.stopPropagation()}
      className={`glass-interactive glass-interactive-no-sweep flex items-center justify-center gap-3 rounded-2xl border-2 border-dashed ${
        fullWidth ? 'flex-row py-5' : 'flex-col min-h-[220px]'
      } ${t(isDark,
        'glass-dark border-white/15 hover:border-white/30 text-slate-500 hover:text-slate-300',
        'glass-light border-slate-300 hover:border-slate-400 text-slate-400 hover:text-slate-600'
      )}`}
      style={{ animation: 'rise-in 0.5s cubic-bezier(0.16,1,0.3,1) both' }}
    >
      <Icon size={fullWidth ? 18 : 28}><path d="M12 5v14M5 12h14" /></Icon>
      <span className="text-sm font-medium">{label || translate('card_add_document')}</span>
    </button>
  )
}

// Asked before anything else — the steps to get a document for the first
// time and the steps to renew one you already hold are genuinely
// different processes (e.g. a Student Permit vs. a CDE exam for a
// driver's license), so getting the right playbook later starts here.
function IntentPicker({ isDark, onSelect, onCancel }) {
  const { translate } = useLanguage()
  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      className={t(isDark,
        'relative text-left rounded-2xl glass-dark p-5',
        'relative text-left rounded-2xl glass-light p-5'
      )}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className={t(isDark, 'font-semibold text-slate-100', 'font-semibold text-slate-900')}>{translate('add_doc_choose_intent')}</h3>
        <button
          type="button"
          title={translate('add_doc_cancel')}
          onClick={onCancel}
          className={`glass-interactive glass-interactive-flat ${t(isDark,
            'p-1.5 rounded-full text-slate-500 hover:text-slate-100 hover:bg-white/10 shrink-0',
            'p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 shrink-0'
          )}`}
        >
          <Icon size={16}><path d="M18 6L6 18M6 6l12 12" /></Icon>
        </button>
      </div>
      <div className="relative grid grid-cols-2 gap-2.5 mb-1.5">
        <p className={`text-center text-xs font-semibold tracking-wide ${t(isDark, 'text-slate-400', 'text-slate-500')}`}>{translate('add_doc_intent_renewal_label')}</p>
        <p className={`text-center text-xs font-semibold tracking-wide ${t(isDark, 'text-slate-400', 'text-slate-500')}`}>{translate('add_doc_intent_application_label')}</p>
        <span
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-semibold ${t(isDark, 'text-slate-500', 'text-slate-400')}`}
        >
          {translate('add_doc_intent_or')}
        </span>
      </div>
      <div className="relative grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => onSelect('renewal')}
          className={`glass-interactive glass-accent flex flex-col items-center text-center gap-2.5 py-6 rounded-xl text-white`}
        >
          <Icon size={26}><path d="M3 12a9 9 0 0115.3-6.4M21 12a9 9 0 01-15.3 6.4" /><path d="M21 3v6h-6M3 21v-6h6" /></Icon>
          <span className="text-sm font-semibold">{translate('add_doc_intent_renewal')}</span>
        </button>
        <span
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold ${t(isDark,
            'bg-[#0a0a0f] border border-white/10 text-slate-500',
            'bg-white border border-slate-200 text-slate-400'
          )}`}
        >
          {translate('add_doc_intent_or')}
        </span>
        <button
          type="button"
          onClick={() => onSelect('application')}
          className={`glass-interactive flex flex-col items-center text-center gap-2.5 py-6 rounded-xl ${t(isDark,
            'glass-dark text-slate-200',
            'glass-light text-slate-700'
          )}`}
        >
          <Icon size={26}><path d="M12 5v14M5 12h14" /></Icon>
          <span className="text-sm font-semibold">{translate('add_doc_intent_application')}</span>
        </button>
      </div>
    </div>
  )
}

// One plain line-icon per category — deliberately not agency logos, so the
// category level reads as a distinct step from the agency-branded doc-type
// grid underneath it.
const CATEGORY_ICONS = {
  civil_registry: <><path d="M8 3h8l4 4v14H4V3z" /><path d="M8 3v4H4M9 12h6M9 16h6" /></>,
  identification: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8.5" cy="11" r="1.8" /><path d="M6 16c.5-1.8 1.9-2.5 2.5-2.5s2 .7 2.5 2.5M14 9h5M14 13h5" /></>,
  social_security: <><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" /><path d="M9 12l2 2 4-4" /></>,
  background_checks: <><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" /></>,
  taxation: <><path d="M4 3h13l3 3v15H4z" /><path d="M9 8h6M9 12h6M9 16h4" /></>,
  transportation: <><path d="M5 11l1.5-5A2 2 0 018.4 4.5h7.2a2 2 0 011.9 1.5L19 11" /><rect x="3" y="11" width="18" height="6" rx="2" /><circle cx="7.5" cy="17" r="1.3" /><circle cx="16.5" cy="17" r="1.3" /></>,
  travel: <><path d="M2.5 19.5L21 12.5 2.5 5.5l2 6.5-2 7.5z" /><path d="M4.5 12h5" /></>,
  other: <><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></>,
}

// First step of "what are you adding" — a category, not an individual
// document. Each tile shows the two most common agencies for that category
// (a plain, static bubble stack, not a functional carousel) plus a "+N"
// bubble for everything else it holds, so a category isn't a total mystery
// before you tap it.
function CategoryPicker({ isDark, onSelect, onBack }) {
  const { translate } = useLanguage()
  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      className={t(isDark,
        'relative text-left rounded-2xl glass-dark p-5',
        'relative text-left rounded-2xl glass-light p-5'
      )}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className={t(isDark, 'font-semibold text-slate-100', 'font-semibold text-slate-900')}>{translate('add_doc_choose_type')}</h3>
        <button
          type="button"
          title={translate('add_doc_back')}
          onClick={onBack}
          className={`glass-interactive glass-interactive-flat ${t(isDark,
            'p-1.5 rounded-full text-slate-500 hover:text-slate-100 hover:bg-white/10 shrink-0',
            'p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 shrink-0'
          )}`}
        >
          <Icon size={16}><path d="M18 6L6 18M6 6l12 12" /></Icon>
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2 max-h-[60vh] overflow-y-auto no-scrollbar">
        {DOC_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat)}
            className={`glass-interactive ${t(isDark,
              'glass-dark flex flex-col items-center gap-2 p-3 rounded-xl border border-white/10',
              'glass-light flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-200'
            )}`}
          >
            <span className={t(isDark, 'w-11 h-11 rounded-xl bg-white/10 text-slate-200 flex items-center justify-center shrink-0', 'w-11 h-11 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0')}>
              <Icon size={20}>{CATEGORY_ICONS[cat.id]}</Icon>
            </span>
            <span className={t(isDark, 'text-[10px] text-center text-slate-300 leading-tight', 'text-[10px] text-center text-slate-600 leading-tight')}>
              {cat.id === 'other' ? translate('add_doc_category_other') : cat.label}
            </span>
            {cat.topAgencies.length > 0 && (
              <div className="flex items-center -space-x-1.5">
                {cat.topAgencies.map((code) => (
                  <AgencyBubble key={code} isDark={isDark} code={code} />
                ))}
                {cat.otherAgencyCount > 0 && (
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ring-2 ${t(isDark, 'ring-[#0b1120] bg-white/15 text-slate-200', 'ring-white bg-slate-200 text-slate-600')}`}>
                    <span className="text-[7px] font-bold leading-none">+{cat.otherAgencyCount}</span>
                  </div>
                )}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

function DocTypePicker({ isDark, docTypeIds, onSelect, onBack, onCancel }) {
  const { translate } = useLanguage()
  // 'custom' is appended below regardless of category — filtered out here
  // first so it never shows up twice when browsing the "Other" category,
  // which also legitimately lists it.
  const options = DOC_TYPE_OPTIONS.filter((opt) => docTypeIds.includes(opt.value) && opt.value !== 'custom')
  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      className={t(isDark,
        'relative text-left rounded-2xl glass-dark p-5',
        'relative text-left rounded-2xl glass-light p-5'
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-start gap-2">
          <button
            type="button"
            title={translate('add_doc_back')}
            onClick={onBack}
            className={`glass-interactive glass-interactive-flat ${t(isDark,
              'p-1.5 -ml-1.5 mt-0.5 rounded-full text-slate-500 hover:text-slate-100 hover:bg-white/10 shrink-0',
              'p-1.5 -ml-1.5 mt-0.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 shrink-0'
            )}`}
          >
            <Icon size={16}><path d="M15 18l-6-6 6-6" /></Icon>
          </button>
          <div>
            <h3 className={t(isDark, 'font-semibold text-slate-100', 'font-semibold text-slate-900')}>{translate('add_doc_choose_specific_type')}</h3>
            <p className={t(isDark, 'text-xs text-slate-400', 'text-xs text-slate-500')}>{translate('add_doc_choose_specific_type_desc')}</p>
          </div>
        </div>
        <button
          type="button"
          title={translate('add_doc_cancel')}
          onClick={onCancel}
          className={`glass-interactive glass-interactive-flat ${t(isDark,
            'p-1.5 rounded-full text-slate-500 hover:text-slate-100 hover:bg-white/10 shrink-0',
            'p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 shrink-0'
          )}`}
        >
          <Icon size={16}><path d="M18 6L6 18M6 6l12 12" /></Icon>
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2 max-h-[60vh] overflow-y-auto no-scrollbar">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            className={`glass-interactive ${t(isDark,
              'glass-dark flex flex-col items-center gap-1.5 p-3 rounded-xl border border-white/10',
              'glass-light flex flex-col items-center gap-1.5 p-3 rounded-xl border border-slate-200'
            )}`}
          >
            <AgencyBadge docType={opt.value} />
            <span className={t(isDark, 'text-[10px] text-center text-slate-300 leading-tight', 'text-[10px] text-center text-slate-600 leading-tight')}>{opt.label}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => onSelect('custom')}
          className={`glass-interactive ${t(isDark,
            'flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-dashed border-white/20 text-slate-400',
            'flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-dashed border-slate-300 text-slate-500'
          )}`}
        >
          <span className={t(isDark, 'w-9 h-9 rounded-full bg-white/10 flex items-center justify-center', 'w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center')}>
            <Icon size={16}><path d="M12 5v14M5 12h14" /></Icon>
          </span>
          <span className="text-[10px] text-center leading-tight">{translate('add_doc_custom_type')}</span>
        </button>
      </div>
    </div>
  )
}

// An applicant doesn't have license numbers, passport numbers, or an expiry
// date yet — asking them to fill those in would mean asking them to invent
// data. This just confirms the type and shows the card in an obviously
// unfinished state (dimmed, every field blank) instead.
function ApplicationConfirmCard({ isDark, docType, title, onTitleChange, householdMembers, assignedMemberId, onAssignedMemberChange, onBack, onCancel, onSave, saving, errorMsg, profilePhoto, profileColor }) {
  const { translate } = useLanguage()
  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      className={t(isDark,
        'relative text-left rounded-2xl glass-dark p-4',
        'relative text-left rounded-2xl glass-light p-4'
      )}
    >
      <div className="flex gap-1 mb-3">
        <div className="h-1 flex-1 rounded-full bg-blue-400" />
        <div className="h-1 flex-1 rounded-full bg-blue-400" />
        <div className="h-1 flex-1 rounded-full bg-blue-400" />
      </div>
      <div className="flex justify-between items-center mb-3">
        <input
          type="text"
          maxLength={100}
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={DOC_TYPE_LABELS[docType]}
          className={t(isDark,
            'flex-1 min-w-0 bg-transparent text-sm font-medium text-slate-100 placeholder-slate-500 focus:outline-none border-b border-transparent focus:border-white/20 pb-0.5',
            'flex-1 min-w-0 bg-transparent text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none border-b border-transparent focus:border-slate-300 pb-0.5'
          )}
        />
        <div className="flex items-center gap-1 shrink-0 ml-2">
          <button
            type="button"
            title={translate('add_doc_back')}
            onClick={onBack}
            className={`glass-interactive p-1.5 rounded-full ${t(isDark,
              'text-slate-500 hover:text-slate-100 hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.55)]',
              'text-slate-400 hover:text-slate-700 hover:drop-shadow-[0_0_6px_rgba(15,23,42,0.35)]'
            )}`}
          >
            <Icon size={16}><path d="M15 18l-6-6 6-6" /></Icon>
          </button>
          <button
            type="button"
            title={translate('add_doc_save')}
            onClick={onSave}
            disabled={saving}
            className={`glass-interactive p-1.5 rounded-full disabled:opacity-40 ${t(isDark,
              'text-emerald-400 hover:drop-shadow-[0_0_6px_rgba(52,211,153,0.9)]',
              'text-emerald-600 hover:drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]'
            )}`}
          >
            <Icon size={16}><path d="M20 6L9 17l-5-5" /></Icon>
          </button>
          <button
            type="button"
            title={translate('add_doc_cancel')}
            onClick={onCancel}
            className={`glass-interactive p-1.5 rounded-full ${t(isDark,
              'text-slate-500 hover:text-slate-100 hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.55)]',
              'text-slate-400 hover:text-slate-700 hover:drop-shadow-[0_0_6px_rgba(15,23,42,0.35)]'
            )}`}
          >
            <Icon size={16}><path d="M18 6L6 18M6 6l12 12" /></Icon>
          </button>
        </div>
      </div>

      {householdMembers.length > 0 && (
        <div className="flex items-center gap-1.5 mb-3 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => onAssignedMemberChange(null)}
            className={`glass-interactive glass-interactive-flat flex items-center gap-1.5 shrink-0 rounded-full pl-1 pr-2.5 py-1 text-xs font-medium ${
              assignedMemberId === null
                ? t(isDark, 'bg-white/10 text-slate-100', 'bg-slate-200 text-slate-900')
                : t(isDark, 'text-slate-400 hover:bg-white/5', 'text-slate-500 hover:bg-slate-100')
            }`}
          >
            {profilePhoto ? (
              <img src={profilePhoto} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
            ) : (
              <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-white" style={{ backgroundColor: AVATAR_COLORS[profileColor] || AVATAR_COLORS[0] }}>
                <Icon size={11}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></Icon>
              </span>
            )}
            {translate('add_doc_for_myself')}
          </button>
          {householdMembers.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => onAssignedMemberChange(member.id)}
              className={`glass-interactive glass-interactive-flat flex items-center gap-1.5 shrink-0 rounded-full pl-1 pr-2.5 py-1 text-xs font-medium ${
                assignedMemberId === member.id
                  ? t(isDark, 'bg-white/10 text-slate-100', 'bg-slate-200 text-slate-900')
                  : t(isDark, 'text-slate-400 hover:bg-white/5', 'text-slate-500 hover:bg-slate-100')
              }`}
            >
              <HouseholdMemberAvatar member={member} size={20} />
              {member.name}
            </button>
          ))}
        </div>
      )}

      {errorMsg && <p className="text-xs text-red-400 mb-3">{errorMsg}</p>}

      <p className={t(isDark, 'text-xs text-slate-400 mb-3', 'text-xs text-slate-500 mb-3')}>
        {translate('add_doc_application_note')}
      </p>

      <div className="opacity-50 pointer-events-none">
        <IDCardFront docType={docType} title={title.trim() || DOC_TYPE_LABELS[docType]} fields={{}} expiryDate="" editing={false} />
      </div>
    </div>
  )
}

// Personal details are the same person across every document they track —
// once we've seen a name, sex, DOB, or address on one document, a second
// document shouldn't make them type it again.
const PERSONAL_FIELD_KEYS = ['fullName', 'sex', 'dob', 'address']

function derivePersonalFields(existingDocs) {
  const known = {}
  for (const doc of existingDocs || []) {
    const cf = doc.card_fields || {}
    for (const key of PERSONAL_FIELD_KEYS) {
      if (!known[key] && cf[key]) known[key] = cf[key]
    }
  }
  return known
}

// A document being applied for doesn't have a real expiry yet — this is
// only an internal placeholder (never shown) so the required expiry_date
// column has something to hold; reminder emails explicitly skip
// application-intent documents so this placeholder can never trigger one.
function placeholderExpiryForApplication(type) {
  const years = TYPICAL_VALIDITY_YEARS[type] || 1
  const d = new Date()
  d.setFullYear(d.getFullYear() + years)
  return d.toISOString().slice(0, 10)
}

// Smart defaults: pre-fill what we can reasonably guess (typical validity
// period, near-universal field values, and details already given on another
// tracked document) so the user's job becomes "review and adjust" instead of
// "fill out from scratch." Merges onto existing values rather than
// overwriting, so re-selecting a type never clobbers typed data.
function computeSmartDefaults(type, existingDocs) {
  const years = TYPICAL_VALIDITY_YEARS[type]
  let expiryDate = ''
  if (years) {
    const d = new Date()
    d.setFullYear(d.getFullYear() + years)
    expiryDate = d.toISOString().slice(0, 10)
  }
  const personal = derivePersonalFields(existingDocs)
  const fields = {}
  for (const f of CARD_FIELD_SCHEMAS[type] || []) {
    if (personal[f.key]) fields[f.key] = personal[f.key]
    else if (f.default) fields[f.key] = f.default
  }
  return { expiryDate, fields }
}

function AddDocumentCard({ isDark, userId, existingDocs, householdMembers, initialType, initialAgency, onAdded, onCancel, profilePhoto, profileColor }) {
  const { translate } = useLanguage()
  const [step, setStep] = useState('intent')
  const [intent, setIntent] = useState(null)
  const [category, setCategory] = useState(null)
  const [docType, setDocType] = useState(initialType || 'drivers_license')
  const [title, setTitle] = useState('')
  const [expiryDate, setExpiryDate] = useState(() => (initialType ? computeSmartDefaults(initialType, existingDocs).expiryDate : ''))
  const [fields, setFields] = useState(() => (initialType ? computeSmartDefaults(initialType, existingDocs).fields : {}))
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null)
  const [photoErrorKey, setPhotoErrorKey] = useState(null)
  const [assignedMemberId, setAssignedMemberId] = useState(null)

  // Revokes the previous preview's object URL whenever it's replaced or
  // the card unmounts — otherwise each swapped photo leaks its blob until
  // the tab closes.
  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl)
    }
  }, [photoPreviewUrl])

  function handlePhotoSelect(file) {
    if (!file) return
    const problem = validatePhotoFile(file)
    if (problem) {
      setPhotoErrorKey(problem)
      return
    }
    setPhotoErrorKey(null)
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl)
    setPhotoFile(file)
    setPhotoPreviewUrl(URL.createObjectURL(file))
  }

  function removePhoto() {
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl)
    setPhotoFile(null)
    setPhotoPreviewUrl(null)
    setPhotoErrorKey(null)
  }

  const isApplication = intent === 'application'

  // Most of these document types are one-per-person in real life — flag it,
  // but don't block: someone tracking a renewal-in-progress legitimately
  // has an old and a new one active at the same time.
  const duplicateDocs = (existingDocs || []).filter((d) => d.doc_type === docType)

  function selectIntent(chosenIntent) {
    setIntent(chosenIntent)
    if (!initialType) {
      setStep(initialAgency ? 'type' : 'category')
      return
    }
    if (chosenIntent === 'application' && initialType !== 'custom') {
      setStep('confirm')
      return
    }
    const defaults = computeSmartDefaults(initialType, existingDocs)
    setExpiryDate((prev) => prev || defaults.expiryDate)
    setFields((prev) => ({ ...defaults.fields, ...prev }))
    setStep('fill')
  }

  function selectCategory(cat) {
    setCategory(cat)
    setStep('type')
  }

  // A custom type has no established application-vs-renewal process to
  // distinguish (that fork exists for real government procedures, not an
  // arbitrary document someone's naming themselves) and no typical validity
  // period to smart-default from, so it always lands on the same "fill in
  // the details, pick a real expiry" step regardless of intent.
  function selectType(type) {
    setDocType(type)
    if (isApplication && type !== 'custom') {
      setStep('confirm')
      return
    }
    setStep('fill')
    const defaults = computeSmartDefaults(type, existingDocs)
    setExpiryDate((prev) => prev || defaults.expiryDate)
    setFields((prev) => ({ ...defaults.fields, ...prev }))
  }

  function updateField(key, value) {
    setFields((f) => ({ ...f, [key]: value }))
  }

  const expiryRequired = !isApplication || docType === 'custom'

  async function handleSave() {
    if (expiryRequired && !expiryDate) {
      setErrorMsg('Please set an expiry date.')
      return
    }
    setSaving(true)
    setErrorMsg('')

    let photoPath = null
    if (photoFile) {
      const uploadResult = await uploadDocumentPhoto(supabase, userId, photoFile)
      if (!uploadResult.ok) {
        setErrorMsg(translate('add_doc_photo_upload_failed'))
        setSaving(false)
        return
      }
      photoPath = uploadResult.path
    }

    const { error } = await supabase.from('documents').insert({
      user_id: userId,
      title: title.trim() || DOC_TYPE_LABELS[docType],
      doc_type: docType,
      expiry_date: expiryRequired ? expiryDate : placeholderExpiryForApplication(docType),
      card_fields: expiryRequired ? fields : {},
      // A custom entry always has a real expiry the moment it's saved —
      // 'application' elsewhere means "no real expiry yet, still in
      // progress," which was never true for one of these regardless of
      // which intent button got it here.
      intent: docType === 'custom' ? 'renewal' : (intent || 'renewal'),
      photo_path: photoPath,
      household_member_id: assignedMemberId,
    })

    if (error) {
      setErrorMsg(error.message)
      setSaving(false)
      return
    }

    onAdded(title.trim() || DOC_TYPE_LABELS[docType])
  }

  if (step === 'intent') {
    return <IntentPicker isDark={isDark} onSelect={selectIntent} onCancel={onCancel} />
  }

  if (step === 'category') {
    return <CategoryPicker isDark={isDark} onSelect={selectCategory} onBack={() => setStep('intent')} />
  }

  if (step === 'type') {
    const docTypeIds = initialAgency
      ? DOC_TYPE_OPTIONS.filter((o) => AGENCY_BADGE[o.value].label === initialAgency).map((o) => o.value)
      : category
        ? category.docTypeIds
        : DOC_TYPE_OPTIONS.map((o) => o.value)
    return (
      <DocTypePicker
        isDark={isDark}
        docTypeIds={docTypeIds}
        onSelect={selectType}
        onBack={() => setStep(initialAgency ? 'intent' : 'category')}
        onCancel={onCancel}
      />
    )
  }

  if (step === 'confirm') {
    return (
      <ApplicationConfirmCard
        isDark={isDark}
        docType={docType}
        title={title}
        onTitleChange={setTitle}
        householdMembers={householdMembers}
        assignedMemberId={assignedMemberId}
        onAssignedMemberChange={setAssignedMemberId}
        onBack={() => setStep(initialType ? 'intent' : 'type')}
        onCancel={onCancel}
        onSave={handleSave}
        saving={saving}
        errorMsg={errorMsg}
        profilePhoto={profilePhoto}
        profileColor={profileColor}
      />
    )
  }

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      className={t(isDark,
        'relative text-left rounded-2xl glass-dark p-4',
        'relative text-left rounded-2xl glass-light p-4'
      )}
    >
      <div className="flex gap-1 mb-3">
        {Array.from({ length: initialType ? 2 : 3 }).map((_, i) => (
          <div key={i} className="h-1 flex-1 rounded-full bg-blue-400" />
        ))}
      </div>
      <div className="flex justify-between items-center mb-3">
        <input
          type="text"
          maxLength={100}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={DOC_TYPE_LABELS[docType]}
          className={t(isDark,
            'flex-1 min-w-0 bg-transparent text-sm font-medium text-slate-100 placeholder-slate-500 focus:outline-none border-b border-transparent focus:border-white/20 pb-0.5',
            'flex-1 min-w-0 bg-transparent text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none border-b border-transparent focus:border-slate-300 pb-0.5'
          )}
        />
        <div className="flex items-center gap-1 shrink-0 ml-2">
          <button
            type="button"
            title={translate('add_doc_back')}
            onClick={() => setStep(initialType ? 'intent' : 'type')}
            className={`glass-interactive p-1.5 rounded-full ${t(isDark,
              'text-slate-500 hover:text-slate-100 hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.55)]',
              'text-slate-400 hover:text-slate-700 hover:drop-shadow-[0_0_6px_rgba(15,23,42,0.35)]'
            )}`}
          >
            <Icon size={16}><path d="M15 18l-6-6 6-6" /></Icon>
          </button>
          <button
            type="button"
            title={translate('add_doc_save')}
            onClick={handleSave}
            disabled={saving}
            className={`glass-interactive p-1.5 rounded-full disabled:opacity-40 ${t(isDark,
              'text-emerald-400 hover:drop-shadow-[0_0_6px_rgba(52,211,153,0.9)]',
              'text-emerald-600 hover:drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]'
            )}`}
          >
            <Icon size={16}><path d="M20 6L9 17l-5-5" /></Icon>
          </button>
          <button
            type="button"
            title={translate('add_doc_cancel')}
            onClick={onCancel}
            className={`glass-interactive p-1.5 rounded-full ${t(isDark,
              'text-slate-500 hover:text-slate-100 hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.55)]',
              'text-slate-400 hover:text-slate-700 hover:drop-shadow-[0_0_6px_rgba(15,23,42,0.35)]'
            )}`}
          >
            <Icon size={16}><path d="M18 6L6 18M6 6l12 12" /></Icon>
          </button>
        </div>
      </div>

      {householdMembers.length > 0 && (
        <div className="flex items-center gap-1.5 mb-3 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setAssignedMemberId(null)}
            className={`glass-interactive glass-interactive-flat flex items-center gap-1.5 shrink-0 rounded-full pl-1 pr-2.5 py-1 text-xs font-medium ${
              assignedMemberId === null
                ? t(isDark, 'bg-white/10 text-slate-100', 'bg-slate-200 text-slate-900')
                : t(isDark, 'text-slate-400 hover:bg-white/5', 'text-slate-500 hover:bg-slate-100')
            }`}
          >
            {profilePhoto ? (
              <img src={profilePhoto} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
            ) : (
              <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-white" style={{ backgroundColor: AVATAR_COLORS[profileColor] || AVATAR_COLORS[0] }}>
                <Icon size={11}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></Icon>
              </span>
            )}
            {translate('add_doc_for_myself')}
          </button>
          {householdMembers.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => setAssignedMemberId(member.id)}
              className={`glass-interactive glass-interactive-flat flex items-center gap-1.5 shrink-0 rounded-full pl-1 pr-2.5 py-1 text-xs font-medium ${
                assignedMemberId === member.id
                  ? t(isDark, 'bg-white/10 text-slate-100', 'bg-slate-200 text-slate-900')
                  : t(isDark, 'text-slate-400 hover:bg-white/5', 'text-slate-500 hover:bg-slate-100')
              }`}
            >
              <HouseholdMemberAvatar member={member} size={20} />
              {member.name}
            </button>
          ))}
        </div>
      )}

      {duplicateDocs.length > 0 && (
        <p className={t(isDark,
          'text-xs text-amber-300 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2 mb-3',
          'text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3'
        )}>
          {translate('add_doc_duplicate_warning', { count: duplicateDocs.length, label: DOC_TYPE_LABELS[docType] })}
        </p>
      )}

      {errorMsg && <p className="text-xs text-red-400 mb-3">{errorMsg}</p>}

      <IDCardFront
        docType={docType}
        title={title.trim() || DOC_TYPE_LABELS[docType]}
        fields={fields}
        onFieldChange={updateField}
        expiryDate={expiryDate}
        onExpiryChange={setExpiryDate}
        editing
      />

      <div className="mt-3">
        {photoPreviewUrl ? (
          <div className={`flex items-center gap-2.5 rounded-xl p-2 ${t(isDark, 'bg-white/5', 'bg-slate-50')}`}>
            <img src={photoPreviewUrl} alt="" className="w-11 h-11 rounded-lg object-cover shrink-0" />
            <span className={`flex-1 min-w-0 truncate text-xs ${t(isDark, 'text-slate-300', 'text-slate-600')}`}>
              {photoFile.name}
            </span>
            <button
              type="button"
              onClick={removePhoto}
              className={`glass-interactive glass-interactive-flat p-1.5 rounded-full shrink-0 ${t(isDark, 'text-slate-400 hover:text-slate-100', 'text-slate-500 hover:text-slate-900')}`}
            >
              <Icon size={14}><path d="M18 6L6 18M6 6l12 12" /></Icon>
            </button>
          </div>
        ) : (
          <label
            className={`glass-interactive glass-interactive-flat glass-interactive-slow flex items-center justify-center gap-2 rounded-xl border border-dashed p-2.5 text-xs cursor-pointer ${t(isDark,
              'glass-dark border-white/15 text-slate-400 hover:text-slate-200',
              'glass-light border-slate-300 text-slate-500 hover:text-slate-700'
            )}`}
          >
            <Icon size={14}><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></Icon>
            {translate('add_doc_attach_photo')}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => handlePhotoSelect(e.target.files?.[0])}
            />
          </label>
        )}
        {photoErrorKey && <p className="text-xs text-red-400 mt-1.5">{translate(photoErrorKey)}</p>}
      </div>
    </div>
  )
}

const TIME_AGNOSTIC_GREETING_KEYS = [
  'greeting_welcome_back', 'greeting_hello', 'greeting_hi', 'greeting_hey_there', 'greeting_good_to_see_you', 'greeting_great_to_see_you',
  'greeting_wb_aboard', 'greeting_wb_good_to_have', 'greeting_wb_captain', 'greeting_wb_ready', 'greeting_wb_missed', 'greeting_wb_aligned', 'greeting_wb_nav_standby',
]

const MORNING_GREETING_KEYS = [
  'greeting_good_morning', 'greeting_morning_rise_and_shine', 'greeting_morning_beautiful_orbit', 'greeting_morning_stars_calling', 'greeting_morning_cryosleep', 'greeting_morning_sunrise_detected',
]

function getTimeOfDayGreetingKeys(hour) {
  if (hour < 12) return MORNING_GREETING_KEYS
  if (hour < 18) return ['greeting_good_afternoon']
  return ['greeting_good_evening']
}

function pickGreetingKey() {
  const pool = [...TIME_AGNOSTIC_GREETING_KEYS, ...getTimeOfDayGreetingKeys(new Date().getHours())]
  return pool[Math.floor(Math.random() * pool.length)]
}

// The dashboard tab's hero — greeting/name reveal line by line from behind
// a mask, then the status line, then the chart below it fades/draws in.
// Timings are adapted from the liquid-glass weather-dashboard reference
// build's headline + blurb choreography.
function DashboardHero({ isDark, displayName }) {
  const { translate } = useLanguage()
  const [greetingKey] = useState(pickGreetingKey)

  return (
    <div>
      <h1 className={`font-instrument text-[38px] md:text-[54px] leading-[0.98] tracking-tight ${t(isDark, 'text-slate-100', 'text-slate-900')}`}>
        <span className="block overflow-hidden pb-[0.2em] -mb-[0.2em]">
          <span className="block" style={{ animation: 'hero-line-up 0.9s cubic-bezier(0.16,1,0.3,1) 0.05s both' }}>
            {translate(greetingKey)},
          </span>
        </span>
        <span className="block overflow-hidden pb-[0.2em] -mb-[0.2em]">
          <span className="block" style={{ animation: 'hero-line-up 0.9s cubic-bezier(0.16,1,0.3,1) 0.16s both' }}>
            {displayName}
          </span>
        </span>
      </h1>
    </div>
  )
}

// Rounds a max value up to a "nice" round number for axis ticks (4, 5, then
// 1/2/5 × a power of ten) instead of whatever the raw max happens to be —
// otherwise a max of, say, 7 gives ugly ticks like 0/1.75/3.5/5.25/7.
function niceAxisMax(n) {
  if (n <= 4) return 4
  if (n <= 5) return 5
  const pow = 10 ** Math.floor(Math.log10(n))
  const norm = n / pow
  const niceNorm = norm <= 2 ? 2 : norm <= 5 ? 5 : 10
  return niceNorm * pow
}

// A forward-looking count of documents expiring in each of the next several
// months — "when's my next crunch time" instead of the old version's
// backward-looking "how many times did I click something," which didn't
// actually connect to what this app is for. Flat opacity levels (not a
// gradient) distinguish the current month from the rest, since a smooth
// blend was explicitly the thing asked to go.
const EXPIRY_CHART_MONTHS = 6

function ExpirationChart({ isDark, documents }) {
  const { lang, translate } = useLanguage()
  const [hoverIndex, setHoverIndex] = useState(null)
  const locale = lang === 'fil' ? 'fil-PH' : 'en-US'

  const now = new Date()
  // An "application" doc has no real expiry (see notificationMessage/
  // getUrgencyLevel elsewhere) — a placeholder date there would just
  // fabricate a fake deadline.
  const trackedDocs = documents.filter((d) => d.intent !== 'application' && d.expiry_date)

  const months = Array.from({ length: EXPIRY_CHART_MONTHS }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const docsThisMonth = trackedDocs.filter((doc) => {
      const exp = new Date(doc.expiry_date)
      return exp.getFullYear() === d.getFullYear() && exp.getMonth() === d.getMonth()
    })
    return {
      date: d,
      label: d.toLocaleDateString(locale, { month: 'short' }),
      count: docsThisMonth.length,
      docs: docsThisMonth,
    }
  })

  const axisMax = niceAxisMax(Math.max(1, ...months.map((m) => m.count)))
  const tickCount = 4
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => Math.round((axisMax / tickCount) * i)).reverse()

  const totalUpcoming = months.reduce((sum, m) => sum + m.count, 0)
  const hovered = hoverIndex !== null ? months[hoverIndex] : null

  return (
    <div
      className={`glass-interactive glass-interactive-no-sweep relative mt-10 rounded-2xl p-5 md:p-6 ${t(isDark, 'glass-dark', 'glass-light')}`}
      style={{ animation: 'rise-in 0.8s cubic-bezier(0.16,1,0.3,1) 0.75s both' }}
    >
      <div className="mb-5">
        <p className={`text-xs font-semibold tracking-widest uppercase ${t(isDark, 'text-slate-400', 'text-slate-500')}`}>
          {translate('expiry_chart_title')}
        </p>
        <p className={`font-instrument text-4xl mt-1.5 ${t(isDark, 'text-slate-100', 'text-slate-900')}`}>{totalUpcoming}</p>
        <p className={`text-xs mt-0.5 ${t(isDark, 'text-slate-500', 'text-slate-400')}`}>
          {translate('expiry_chart_subtitle', { count: EXPIRY_CHART_MONTHS })}
        </p>
      </div>

      <div className="flex">
        <div className="flex flex-col justify-between text-[11px] pr-2 shrink-0" style={{ height: 180 }}>
          {ticks.map((v) => (
            <span key={v} className={t(isDark, 'text-slate-500', 'text-slate-400')}>{v}</span>
          ))}
        </div>
        <div
          className="flex-1 flex items-end justify-between gap-2 md:gap-4 border-b"
          style={{ height: 180, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)' }}
        >
          {months.map((m, i) => {
            const isCurrent = i === 0
            const barHeightPct = m.count > 0 ? Math.max(4, (m.count / axisMax) * 100) : 0
            return (
              <div
                key={i}
                className="flex-1 h-full flex flex-col items-center justify-end cursor-pointer"
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
              >
                <span
                  className={`text-xs font-semibold mb-1.5 transition-opacity duration-150 ${
                    hoverIndex === i ? 'opacity-100' : 'opacity-0'
                  } ${t(isDark, 'text-slate-200', 'text-slate-700')}`}
                >
                  {m.count}
                </span>
                <div
                  className="w-full rounded-t-lg"
                  style={{
                    height: `${barHeightPct}%`,
                    minHeight: m.count > 0 ? 6 : 2,
                    backgroundColor: isCurrent
                      ? 'var(--accent-400)'
                      : 'color-mix(in srgb, var(--accent-400) 28%, transparent)',
                    outline: hoverIndex === i ? `2px solid ${isDark ? 'rgba(255,255,255,0.35)' : 'rgba(15,23,42,0.25)'}` : 'none',
                    outlineOffset: '-2px',
                    transformOrigin: 'bottom',
                    animation: `chart-bar-grow 0.6s cubic-bezier(0.16,1,0.3,1) ${0.1 + i * 0.06}s both`,
                  }}
                />
              </div>
            )
          })}
        </div>
      </div>
      <div className="flex mt-1.5">
        <div className="shrink-0" style={{ width: 22 }} />
        <div className="flex-1 flex items-center justify-between gap-2 md:gap-4">
          {months.map((m, i) => (
            <span
              key={i}
              className={`flex-1 text-center text-xs ${
                i === 0 ? t(isDark, 'text-slate-100 font-semibold', 'text-slate-900 font-semibold') : t(isDark, 'text-slate-500', 'text-slate-400')
              }`}
            >
              {m.label}
            </span>
          ))}
        </div>
      </div>

      {hovered && (
        <div
          className={`absolute top-5 right-5 md:top-6 md:right-6 z-10 rounded-xl p-3 text-xs w-[200px] max-h-[160px] overflow-y-auto pointer-events-none shadow-xl ${t(isDark, 'bg-[#0a0a0f] border border-white/10', 'bg-white border border-slate-200')}`}
          style={{ animation: 'fade-slide-in 0.15s ease-out both' }}
        >
          <p className={`font-semibold mb-1 ${t(isDark, 'text-slate-200', 'text-slate-700')}`}>
            {hovered.date.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
          </p>
          {hovered.docs.length > 0 ? (
            <ul className="space-y-0.5">
              {hovered.docs.slice(0, 3).map((doc) => (
                <li key={doc.id} className={t(isDark, 'text-slate-400', 'text-slate-500')}>
                  {doc.title || DOC_TYPE_LABELS[doc.doc_type]}
                </li>
              ))}
              {hovered.docs.length > 3 && (
                <li className={t(isDark, 'text-slate-500', 'text-slate-400')}>
                  {translate('chart_tooltip_more', { count: hovered.docs.length - 3 })}
                </li>
              )}
            </ul>
          ) : (
            <p className={t(isDark, 'text-slate-500', 'text-slate-400')}>{translate('expiry_chart_none')}</p>
          )}
        </div>
      )}
    </div>
  )
}

// Sums each tracked document's playbook cost into a single min–max range.
// A document whose cost can't be pinned to a number ("Contribution-based",
// "Varies by transaction") is left out of the sum entirely rather than
// guessed at — its count is shown separately so the total reads as a floor,
// not a false promise of completeness.
function CostRollupCard({ isDark, documents }) {
  const { translate } = useLanguage()

  const costed = documents
    .map((doc) => ({ doc, playbook: getPlaybook(doc.doc_type, doc.intent) }))
    .filter((d) => d.playbook)
    .map((d) => ({ ...d, range: parseCostRange(d.playbook.estimatedCost) }))

  const parsed = costed.filter((d) => d.range)
  const totalMin = parsed.reduce((sum, d) => sum + d.range.min, 0)
  const totalMax = parsed.reduce((sum, d) => sum + d.range.max, 0)
  const peso = (n) => `₱${n.toLocaleString('en-US')}`

  if (costed.length === 0) return null

  return (
    <div
      className={`glass-interactive glass-interactive-no-sweep relative mt-6 rounded-2xl p-5 md:p-6 ${t(isDark, 'glass-dark', 'glass-light')}`}
      style={{ animation: 'rise-in 0.8s cubic-bezier(0.16,1,0.3,1) 0.85s both' }}
    >
      <p className={`text-xs font-semibold tracking-widest uppercase ${t(isDark, 'text-slate-400', 'text-slate-500')}`}>
        {translate('cost_rollup_title')}
      </p>
      <p className={`font-instrument text-4xl mt-1.5 ${t(isDark, 'text-slate-100', 'text-slate-900')}`}>
        {parsed.length === 0
          ? '—'
          : totalMin === totalMax
            ? peso(totalMin)
            : `${peso(totalMin)}–${peso(totalMax)}`}
      </p>
      <p className={`text-xs mt-0.5 ${t(isDark, 'text-slate-500', 'text-slate-400')}`}>
        {translate('cost_rollup_subtitle', { count: parsed.length })}
      </p>
    </div>
  )
}

// Right-rail panel showing news relevant to the agencies/documents people
// track here. The actual fetch is proxied through the get-agency-news edge
// function (GNews requires its key kept server-side, and a shared cache
// there is what keeps every user's panel from burning through the free
// tier's daily quota independently) — this just polls it and renders
// whatever comes back.
function NewsThumb({ src, isDark }) {
  const [broken, setBroken] = useState(false)
  return (
    <div className={`flex-1 min-h-0 overflow-hidden flex items-center justify-center ${t(isDark, 'bg-white/5', 'bg-slate-100')}`}>
      {src && !broken ? (
        <img
          src={src}
          alt=""
          className="w-full h-full object-contain"
          loading="lazy"
          onError={() => setBroken(true)}
        />
      ) : (
        <img
          src={brokenImageIcon}
          alt=""
          className="w-7 h-7 object-contain"
          style={{ filter: isDark ? 'invert(1) brightness(1.3) opacity(0.6)' : 'brightness(0) opacity(0.35)' }}
        />
      )}
    </div>
  )
}

function NewsPanel({ isDark }) {
  const { translate } = useLanguage()
  const [articles, setArticles] = useState(null) // null = still loading
  const [activeIndex, setActiveIndex] = useState(0)
  const trackRef = useRef(null)
  const articleCount = articles?.length || 0

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data, error } = await supabase.functions.invoke('get-agency-news')
      if (cancelled) return
      setArticles(error ? [] : (data?.articles || []))
    }
    load()
    // Matches the edge function's own cache window — polling faster than
    // that would just re-request the same cached response.
    const interval = setInterval(load, 30 * 60 * 1000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  function goTo(index) {
    const track = trackRef.current
    if (!track) return
    track.scrollTo({ left: index * track.clientWidth, behavior: 'smooth' })
    setActiveIndex(index)
  }

  function handleScroll() {
    const track = trackRef.current
    if (!track || track.clientWidth === 0) return
    setActiveIndex(Math.round(track.scrollLeft / track.clientWidth))
  }

  // Advances one article every 5s, looping back to the first after the
  // last. Depending on activeIndex means any manual navigation (arrows,
  // dots, or a raw swipe) re-runs this effect and restarts the 5s window
  // instead of the autoplay yanking the card away moments after someone
  // just picked one themselves.
  useEffect(() => {
    if (articleCount <= 1) return
    const timer = setInterval(() => goTo((activeIndex + 1) % articleCount), 5000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, articleCount])

  return (
    // h-full so this fills whatever height the hero+chart column ends up
    // at (the flex row they're both in stretches its children to match by
    // default) instead of growing past it — extra articles page through
    // the fixed-height carousel below rather than pushing the panel taller.
    <div className={`h-full flex flex-col rounded-2xl p-5 ${t(isDark, 'glass-dark', 'glass-light')}`} style={{ animation: 'rise-in 0.6s cubic-bezier(0.16,1,0.3,1) 0.8s both' }}>
      {articles === null ? (
        <p className={`text-sm ${t(isDark, 'text-slate-500', 'text-slate-400')}`}>{translate('news_panel_loading')}</p>
      ) : articles.length === 0 ? (
        <p className={`text-sm ${t(isDark, 'text-slate-500', 'text-slate-400')}`}>{translate('news_panel_empty')}</p>
      ) : (
        <>
          <div className="relative flex-1 min-h-0">
            <div
              ref={trackRef}
              onScroll={handleScroll}
              className="no-scrollbar h-full flex overflow-x-auto"
              style={{ scrollSnapType: 'x mandatory' }}
            >
              {articles.map((a, i) => (
                <a
                  key={a.url || i}
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`glass-interactive glass-interactive-no-sweep w-full h-full shrink-0 flex flex-col rounded-xl overflow-hidden ${t(isDark, 'glass-dark', 'glass-light')}`}
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <NewsThumb src={a.image} isDark={isDark} />
                  <div className="p-3 shrink-0">
                    <p className={`text-sm font-medium leading-snug line-clamp-2 ${t(isDark, 'text-slate-100', 'text-slate-900')}`}>{a.title}</p>
                    <p className={`text-xs mt-1.5 ${t(isDark, 'text-slate-500', 'text-slate-400')}`}>
                      {a.source}{a.source ? ' · ' : ''}{formatTimeAgo(a.publishedAt)}
                    </p>
                  </div>
                </a>
              ))}
            </div>
            {articleCount > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => goTo((activeIndex - 1 + articleCount) % articleCount)}
                  aria-label={translate('news_panel_prev')}
                  className={`glass-interactive absolute left-1.5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white ${t(isDark, 'glass-dark', 'glass-light')}`}
                >
                  <Icon size={18}><path d="M15 18l-6-6 6-6" /></Icon>
                </button>
                <button
                  type="button"
                  onClick={() => goTo((activeIndex + 1) % articleCount)}
                  aria-label={translate('news_panel_next')}
                  className={`glass-interactive absolute right-1.5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white ${t(isDark, 'glass-dark', 'glass-light')}`}
                >
                  <Icon size={18}><path d="M9 18l6-6-6-6" /></Icon>
                </button>
              </>
            )}
          </div>
          {articleCount > 1 && (
            <div className="flex items-center justify-center gap-2 pt-3 shrink-0">
              {articles.map((a, i) => (
                <button
                  key={a.url || i}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Article ${i + 1}`}
                  className={`rounded-full transition-all ${i === activeIndex ? 'w-4 h-1.5' : 'w-1.5 h-1.5'} ${
                    i === activeIndex ? 'bg-[var(--accent-400)]' : t(isDark, 'bg-white/20', 'bg-slate-300')
                  }`}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Same completedCount/totalSteps/nextStepText derivation as the "My
// Orbits" ID card back (see the filtered.map block below) — reused here
// rather than re-invented, just surfaced as a compact stat card instead of
// something you only see after flipping a card over.
function DocumentProgressCard({ isDark, doc, onSelect, delay }) {
  const { translate } = useLanguage()
  const agency = AGENCY_BADGE[doc.doc_type]
  const label = doc.title || DOC_TYPE_LABELS[doc.doc_type]
  const playbook = getPlaybook(doc.doc_type, doc.intent)
  const totalSteps = playbook?.steps.length || 0
  const completedCount = (doc.completed_steps || []).length
  const progressPct = totalSteps ? Math.max(8, Math.round((completedCount / totalSteps) * 100)) : 0
  const nextStepIndex = playbook ? playbook.steps.findIndex((_, i) => !(doc.completed_steps || []).includes(i)) : -1
  const nextStepText = nextStepIndex !== -1 ? playbook.steps[nextStepIndex].title : translate('stat_all_steps_done')

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`glass-interactive glass-interactive-slow text-left rounded-2xl p-4 ${t(isDark, 'glass-dark', 'glass-light')}`}
      style={{ animation: `rise-in 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}s both` }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <AgencyBubble isDark={isDark} code={agency?.label} size={28} ring={false} />
          <div className="min-w-0">
            <p className={`text-sm font-medium truncate ${t(isDark, 'text-slate-100', 'text-slate-900')}`}>{label}</p>
            <p className={t(isDark, 'text-xs text-slate-400', 'text-xs text-slate-500')}>
              {translate('stat_steps_count', { done: completedCount, total: totalSteps })}
            </p>
          </div>
        </div>
        {doc.urgency !== 'ongoing' && (
          <span className={`shrink-0 text-[11px] whitespace-nowrap mt-0.5 ${t(isDark, 'text-slate-500', 'text-slate-400')}`}>
            {doc.urgency === 'expired' ? translate('card_status_expired') : formatExpiryDisplay(doc.daysUntil, doc.expiry_date)}
          </span>
        )}
      </div>
      <div className={`w-full h-1.5 rounded-full overflow-hidden mb-2.5 ${t(isDark, 'bg-white/10', 'bg-slate-200')}`}>
        <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${progressPct}%`, backgroundColor: 'var(--accent-400)' }} />
      </div>
      <p className={`text-xs truncate ${t(isDark, 'text-slate-300', 'text-slate-600')}`}>
        <span className={t(isDark, 'text-slate-500', 'text-slate-400')}>{translate('stat_next_label')}: </span>{nextStepText}
      </p>
    </button>
  )
}

function ToggleSwitch({ isDark, checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`glass-interactive relative w-10 h-6 rounded-full shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${
        checked ? 'glass-accent' : t(isDark, 'glass-dark', 'glass-light')
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-150 ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

// No description line under the title — every settings tab already says
// what it is via its own label and contents, so a repeated caption under
// each one was just extra text to read past on the way to the controls.
function SettingsPanelHeader({ isDark, title }) {
  return (
    <div className="mb-8">
      <h1 className={t(isDark, 'font-instrument text-3xl text-slate-100', 'font-instrument text-3xl text-slate-900')}>{title}</h1>
    </div>
  )
}

// A miniature of Orbit's own dashboard chrome (sidebar rail, search pill,
// welcome header + chart, stat cards) rather than a generic wireframe, so
// picking a theme previews what this app actually looks like in it.
const THEME_MOCKUP_PALETTES = {
  light: { bg: '#f4f7fb', sidebar: '#ffffff', card: '#ffffff', line: '#cbd5e1', accent: '#64748b', border: '#e5e7eb' },
  dark: { bg: '#050505', sidebar: '#101014', card: '#1a1a1f', line: '#3f3f46', accent: '#71717a', border: '#000000' },
}

function ThemeMockupMini({ p }) {
  return (
    <div className="w-full h-full flex" style={{ backgroundColor: p.bg }}>
      <div className="w-[22%] h-full flex flex-col gap-1 py-1.5 px-1" style={{ backgroundColor: p.sidebar }}>
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-1.5 rounded-sm block" style={{ backgroundColor: i === 0 ? p.accent : p.line, opacity: i === 0 ? 1 : 0.6 }} />
        ))}
      </div>
      <div className="flex-1 min-w-0 p-1.5 flex flex-col gap-1.5">
        <span className="h-1.5 w-2/5 rounded-full block" style={{ backgroundColor: p.line }} />
        <div className="flex-1 flex gap-1.5">
          <div className="flex-1 rounded-sm" style={{ backgroundColor: p.card }} />
          <div className="w-[26%] flex flex-col gap-1">
            <div className="flex-1 rounded-sm" style={{ backgroundColor: p.card }} />
            <div className="flex-1 rounded-sm" style={{ backgroundColor: p.card }} />
          </div>
        </div>
      </div>
    </div>
  )
}

function ThemeMockupCard({ variant }) {
  if (variant === 'system') {
    return (
      <div className="w-full h-20 rounded-lg overflow-hidden border border-black/10 flex">
        <div className="w-1/2 h-full"><ThemeMockupMini p={THEME_MOCKUP_PALETTES.light} /></div>
        <div className="w-1/2 h-full"><ThemeMockupMini p={THEME_MOCKUP_PALETTES.dark} /></div>
      </div>
    )
  }
  const p = THEME_MOCKUP_PALETTES[variant]
  return (
    <div className="w-full h-20 rounded-lg overflow-hidden border" style={{ borderColor: p.border }}>
      <ThemeMockupMini p={p} />
    </div>
  )
}

function ThemePanel({ isDark, themeMode, onSetMode, accentColor, onSetAccentColor }) {
  const { translate } = useLanguage()
  const options = [
    { id: 'light', labelKey: 'theme_light' },
    { id: 'dark', labelKey: 'theme_dark' },
    { id: 'system', labelKey: 'theme_system' },
  ]
  return (
    <div>
      <SettingsPanelHeader isDark={isDark} title={translate('theme_title')} description={translate('theme_desc')} />
      <div className="grid grid-cols-3 gap-4 max-w-xl mb-8">
        {options.map((opt) => {
          const active = themeMode === opt.id
          return (
            <button key={opt.id} type="button" onClick={() => onSetMode(opt.id)} className="flex flex-col items-start gap-2.5 text-left">
              <div className={`glass-interactive w-full rounded-xl p-3 ${t(isDark, 'glass-dark', 'glass-light')} ${active ? 'ring-2 ring-blue-400' : ''}`}>
                <ThemeMockupCard variant={opt.id} />
              </div>
              <span className="flex items-center gap-2 text-sm">
                <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${active ? 'border-blue-500' : t(isDark, 'border-slate-600', 'border-slate-300')}`}>
                  {active && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                </span>
                <span className={t(isDark, 'text-slate-200', 'text-slate-700')}>{translate(opt.labelKey)}</span>
              </span>
            </button>
          )
        })}
      </div>

      <SettingsPanelHeader isDark={isDark} title={translate('accent_color_title')} description={translate('accent_color_desc')} />
      <div className="flex items-center gap-3">
        {AVATAR_COLORS.map((hex, i) => (
          <button
            key={hex}
            type="button"
            onClick={() => onSetAccentColor(i)}
            aria-label={`Color ${i + 1}`}
            style={{ backgroundColor: hex }}
            className={`glass-interactive w-10 h-10 rounded-full ${t(isDark,
              accentColor === i ? 'ring-2 ring-offset-2 ring-offset-[#0a0a0f] ring-white' : '',
              accentColor === i ? 'ring-2 ring-offset-2 ring-offset-white ring-slate-900' : ''
            )}`}
          />
        ))}
      </div>
    </div>
  )
}

function notificationMessage(doc) {
  const sub = formatDaysUntil(doc.daysUntil)
  if (doc.urgency === 'ongoing') return { title: `Your ${doc.title} application is in progress.`, sub: '' }
  if (doc.urgency === 'expired') return { title: `${doc.title} has expired.`, sub }
  if (doc.urgency === 'critical') return { title: `${doc.title} is about to expire.`, sub }
  if (doc.urgency === 'urgent') return { title: `${doc.title} is expiring soon.`, sub }
  if (doc.urgency === 'upcoming') return { title: `${doc.title} will expire soon.`, sub }
  return { title: `${doc.title} is up to date.`, sub }
}

function NotificationsFeed({ isDark, documents, onSelectDoc }) {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState('all')
  const [favorites, setFavorites] = useState(() => new Set())
  const [archived, setArchived] = useState(() => new Set())
  // Checkbox selection for bulk delete — cleared whenever the visible set
  // changes underneath it (switching tabs, searching) so a stale selection
  // can never silently delete something no longer even in view.
  const [selected, setSelected] = useState(() => new Set())
  const tabRefs = useRef({})
  const [tabIndicator, setTabIndicator] = useState(null)

  const items = documents
    .slice()
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .map((doc) => ({
      id: doc.id,
      urgency: doc.urgency,
      doc,
      ...notificationMessage(doc),
    }))

  function toggleFavorite(id) {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  function toggleArchived(id) {
    setArchived((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  function toggleSelected(id) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const visible = items.filter((n) => {
    if (query && !n.title.toLowerCase().includes(query.toLowerCase())) return false
    if (tab === 'archive') return archived.has(n.id)
    if (tab === 'favorite') return favorites.has(n.id)
    return !archived.has(n.id)
  })

  const allSelected = visible.length > 0 && visible.every((n) => selected.has(n.id))

  function toggleSelectAll() {
    setSelected(allSelected ? new Set() : new Set(visible.map((n) => n.id)))
  }
  // "Delete" here means the same thing "Archive" already did — these are
  // notifications derived live from documents, not their own DB rows, so
  // there's nothing to actually destroy. Routing bulk-delete through the
  // same archived Set means the Archive tab doubles as an undo view instead
  // of this being a second, harder-to-recover removal mechanism.
  function deleteSelected() {
    setArchived((prev) => new Set([...prev, ...selected]))
    setSelected(new Set())
  }
  function deleteAll() {
    setArchived((prev) => new Set([...prev, ...visible.map((n) => n.id)]))
    setSelected(new Set())
  }

  const tabs = [
    { id: 'all', label: 'All', count: items.filter((n) => !archived.has(n.id)).length },
    { id: 'archive', label: 'Archive', count: archived.size },
    { id: 'favorite', label: 'Favorite', count: favorites.size },
  ]

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-1">
        <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0">
          <img
            src={notificationIcon}
            alt=""
            className="w-[18px] h-[18px] object-contain"
            style={{ filter: isDark ? 'invert(1) brightness(1.3)' : 'brightness(0) opacity(0.6)' }}
          />
        </span>
        <p className={`font-instrument text-3xl ${t(isDark, 'text-slate-100', 'text-slate-900')}`}>Notifications</p>
      </div>
      <p className={`text-sm mb-6 ml-[46px] ${t(isDark, 'text-slate-400', 'text-slate-500')}`}>
        {items.length} notification{items.length === 1 ? '' : 's'}
      </p>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className={`relative flex-1 rounded-full ${t(isDark, 'glass-dark', 'glass-light')}`}>
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
            <Icon size={15}><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></Icon>
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notifications"
            className={t(isDark,
              'w-full bg-transparent pl-11 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none rounded-full',
              'w-full bg-transparent pl-11 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none rounded-full'
            )}
          />
        </div>
        <div className="relative flex items-center gap-1 rounded-full p-1.5 shrink-0">
          {tabIndicator && (
            <div
              className={t(isDark, 'absolute top-1.5 bottom-1.5 rounded-full glass-chip-dark', 'absolute top-1.5 bottom-1.5 rounded-full glass-chip-light')}
              style={{ left: tabIndicator.left, width: tabIndicator.width, transition: 'left 250ms cubic-bezier(0.4, 0, 0.2, 1), width 250ms cubic-bezier(0.4, 0, 0.2, 1)' }}
            />
          )}
          {tabs.map((tb) => (
            <button
              key={tb.id}
              ref={(el) => {
                tabRefs.current[tb.id] = el
                if (el && tb.id === tab) {
                  const left = el.offsetLeft
                  const width = el.offsetWidth
                  setTabIndicator((prev) =>
                    prev && prev.left === left && prev.width === width ? prev : { left, width }
                  )
                }
              }}
              onClick={() => setTab(tb.id)}
              className={`glass-interactive glass-interactive-tab relative z-10 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium ${
                tab === tb.id
                  ? t(isDark, 'text-slate-100', 'text-slate-900')
                  : t(isDark, 'text-slate-400 hover:text-slate-200', 'text-slate-500 hover:text-slate-700')
              }`}
            >
              {tb.label}
              <span className={`text-[10px] leading-none px-1.5 py-1 rounded-full ${t(isDark, 'bg-white/10', 'bg-slate-900/10')}`}>{tb.count}</span>
            </button>
          ))}
        </div>
      </div>

      {visible.length > 0 && (
        <div className="flex items-center gap-3 mb-3 px-1">
          <button
            type="button"
            onClick={toggleSelectAll}
            className={`glass-interactive glass-interactive-quick flex items-center gap-2 text-xs font-medium px-2 py-1 rounded-lg ${t(isDark, 'text-slate-400 hover:text-slate-200', 'text-slate-500 hover:text-slate-700')}`}
          >
            <span
              className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-colors ${
                allSelected
                  ? 'bg-[var(--accent-400)] border-[var(--accent-400)] text-slate-950'
                  : t(isDark, 'border-white/25', 'border-slate-300')
              }`}
            >
              {allSelected && <Icon size={11}><path d="M20 6L9 17l-5-5" /></Icon>}
            </span>
            Select all
          </button>
          {selected.size > 0 && (
            <>
              <span className={t(isDark, 'text-xs text-slate-500', 'text-xs text-slate-400')}>{selected.size} selected</span>
              <button
                type="button"
                onClick={deleteSelected}
                className={`glass-interactive glass-interactive-quick text-xs font-medium px-2.5 py-1 rounded-lg ${t(isDark, 'text-red-300 hover:bg-red-500/10', 'text-red-600 hover:bg-red-50')}`}
              >
                Delete
              </button>
            </>
          )}
          <button
            type="button"
            onClick={deleteAll}
            className={`glass-interactive glass-interactive-quick ml-auto text-xs font-medium px-2.5 py-1 rounded-lg ${t(isDark, 'text-slate-400 hover:text-red-300', 'text-slate-500 hover:text-red-600')}`}
          >
            Delete all
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {visible.length === 0 ? (
          <div className={`rounded-2xl p-8 text-center text-sm border ${t(isDark, 'border-white/10 text-slate-400', 'border-slate-200 text-slate-500')}`}>
            Nothing here yet.
          </div>
        ) : (
          visible.map((n, i) => {
            const meta = URGENCY_META[n.urgency]
            const isFav = favorites.has(n.id)
            const isSelected = selected.has(n.id)
            const dept = AGENCY_BADGE[n.doc.doc_type]?.label
            const logo = DEPARTMENT_LOGOS[dept]
            return (
              <div
                key={n.id}
                onClick={() => onSelectDoc?.(n.doc)}
                className={`glass-interactive glass-interactive-quick glass-interactive-no-sweep cursor-pointer flex items-center gap-3 rounded-2xl p-3.5 border transition-shadow ${t(isDark, 'glass-dark border-white/10', 'glass-light border-slate-200')}`}
                style={{
                  animation: 'rise-in 0.4s cubic-bezier(0.16,1,0.3,1) both',
                  animationDelay: `${Math.min(i * 0.04, 0.3)}s`,
                  boxShadow: isSelected ? '0 0 0 1.5px var(--accent-400), 0 0 20px -4px var(--accent-400)' : undefined,
                }}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); toggleSelected(n.id) }}
                  title={isSelected ? 'Deselect' : 'Select'}
                  className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-[var(--accent-400)] border-[var(--accent-400)] text-slate-950'
                      : t(isDark, 'border-white/25', 'border-slate-300')
                  }`}
                >
                  {isSelected && <Icon size={11}><path d="M20 6L9 17l-5-5" /></Icon>}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(n.id) }}
                  title={isFav ? 'Unfavorite' : 'Favorite'}
                  className={`glass-interactive glass-interactive-quick p-1.5 rounded-full shrink-0 ${isFav ? t(isDark, 'bg-amber-400/20', 'bg-amber-100') : t(isDark, 'hover:bg-white/5', 'hover:bg-slate-100')}`}
                >
                  <img
                    src={bookmarkIcon}
                    alt=""
                    className="w-[15px] h-[15px] object-contain"
                    style={{ filter: isDark ? 'invert(1) brightness(1.3)' : 'brightness(0) opacity(0.6)' }}
                  />
                </button>
                <span className={`w-9 h-9 rounded-full overflow-hidden flex items-center justify-center shrink-0 ${t(isDark, meta?.badgeDark, meta?.badgeLight)}`}>
                  {logo ? (
                    <img src={logo} alt="" className="w-full h-full object-contain p-1 rounded-full bg-white" />
                  ) : (
                    <Icon size={15}><path d="M13 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V9z" /><path d="M13 3v6h6M9 13h6M9 17h6" /></Icon>
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${t(isDark, 'text-slate-200', 'text-slate-700')}`}>{n.title}</p>
                </div>
                {tab === 'archive' ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleArchived(n.id) }}
                    className={`glass-interactive glass-interactive-quick shrink-0 text-xs font-medium px-2.5 py-1 rounded-lg ${t(isDark, 'text-slate-300 hover:bg-white/5', 'text-slate-600 hover:bg-slate-100')}`}
                  >
                    Restore
                  </button>
                ) : (
                  n.sub && <p className={`text-xs shrink-0 ${t(isDark, 'text-slate-500', 'text-slate-400')}`}>{n.sub}</p>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

const ACTIVITY_ICON_PATH = {
  add: <path d="M12 5v14M5 12h14" />,
  security: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></>,
  update: <path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />,
}

function HistoryFeed({ isDark, activityLog }) {
  return (
    <div>
      <p className={`font-instrument text-3xl mb-1 ${t(isDark, 'text-slate-100', 'text-slate-900')}`}>History</p>
      <p className={`text-sm mb-6 ${t(isDark, 'text-slate-400', 'text-slate-500')}`}>
        {activityLog.length} activit{activityLog.length === 1 ? 'y' : 'ies'}
      </p>

      <div className="flex flex-col gap-2">
        {activityLog.length === 0 ? (
          <div className={`rounded-2xl p-8 text-center text-sm border ${t(isDark, 'border-white/10 text-slate-400', 'border-slate-200 text-slate-500')}`}>
            Nothing here yet.
          </div>
        ) : (
          activityLog.map((entry, i) => (
            <div
              key={entry.id}
              className={`flex items-center gap-3 rounded-2xl p-3.5 border ${t(isDark, 'border-white/10', 'border-slate-200')}`}
              style={{ animation: 'rise-in 0.4s cubic-bezier(0.16,1,0.3,1) both', animationDelay: `${Math.min(i * 0.04, 0.3)}s` }}
            >
              <span className={t(isDark,
                'w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-white/10 text-slate-300',
                'w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-slate-100 text-slate-600'
              )}>
                {entry.type === 'delete' ? (
                  <img
                    src={trashIcon}
                    alt=""
                    className="w-[15px] h-[15px] object-contain"
                    style={{ filter: isDark ? 'invert(1) brightness(1.3)' : 'brightness(0) opacity(0.6)' }}
                  />
                ) : (
                  <Icon size={15}>{ACTIVITY_ICON_PATH[entry.type] || ACTIVITY_ICON_PATH.update}</Icon>
                )}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm truncate ${t(isDark, 'text-slate-200', 'text-slate-700')}`}>{entry.text}</p>
                <p className="text-xs text-slate-500 mt-0.5">{formatTimeAgo(entry.timestamp)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function NotificationsPanel({ isDark, emailAlerts, onEmailAlerts, pushAlerts, onPushAlerts, pushBusy, pushSupported, weeklyDigest, onWeeklyDigest }) {
  const { translate } = useLanguage()
  return (
    <div>
      <SettingsPanelHeader isDark={isDark} title={translate('notifications_title')} description={translate('notifications_desc')} />
      <div className={`rounded-xl max-w-md ${t(isDark, 'glass-dark divide-y divide-white/10', 'glass-light divide-y divide-slate-200')}`}>
        <div className="flex items-center justify-between gap-4 p-4">
          <div>
            <p className={t(isDark, 'text-sm font-medium text-slate-200', 'text-sm font-medium text-slate-700')}>{translate('notifications_email_label')}</p>
            <p className={t(isDark, 'text-xs text-slate-500', 'text-xs text-slate-400')}>{translate('notifications_email_desc')}</p>
          </div>
          <ToggleSwitch isDark={isDark} checked={emailAlerts} onChange={onEmailAlerts} />
        </div>
        <div className="flex items-center justify-between gap-4 p-4">
          <div>
            <p className={t(isDark, 'text-sm font-medium text-slate-200', 'text-sm font-medium text-slate-700')}>{translate('notifications_push_label')}</p>
            <p className={t(isDark, 'text-xs text-slate-500', 'text-xs text-slate-400')}>
              {pushSupported ? translate('notifications_push_desc') : translate('notifications_push_unsupported')}
            </p>
          </div>
          <ToggleSwitch isDark={isDark} checked={pushAlerts} onChange={onPushAlerts} disabled={pushBusy || !pushSupported} />
        </div>
        <div className="flex items-center justify-between gap-4 p-4">
          <div>
            <p className={t(isDark, 'text-sm font-medium text-slate-200', 'text-sm font-medium text-slate-700')}>{translate('notifications_digest_label')}</p>
            <p className={t(isDark, 'text-xs text-slate-500', 'text-xs text-slate-400')}>{translate('notifications_digest_desc')}</p>
          </div>
          <ToggleSwitch isDark={isDark} checked={weeklyDigest} onChange={onWeeklyDigest} />
        </div>
      </div>
    </div>
  )
}

function LinkedDocumentsPanel({ isDark, documents, onAddType }) {
  const { translate } = useLanguage()
  const [query, setQuery] = useState('')
  const trackedTypes = new Set(documents.map((d) => d.doc_type))
  const q = query.trim().toLowerCase()
  const options = q ? DOC_TYPE_OPTIONS.filter((opt) => opt.label.toLowerCase().includes(q)) : DOC_TYPE_OPTIONS
  return (
    <div>
      <SettingsPanelHeader isDark={isDark} title={translate('linked_docs_title')} description={translate('linked_docs_desc')} />
      <div className="relative mb-4 max-w-sm">
        <span className={t(isDark, 'absolute left-3 top-1/2 -translate-y-1/2 text-slate-500', 'absolute left-3 top-1/2 -translate-y-1/2 text-slate-400')}>
          <Icon size={15}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></Icon>
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={translate('linked_docs_search_placeholder')}
          className={t(isDark,
            'w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white/5 border border-white/10 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-white/25 transition-colors',
            'w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-slate-50 border border-slate-200 text-slate-700 placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors'
          )}
        />
      </div>
      {options.length === 0 ? (
        <p className={t(isDark, 'text-sm text-slate-500', 'text-sm text-slate-400')}>{translate('linked_docs_no_results')}</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {options.map((opt) => {
            const count = documents.filter((d) => d.doc_type === opt.value).length
            const tracked = trackedTypes.has(opt.value)
            return (
              <div
                key={opt.value}
                onClick={() => onAddType(opt.value)}
                className={`glass-interactive glass-interactive-slow cursor-pointer flex items-center gap-3 rounded-xl p-3 border ${t(isDark, 'glass-dark border-white/10', 'glass-light border-slate-200')}`}
              >
                <AgencyBadge docType={opt.value} />
                <div className="flex-1 min-w-0">
                  <p className={t(isDark, 'text-sm font-medium text-slate-200 truncate', 'text-sm font-medium text-slate-700 truncate')}>{opt.label}</p>
                  <p className={t(isDark, 'text-xs text-slate-500', 'text-xs text-slate-400')}>
                    {tracked ? `${count} ${translate('linked_docs_tracked')}` : translate('linked_docs_not_tracked')}
                  </p>
                </div>
                {!tracked && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onAddType(opt.value) }}
                    className="glass-accent glass-interactive glass-interactive-slow shrink-0 text-xs font-medium text-white px-3 py-1.5 rounded-lg"
                  >
                    {translate('linked_docs_add')}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function LanguagePanel({ isDark, lang, onSetLang }) {
  const { translate } = useLanguage()
  const options = [
    { id: 'en', labelKey: 'language_english' },
    { id: 'fil', labelKey: 'language_filipino' },
  ]
  return (
    <div>
      <SettingsPanelHeader isDark={isDark} title={translate('language_title')} description={translate('language_desc')} />
      <div className="flex gap-3 max-w-sm mb-4">
        {options.map((opt) => {
          const active = lang === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSetLang(opt.id)}
              className={`glass-interactive glass-interactive-slow flex-1 flex items-center justify-center gap-2 rounded-xl py-4 border ${t(isDark, 'glass-dark border-white/10', 'glass-light border-slate-200')} ${active ? 'ring-2 ring-blue-400' : ''}`}
            >
              <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${active ? 'border-blue-500' : t(isDark, 'border-slate-600', 'border-slate-300')}`}>
                {active && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
              </span>
              <span className={t(isDark, 'text-sm font-medium text-slate-200', 'text-sm font-medium text-slate-700')}>{translate(opt.labelKey)}</span>
            </button>
          )
        })}
      </div>
      <p className={t(isDark, 'text-xs text-slate-500 max-w-md', 'text-xs text-slate-400 max-w-md')}>{translate('language_note')}</p>
    </div>
  )
}

// The landing tab for the header's "Settings" entry points (gear button,
// dropdown item) — previously both that and "Account" opened the exact
// same edit-profile form, which felt like two buttons doing one thing.
// This is a lighter, read-only overview instead, with a link into the real
// edit form rather than duplicating it.
function GeneralSettingsPanel({ isDark, session, profilePhoto, profileUsername, profileColor, onGoToAccount, onLogout }) {
  const { translate } = useLanguage()
  return (
    <div>
      <SettingsPanelHeader isDark={isDark} title={translate('settings_general_title')} description={translate('settings_general_desc')} />
      <div className={`rounded-2xl p-5 max-w-md flex items-center gap-4 mb-4 ${t(isDark, 'glass-dark', 'glass-light')}`}>
        {profilePhoto ? (
          <img src={profilePhoto} alt="" className="w-16 h-16 rounded-full object-cover shrink-0" />
        ) : (
          <div
            style={{ backgroundColor: AVATAR_COLORS[profileColor] || AVATAR_COLORS[0] }}
            className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-semibold text-white shrink-0"
          >
            {(profileUsername || session.user.email || 'G')[0].toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className={`text-base font-semibold truncate ${t(isDark, 'text-slate-100', 'text-slate-900')}`}>
            {profileUsername || getDisplayName(session.user.email)}
          </p>
          <p className={t(isDark, 'text-sm text-slate-400 truncate', 'text-sm text-slate-500 truncate')}>
            {session.user.email || translate('guest_account_label')}
          </p>
        </div>
        <button
          onClick={onGoToAccount}
          className="glass-accent glass-interactive glass-interactive-slow shrink-0 text-xs font-semibold text-white px-3 py-2 rounded-lg"
        >
          {translate('settings_general_edit_account')}
        </button>
      </div>

      <button
        type="button"
        onClick={onLogout}
        className={`glass-interactive glass-interactive-slow w-full max-w-md flex items-center justify-between gap-4 rounded-2xl p-4 mb-6 ${t(isDark, 'glass-dark', 'glass-light')}`}
      >
        <span className={`text-sm font-medium ${t(isDark, 'text-slate-200', 'text-slate-700')}`}>{translate('settings_general_sign_out')}</span>
        <Icon size={16}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></Icon>
      </button>
    </div>
  )
}

function CalendarPanel({ isDark, documents }) {
  const { translate } = useLanguage()
  const [justExported, setJustExported] = useState(false)
  const exportableCount = documents.filter((doc) => doc.intent !== 'application' && doc.expiry_date).length

  function handleExport() {
    downloadIcs(documents)
    setJustExported(true)
  }

  return (
    <div>
      <SettingsPanelHeader isDark={isDark} title={translate('calendar_title')} description={translate('calendar_desc')} />
      <div className={`rounded-xl p-4 max-w-md flex items-center justify-between gap-4 border ${t(isDark, 'border-white/10', 'border-slate-200')}`}>
        <div>
          <p className={t(isDark, 'text-sm font-medium text-slate-200', 'text-sm font-medium text-slate-700')}>{translate('calendar_export_title')}</p>
          <p className={t(isDark, 'text-xs text-slate-500', 'text-xs text-slate-400')}>
            {exportableCount > 0
              ? translate('calendar_export_desc_count', { count: exportableCount })
              : translate('calendar_export_desc_empty')}
          </p>
        </div>
        <button
          type="button"
          disabled={exportableCount === 0}
          onClick={handleExport}
          className={`glass-accent glass-interactive shrink-0 text-sm font-medium text-white px-4 py-2 rounded-lg disabled:opacity-40 disabled:pointer-events-none`}
        >
          {justExported ? translate('calendar_export_done') : translate('calendar_export_btn')}
        </button>
      </div>
    </div>
  )
}

// Household members aren't separate accounts — just profiles the account
// holder manages, so their avatar reuses the exact same color/initial
// scheme as the account holder's own (AVATAR_COLORS), just without a
// photo option since there's no upload flow for someone who isn't signed
// in themselves.
function HouseholdMemberAvatar({ member, size = 36 }) {
  const hex = AVATAR_COLORS[member.color] || AVATAR_COLORS[0]
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-semibold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.42, backgroundColor: hex }}
    >
      {member.name?.[0]?.toUpperCase() || '?'}
    </div>
  )
}

function HouseholdMemberForm({ isDark, initial, saving, onCancel, onSave }) {
  const { translate } = useLanguage()
  const [name, setName] = useState(initial?.name || '')
  const [relationship, setRelationship] = useState(initial?.relationship || '')
  const [color, setColor] = useState(initial?.color ?? 0)

  return (
    <div className={`rounded-xl p-3 ${t(isDark, 'bg-white/5', 'bg-slate-50')}`}>
      <div className="flex gap-2 mb-2.5">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={translate('household_name_placeholder')}
          maxLength={60}
          autoFocus
          className={t(isDark,
            'flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-white/25',
            'flex-1 min-w-0 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400'
          )}
        />
        <input
          type="text"
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          placeholder={translate('household_relationship_placeholder')}
          maxLength={40}
          className={t(isDark,
            'w-32 shrink-0 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-white/25',
            'w-32 shrink-0 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400'
          )}
        />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {AVATAR_COLORS.map((hex, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setColor(i)}
              aria-label={`Color ${i + 1}`}
              style={{ backgroundColor: hex }}
              className={`w-6 h-6 rounded-full ${color === i ? t(isDark, 'ring-2 ring-white/70', 'ring-2 ring-slate-900/50') : ''}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onCancel}
            className={`text-xs px-2.5 py-1.5 rounded-lg ${t(isDark, 'text-slate-400 hover:bg-white/5', 'text-slate-500 hover:bg-slate-100')}`}
          >
            {translate('confirm_cancel')}
          </button>
          <button
            type="button"
            disabled={!name.trim() || saving}
            onClick={() => onSave({ name: name.trim(), relationship: relationship.trim(), color })}
            className="glass-accent glass-interactive text-xs font-semibold text-white px-3 py-1.5 rounded-lg disabled:opacity-40"
          >
            {translate('household_save')}
          </button>
        </div>
      </div>
    </div>
  )
}

function HouseholdPanel({ isDark, userId, members, onRefresh }) {
  const { translate } = useLanguage()
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [saving, setSaving] = useState(false)

  async function handleAdd(values) {
    setSaving(true)
    await supabase.from('household_members').insert({ user_id: userId, ...values })
    setSaving(false)
    setAdding(false)
    onRefresh()
  }

  async function handleUpdate(id, values) {
    setSaving(true)
    await supabase.from('household_members').update(values).eq('id', id)
    setSaving(false)
    setEditingId(null)
    onRefresh()
  }

  async function handleDelete(id) {
    await supabase.from('household_members').delete().eq('id', id)
    setConfirmDeleteId(null)
    onRefresh()
  }

  return (
    <div>
      <SettingsPanelHeader isDark={isDark} title={translate('settings_tab_household')} description={translate('household_desc')} />
      <div className="max-w-md space-y-2">
        {members.map((member) => (
          <div key={member.id}>
            {editingId === member.id ? (
              <HouseholdMemberForm
                isDark={isDark}
                initial={member}
                saving={saving}
                onCancel={() => setEditingId(null)}
                onSave={(values) => handleUpdate(member.id, values)}
              />
            ) : (
              <div className={`flex items-center gap-3 rounded-xl p-3 ${t(isDark, 'bg-white/5', 'bg-slate-50')}`}>
                <HouseholdMemberAvatar member={member} />
                <div className="flex-1 min-w-0">
                  <p className={t(isDark, 'text-sm font-medium text-slate-200 truncate', 'text-sm font-medium text-slate-700 truncate')}>{member.name}</p>
                  {member.relationship && <p className="text-xs text-slate-500 truncate">{member.relationship}</p>}
                </div>
                {confirmDeleteId === member.id ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className={`text-xs px-2 py-1 rounded-lg ${t(isDark, 'text-slate-400 hover:bg-white/5', 'text-slate-500 hover:bg-slate-100')}`}
                    >
                      {translate('confirm_cancel')}
                    </button>
                    <button type="button" onClick={() => handleDelete(member.id)} className="text-xs font-medium text-red-400 hover:text-red-300 px-2 py-1 rounded-lg">
                      {translate('household_confirm_delete')}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      title={translate('household_edit')}
                      onClick={() => setEditingId(member.id)}
                      className={`glass-interactive glass-interactive-flat p-1.5 rounded-full ${t(isDark, 'text-slate-400 hover:text-slate-100', 'text-slate-500 hover:text-slate-900')}`}
                    >
                      <Icon size={14}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4z" /></Icon>
                    </button>
                    <button
                      type="button"
                      title={translate('household_remove')}
                      onClick={() => setConfirmDeleteId(member.id)}
                      className={`glass-interactive glass-interactive-flat p-1.5 rounded-full ${t(isDark, 'text-slate-400 hover:text-red-300', 'text-slate-500 hover:text-red-600')}`}
                    >
                      <Icon size={14}><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" /></Icon>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {adding ? (
          <HouseholdMemberForm isDark={isDark} saving={saving} onCancel={() => setAdding(false)} onSave={handleAdd} />
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className={`glass-interactive glass-interactive-flat glass-interactive-slow w-full flex items-center justify-center gap-2 rounded-xl border border-dashed p-3 text-sm ${t(isDark,
              'glass-dark border-white/15 text-slate-400 hover:text-slate-200',
              'glass-light border-slate-300 text-slate-500 hover:text-slate-700'
            )}`}
          >
            <Icon size={14}><path d="M12 5v14M5 12h14" /></Icon>
            {translate('household_add_someone')}
          </button>
        )}
      </div>
    </div>
  )
}

function DataPrivacyPanel({ isDark, documents }) {
  const { translate } = useLanguage()
  const [exported, setExported] = useState(false)

  function handleExport() {
    const payload = documents.map((d) => ({
      title: d.title,
      doc_type: d.doc_type,
      expiry_date: d.expiry_date,
      completed_steps: d.completed_steps,
      created_at: d.created_at,
    }))
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'orbit-documents.json'
    a.click()
    URL.revokeObjectURL(url)
    setExported(true)
    setTimeout(() => setExported(false), 2000)
  }

  return (
    <div>
      <SettingsPanelHeader isDark={isDark} title={translate('data_privacy_title')} description={translate('data_privacy_desc')} />
      <div className={`rounded-xl p-4 max-w-md flex items-center justify-between gap-4 border ${t(isDark, 'border-white/10', 'border-slate-200')}`}>
        <div>
          <p className={t(isDark, 'text-sm font-medium text-slate-200', 'text-sm font-medium text-slate-700')}>{translate('data_privacy_export_title')}</p>
          <p className={t(isDark, 'text-xs text-slate-500', 'text-xs text-slate-400')}>{translate('data_privacy_export_desc')}</p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="glass-accent glass-interactive glass-interactive-slow shrink-0 text-sm font-medium text-white px-4 py-2 rounded-lg"
        >
          {exported ? translate('data_privacy_export_done') : translate('data_privacy_export_btn')}
        </button>
      </div>
      <p className={t(isDark, 'text-xs text-slate-500 mt-4 max-w-md', 'text-xs text-slate-400 mt-4 max-w-md')}>
        {translate('data_privacy_delete_note')}
      </p>
    </div>
  )
}

// A single row in "My Orbits" — collapsed it's just a header; expanded it
// reveals the status filters + document grid for that department, passed in
// as a lazy render function so it's only built while actually visible.
// useDelayedUnmount keeps the content mounted a beat past the collapse so it
// fades out instead of vanishing the instant you close it.
function OrbitAccordionItem({ isDark, orbit, isOpen, onToggle, renderContent, delay }) {
  const shouldRenderContent = useDelayedUnmount(isOpen, 300)
  return (
    <div
      className={`rounded-2xl overflow-hidden border ${t(isDark, 'border-white/10', 'border-slate-200')}`}
      style={{ animation: `rise-in 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}s both` }}
    >
      <button
        type="button"
        onClick={onToggle}
        className={`glass-interactive glass-interactive-no-sweep w-full flex items-center justify-between gap-3 p-5 text-left ${t(isDark, 'glass-dark', 'glass-light')}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <AgencyBubble isDark={isDark} code={orbit.docType} size={40} ring={false} />
          <div className="min-w-0">
            <p className={`text-sm font-medium truncate ${t(isDark, 'text-slate-100', 'text-slate-900')}`}>{orbit.label}</p>
            <p className={`text-xs mt-0.5 ${t(isDark, 'text-slate-400', 'text-slate-500')}`}>
              {orbit.countText}
            </p>
          </div>
        </div>
        <span
          className={t(isDark, 'text-slate-500 shrink-0', 'text-slate-400 shrink-0')}
          style={{ transition: 'transform 250ms cubic-bezier(0.4,0,0.2,1)', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <Icon size={16}><path d="M6 9l6 6 6-6" /></Icon>
        </span>
      </button>
      <div
        style={{
          display: 'grid',
          gridTemplateRows: isOpen ? '1fr' : '0fr',
          transition: 'grid-template-rows 350ms cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={`px-5 pb-5 pt-1 border-t ${t(isDark, 'border-white/10', 'border-slate-200')}`}
            style={{ opacity: isOpen ? 1 : 0, transition: 'opacity 300ms cubic-bezier(0.22,1,0.36,1)' }}
          >
            {shouldRenderContent && renderContent()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard({ session, isGuest = false, onUpgradeAccount }) {
  const { translate, lang, setLang } = useLanguage()
  const [documents, setDocuments] = useState([])
  const [householdMembers, setHouseholdMembers] = useState([])
  const [loading, setLoading] = useState(true)
  // Set only when documents came from the offline cache fallback, not a
  // live fetch — { cachedAt } drives the "you're offline" banner so
  // cached data never gets mistaken for current.
  const [offlineCacheInfo, setOfflineCacheInfo] = useState(null)
  const [activityLog, setActivityLog] = useState(() => getActivityLog(session.user.id))
  function logAction(text, type) {
    logActivity(session.user.id, text, type)
    setActivityLog(getActivityLog(session.user.id))
  }
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [addingDocument, setAddingDocument] = useState(false)
  const [addCardWidth, setAddCardWidth] = useState(null)
  const addTileRef = useRef(null)
  const [pendingDocType, setPendingDocType] = useState(null)
  const [pendingAgency, setPendingAgency] = useState(null)

  function openAddDocument(initialType, initialAgency) {
    if (addTileRef.current) setAddCardWidth(addTileRef.current.getBoundingClientRect().width)
    setPendingDocType(typeof initialType === 'string' ? initialType : null)
    setPendingAgency(typeof initialType !== 'string' && typeof initialAgency === 'string' ? initialAgency : null)
    setAddingDocument(true)
  }
  const [activeFilter, setActiveFilter] = useState('all')
  // The status pills (All/Active/Expiring Soon/Expired) only ever narrowed
  // the set shown — there was no actual ordering control, so the grid
  // rendered in whatever order Supabase happened to return rows in.
  const [sortBy, setSortBy] = useState('expiry')
  const [showSortMenu, setShowSortMenu] = useState(false)
  // null = browsing the "My Orbits" category grid; a doc_type = drilled
  // into that orbit's documents, where the status filter pills apply.
  const [selectedOrbit, setSelectedOrbit] = useState(null)
  const [showNotifDropdown, setShowNotifDropdown] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  // Persisted locally (per-account) since there's no profiles table yet to
  // sync this to a backend — survives refresh, but only on this browser.
  const [profilePhoto, setProfilePhoto] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(`orbit_profile_meta_${session.user.id}`) || 'null')
      return saved?.photo || null
    } catch {
      return null
    }
  })
  const [profileUsername, setProfileUsername] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(`orbit_profile_meta_${session.user.id}`) || 'null')
      return saved?.username || ''
    } catch {
      return ''
    }
  })
  // Defaults to the color chosen during signup (see Auth.jsx); falls back to
  // the original hardcoded blue for accounts created before this existed.
  const [profileColor, setProfileColor] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(`orbit_profile_meta_${session.user.id}`) || 'null')
      return typeof saved?.color === 'number' ? saved.color : 0
    } catch {
      return 0
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(`orbit_profile_meta_${session.user.id}`, JSON.stringify({ photo: profilePhoto, username: profileUsername, color: profileColor }))
    } catch {
      // localStorage can throw (quota exceeded, private browsing) — persistence is best-effort.
    }
  }, [profilePhoto, profileUsername, profileColor, session.user.id])

  // Guest data lives only on this anonymous session; nothing is recoverable
  // once they navigate away without upgrading, so warn before that happens.
  useEffect(() => {
    if (!isGuest || documents.length === 0) return
    const handleBeforeUnload = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isGuest, documents.length])

  // emailAlerts/weeklyDigest live in the notification_prefs table now, not
  // localStorage — send-reminders and send-monthly-digest run server-side
  // and have no way to read a browser's localStorage, so a toggle that only
  // ever wrote there was never actually respected by the emails it claimed
  // to control. Defaults (both true) match what a never-touched row means
  // server-side too, so a user who's never opened this panel keeps getting
  // reminders exactly as before.
  const [notifPrefs, setNotifPrefs] = useState({ emailAlerts: true, pushAlerts: true, weeklyDigest: true })
  useEffect(() => {
    let cancelled = false
    supabase
      .from('notification_prefs')
      .select('email_alerts, weekly_digest')
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data) return
        setNotifPrefs((p) => ({ ...p, emailAlerts: data.email_alerts, weeklyDigest: data.weekly_digest }))
      })
    return () => { cancelled = true }
  }, [session.user.id])
  async function updateNotifPref(patch) {
    setNotifPrefs((p) => ({ ...p, ...patch }))
    const dbPatch = {}
    if ('emailAlerts' in patch) dbPatch.email_alerts = patch.emailAlerts
    if ('weeklyDigest' in patch) dbPatch.weekly_digest = patch.weeklyDigest
    if (Object.keys(dbPatch).length === 0) return
    await supabase.from('notification_prefs').upsert({ user_id: session.user.id, ...dbPatch }, { onConflict: 'user_id' })
  }
  // The stored preference alone can't be trusted — permission can be
  // revoked, or site data cleared, entirely outside this app's control —
  // so on load this reconciles the toggle against whether a real browser
  // subscription actually exists rather than just trusting localStorage.
  useEffect(() => {
    if (isGuest || !isPushSupported()) return
    getActualPushSubscription().then((sub) => {
      setNotifPrefs((p) => (p.pushAlerts === !!sub ? p : { ...p, pushAlerts: !!sub }))
    })
  }, [isGuest])
  const [pushToggleBusy, setPushToggleBusy] = useState(false)
  async function handlePushToggle(next) {
    setPushToggleBusy(true)
    if (next) {
      const result = await subscribeToPush(supabase, session.user.id)
      setNotifPrefs((p) => ({ ...p, pushAlerts: result.ok }))
    } else {
      await unsubscribeFromPush(supabase)
      setNotifPrefs((p) => ({ ...p, pushAlerts: false }))
    }
    setPushToggleBusy(false)
  }
  // Two separate sets, matching what the bell dropdown actually needs to
  // distinguish: "seen" just clears the numeric badge (marked the moment
  // the dropdown opens), while "read" clears an individual row's unread dot
  // and moves it from New into Earlier (marked by actually clicking that
  // row, or by "Mark all as read"). Opening the dropdown does not, by
  // itself, mark everything read — otherwise the New/Earlier split would
  // never have anything to show once you'd looked at it once.
  const [seenNotifIds, setSeenNotifIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(`orbit_seen_notifications_${session.user.id}`) || '[]'))
    } catch {
      return new Set()
    }
  })
  const [readNotifIds, setReadNotifIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(`orbit_read_notifications_${session.user.id}`) || '[]'))
    } catch {
      return new Set()
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(`orbit_seen_notifications_${session.user.id}`, JSON.stringify([...seenNotifIds]))
    } catch {
      // best-effort
    }
  }, [seenNotifIds, session.user.id])
  useEffect(() => {
    try {
      localStorage.setItem(`orbit_read_notifications_${session.user.id}`, JSON.stringify([...readNotifIds]))
    } catch {
      // best-effort
    }
  }, [readNotifIds, session.user.id])
  const [notifFilterTab, setNotifFilterTab] = useState('all')
  const notifTabRefs = useRef({})
  const [notifTabIndicator, setNotifTabIndicator] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  // Persisted so a hard reload (e.g. clicking the logo) doesn't silently
  // snap the theme back to the default instead of keeping what was chosen.
  // 'system' follows the OS preference live rather than being captured once.
  const [themeMode, setThemeModeState] = useState(() => {
    try {
      const saved = localStorage.getItem('orbit_theme_mode')
      if (saved === 'light' || saved === 'dark' || saved === 'system') return saved
      const legacy = localStorage.getItem('orbit_theme')
      return legacy === 'light' ? 'light' : 'dark'
    } catch {
      return 'dark'
    }
  })
  const [systemPrefersDark, setSystemPrefersDark] = useState(() => {
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    } catch {
      return true
    }
  })
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e) => setSystemPrefersDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  const isDark = themeMode === 'system' ? systemPrefersDark : themeMode === 'dark'
  function setThemeMode(mode) {
    setThemeModeState(mode)
    try { localStorage.setItem('orbit_theme_mode', mode) } catch {}
  }
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('orbit_recent_searches') || '[]')
    } catch {
      return []
    }
  })
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [settingsTab, setSettingsTab] = useState('account')
  const [activeNav, setActiveNav] = useState('dashboard')
  // Each nav destination is a shortcut into the same document set rather than
  // a separate page — Reminders jumps to what's due soon, History jumps to
  // what's already expired, so the sidebar actually does something instead
  // of just changing which icon is highlighted.
  function selectNav(id) {
    setActiveNav(id)
    setShowSettings(false)
    setSelectionMode(false)
    setSelectedOrbit(null)
    if (id === 'reminders') setActiveFilter('expiring_soon')
    else if (id === 'history') setActiveFilter('expired')
    else if (id === 'dashboard' || id === 'my_documents') setActiveFilter('all')
  }
  const [openMenuId, setOpenMenuId] = useState(null)
  // Closing the notif dropdown (by any path — the bell toggle, clicking
  // outside, etc.) should take its own three-dot submenu with it. Without
  // this, closing while that submenu was open left openMenuId pointing at
  // it, so reopening the bell showed the submenu already sprung open.
  useEffect(() => {
    if (!showNotifDropdown) {
      setOpenMenuId((prev) => (prev === 'notif-menu' ? null : prev))
    }
  }, [showNotifDropdown])
  const [flippedIds, setFlippedIds] = useState({})

  const sidebarRef = useRef(null)
  const docsSectionRef = useRef(null)
  const searchInputRef = useRef(null)
  const filterRefs = useRef({})
  const [filterIndicator, setFilterIndicator] = useState(null)

  useEffect(() => {
    const el = filterRefs.current[activeFilter]
    if (el) setFilterIndicator({ left: el.offsetLeft, width: el.offsetWidth })
  }, [activeFilter])

  const notifShouldRender = useDelayedUnmount(showNotifDropdown, 140)
  const userDropdownShouldRender = useDelayedUnmount(showUserDropdown, 140)
  const addModalShouldRender = useDelayedUnmount(addingDocument, 180)
  const confirmDeleteShouldRender = useDelayedUnmount(!!confirmDelete, 180)
  const confirmLogoutShouldRender = useDelayedUnmount(confirmLogout, 180)
  // Declared here, not inside renderFilterBarAndGrid — that helper can be
  // invoked multiple times in one render (once per expanded orbit), and
  // calling a hook from inside something invoked a variable number of
  // times per render breaks the rules of hooks.
  const sortMenuShouldRender = useDelayedUnmount(showSortMenu, 140)
  const [confirmDeleteSnapshot, setConfirmDeleteSnapshot] = useState(null)
  useEffect(() => {
    if (confirmDelete) {
      setConfirmDeleteSnapshot(confirmDelete)
      setDeleteError('')
    }
  }, [confirmDelete])

  useEffect(() => {
    fetchDocuments()
    fetchHouseholdMembers()
  }, [])

  // Close sidebar when clicking truly empty background. Buttons/inputs are
  // excluded here; non-button clickable surfaces (stat cards, document cards,
  // dropdown/modal panels and their backdrops) stop this event from bubbling
  // here at all via their own onMouseDown, so only blank space reaches this.
  useEffect(() => {
    function handleClickOutside(e) {
      if (!sidebarOpen) return
      if (sidebarRef.current && sidebarRef.current.contains(e.target)) return
      if (e.target.closest('button, a, input, select, textarea, [role="button"]')) return
      setSidebarOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [sidebarOpen])

  // Exit selection mode when clicking anywhere outside the filter row / document grid.
  useEffect(() => {
    if (!selectionMode) return
    function handleClickOutsideSelection(e) {
      if (docsSectionRef.current && docsSectionRef.current.contains(e.target)) return
      setSelectionMode(false)
      setSelectedIds([])
    }
    document.addEventListener('mousedown', handleClickOutsideSelection)
    return () => document.removeEventListener('mousedown', handleClickOutsideSelection)
  }, [selectionMode])

  // Ctrl+K (or Cmd+K on Mac) focuses the search box, matching the shortcut hint shown in it.
  useEffect(() => {
    function handleGlobalKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

  // Keep the keyboard highlight in sync: reset it whenever the query changes
  // the result set, or the dropdown closes, so it never points at a stale row.
  useEffect(() => {
    setHighlightedIndex(-1)
  }, [searchQuery, searchFocused])

  // The actual filtering below is a synchronous in-memory array filter, so
  // there's no real latency to wait out — this is a deliberate, brief,
  // artificial one instead. Typing fast and having suggestions pop in
  // instantly on every keystroke reads as flickery; a short debounce with a
  // skeleton in between (matching the search product this is modeled on)
  // reads as a considered result rather than a twitchy live filter.
  const [searchLoading, setSearchLoading] = useState(false)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchLoading(false)
      return
    }
    setSearchLoading(true)
    const timer = setTimeout(() => setSearchLoading(false), 220)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Same considered-result-over-instant-flash treatment as the search bar's
  // own debounce — opening the bell briefly shows a skeleton before the
  // (already computed, no real network wait involved) list appears.
  const [notifLoading, setNotifLoading] = useState(false)
  useEffect(() => {
    if (!showNotifDropdown) return
    setNotifLoading(true)
    const timer = setTimeout(() => setNotifLoading(false), 220)
    return () => clearTimeout(timer)
  }, [showNotifDropdown])

  const documentsCacheKey = `orbit_documents_cache_${session.user.id}`

  async function fetchDocuments(options = {}) {
    if (!options.silent) setLoading(true)
    let data, error
    try {
      // Without a hard deadline, an unreachable network can leave this
      // request pending indefinitely (Supabase's own retry/auth-refresh
      // logic doesn't give up on its own) — someone offline would be stuck
      // on the loading spinner forever instead of ever reaching the cache
      // fallback below.
      ;({ data, error } = await supabase
        .from('documents')
        .select('*')
        .order('expiry_date', { ascending: true })
        .abortSignal(AbortSignal.timeout(8000)))
    } catch (err) {
      error = err
    }

    if (error) {
      console.error('Error fetching documents:', error)
      // Likely offline (or Supabase unreachable) rather than a real
      // failure — fall back to whatever was last successfully fetched so
      // someone standing in a government office with no signal can still
      // read an expiry date or ID number, instead of an empty screen.
      // Household members aren't cached the same way: the data someone
      // actually needs offline lives on the document itself.
      try {
        const cached = JSON.parse(localStorage.getItem(documentsCacheKey) || 'null')
        if (cached?.documents) {
          setDocuments(cached.documents)
          setOfflineCacheInfo({ cachedAt: cached.cachedAt })
        }
      } catch {
        // no usable cache either — leave documents as whatever it was
      }
      if (!options.silent) setLoading(false)
      return
    }

    setDocuments(data)
    setOfflineCacheInfo(null)
    try {
      localStorage.setItem(documentsCacheKey, JSON.stringify({ documents: data, cachedAt: new Date().toISOString() }))
    } catch {
      // best-effort — quota exceeded or private browsing just means no offline fallback next time
    }
    if (!options.silent) setLoading(false)
    return data
  }

  async function fetchHouseholdMembers() {
    const { data, error } = await supabase
      .from('household_members')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) {
      console.error('Error fetching household members:', error)
      return
    }
    setHouseholdMembers(data)
  }

  // Mirrors isDark onto the root element so plain CSS (autofill overrides,
  // which can't reach React state) can target the current theme.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  async function handleStepsUpdated() {
    // Silent: the modal already updates itself optimistically, so the document
    // grid behind it shouldn't flash to a loading state for this sync.
    const data = await fetchDocuments({ silent: true })
    if (data && selectedDoc) {
      const updated = data.find((d) => d.id === selectedDoc.id)
      if (updated) setSelectedDoc(updated)
    }
  }

  async function confirmAndDelete() {
    setDeleteError('')
    setDeleting(true)
    if (confirmDelete.type === 'single') {
      // count:'exact' matters here: a delete blocked by RLS still returns
      // error:null (Postgrest reports success on 0 matched rows), so
      // "no error" alone can't tell us the row was actually removed.
      const { error, count } = await supabase.from('documents').delete({ count: 'exact' }).eq('id', confirmDelete.id)
      setDeleting(false)
      if (error) {
        setDeleteError(error.message)
        return
      }
      if (!count) {
        setDeleteError(translate('delete_error_single'))
        return
      }
      const deletedDoc = enriched.find((d) => d.id === confirmDelete.id)
      logAction(`Deleted ${deletedDoc?.title || 'a document'}`, 'delete')
      fetchDocuments()
    } else if (confirmDelete.type === 'bulk') {
      const { error, count } = await supabase.from('documents').delete({ count: 'exact' }).in('id', selectedIds)
      setDeleting(false)
      if (error) {
        setDeleteError(error.message)
        return
      }
      if (!count) {
        setDeleteError(translate('delete_error_bulk'))
        return
      }
      logAction(`Deleted ${count} document${count === 1 ? '' : 's'}`, 'delete')
      setSelectedIds([])
      setSelectionMode(false)
      fetchDocuments()
    }
    setConfirmDelete(null)
  }

  function toggleSelected(docId) {
    setSelectedIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    )
  }

  function saveSearch(query) {
    if (!query.trim()) return
    // Functional update, not `[query, ...recentSearches...]` off the
    // closed-over value — two saves/removals landing in the same tick (fast
    // repeated clicks, or this firing right after a removeSearch) would
    // otherwise both read the same stale `recentSearches` and the second
    // setRecentSearches call would silently clobber the first, which is
    // what made deletes look like they needed a second click to register.
    setRecentSearches((prev) => {
      // No hard cap — older searches used to just get silently dropped past
      // 5. They stick around now; the list scrolls instead (see the recent-
      // searches panel) rather than throwing history away. Still bounded
      // so this can't grow forever in localStorage.
      const updated = [query, ...prev.filter((s) => s !== query)].slice(0, 100)
      localStorage.setItem('orbit_recent_searches', JSON.stringify(updated))
      return updated
    })
  }

  // Typing alone already live-filters `filtered` (see below) — but that only
  // shows up if you happen to already be on a view that renders it. Actually
  // submitting a search needs to take you somewhere that view exists: a flat,
  // all-orbits grid rather than My Orbits' per-department accordion.
  function executeSearch(query) {
    const trimmed = query.trim()
    if (!trimmed) return
    setSearchQuery(trimmed)
    saveSearch(trimmed)
    setShowSettings(false)
    setSelectionMode(false)
    setSelectedOrbit(null)
    setActiveFilter('all')
    setActiveNav('search_results')
    setSearchFocused(false)
  }

  // Opens a tracked document from search the same way clicking it in My
  // Orbits would — drilled into its department, filtered down to just that
  // title — rather than jumping straight into its step checklist, which is
  // a different, heavier context than "here's the thing you searched for."
  function openSuggestedDoc(doc) {
    const dept = AGENCY_BADGE[doc.doc_type]?.label
    saveSearch(doc.title)
    setShowSettings(false)
    setSelectionMode(false)
    setActiveNav('my_documents')
    setSelectedOrbit(dept || null)
    setActiveFilter('all')
    setSearchQuery(doc.title)
    setSearchFocused(false)
  }

  // Same "land on just this document inside its orbit" destination as
  // openSuggestedDoc, for the bell dropdown instead of search — no search
  // state to touch here, closes the notif dropdown instead of the search one.
  function openNotificationDoc(doc) {
    const dept = AGENCY_BADGE[doc.doc_type]?.label
    markNotifRead(doc.id)
    setShowSettings(false)
    setSelectionMode(false)
    setActiveNav('my_documents')
    setSelectedOrbit(dept || null)
    setActiveFilter('all')
    setSearchQuery(doc.title)
    setShowNotifDropdown(false)
  }

  // A document TYPE the user doesn't have tracked yet has no id/expiry/
  // orbit of its own to open — the closest equivalent destination is the
  // Documents (Requirements) tab, which lists every known type, tracked or
  // not, with an Add button already built in.
  function openSuggestedType(label) {
    saveSearch(label)
    setShowSettings(false)
    setSelectionMode(false)
    setActiveNav('requirements')
    setSearchFocused(false)
  }

  function removeSearch(query) {
    setRecentSearches((prev) => {
      const updated = prev.filter((s) => s !== query)
      localStorage.setItem('orbit_recent_searches', JSON.stringify(updated))
      return updated
    })
  }

  function handleSearchKeyDown(e) {
    if (e.key === 'Tab' && ghostSuggestion) {
      e.preventDefault()
      setSearchQuery(ghostSuggestion)
      return
    }

    const total = matchingRecent.length + matchingDocSuggestions.length
    if (showSuggestions && total > 0 && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault()
      setHighlightedIndex((prev) => {
        if (e.key === 'ArrowDown') return prev < total - 1 ? prev + 1 : 0
        // Unlike ArrowDown, ArrowUp doesn't wrap past the top — it backs
        // out to -1 (nothing highlighted, back to typing) and stops there,
        // rather than looping around to the last suggestion.
        return prev > 0 ? prev - 1 : -1
      })
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      if (showSuggestions && highlightedIndex >= 0 && highlightedIndex < total) {
        if (highlightedIndex < matchingRecent.length) {
          executeSearch(matchingRecent[highlightedIndex])
        } else {
          matchingDocSuggestions[highlightedIndex - matchingRecent.length].onSelect()
        }
        return
      }
      executeSearch(searchQuery)
      return
    }

    if (e.key === 'Escape') {
      setSearchFocused(false)
    }
  }

  // Google-omnibox style: clicking past the end of the typed text (rather than
  // inside it) selects everything, so the next keystroke replaces it outright.
  function handleSearchMouseUp(e) {
    const input = e.target
    if (input.value && input.selectionStart === input.value.length && input.selectionEnd === input.value.length) {
      input.select()
    }
  }

  // Clicking into the field after it was blurred selects the whole value (also
  // omnibox-style). The native focus+caret-placement is prevented so it doesn't
  // immediately collapse the selection we're about to set.
  function handleSearchMouseDown(e) {
    if (document.activeElement !== searchInputRef.current) {
      e.preventDefault()
      searchInputRef.current.focus()
      searchInputRef.current.select()
    }
  }

  const enriched = documents.map((doc) => {
    const daysUntil = getDaysUntilExpiry(doc.expiry_date)
    // Applying for a document has no real expiry to be "on track" or "due
    // soon" against — it gets its own status instead of a fabricated one.
    const urgency = doc.intent === 'application' ? 'ongoing' : getUrgencyLevel(daysUntil)
    return { ...doc, daysUntil, urgency }
  })
  // Documents with an actual step checklist (a playbook), soonest-deadline
  // first — this is what the "In Progress" stat cards on My Space show, so
  // the most actionable ones surface first.
  const progressDocs = enriched
    .filter((doc) => getPlaybook(doc.doc_type, doc.intent))
    .sort((a, b) => a.daysUntil - b.daysUntil)

  // Bell dropdown contents — anything within the 30-day "urgent" window
  // (which nests the 7-day "critical" window inside it) plus anything
  // already expired. `upcoming` (31-90 days) deliberately doesn't page you
  // yet; `ongoing` (an in-progress application) has no real expiry to
  // notify about at all.
  const notifDocs = enriched
    .filter((doc) => {
      // Expired is otherwise unbounded on the far end — without this, a
      // document that lapsed years ago would sit in this list forever.
      // Two months (60 days) past expiry and it drops off; still visible
      // in My Orbits/History, just not nagging from the bell anymore.
      if (doc.urgency === 'expired') return doc.daysUntil >= -60
      return doc.urgency === 'critical' || doc.urgency === 'urgent'
    })
    .sort((a, b) => a.daysUntil - b.daysUntil)
  const notifUnreadCount = notifDocs.filter((doc) => !seenNotifIds.has(doc.id)).length
  const notifVisibleDocs = notifFilterTab === 'unread'
    ? notifDocs.filter((doc) => !readNotifIds.has(doc.id))
    : notifDocs
  const notifNewDocs = notifVisibleDocs.filter((doc) => !readNotifIds.has(doc.id))
  const notifEarlierDocs = notifVisibleDocs.filter((doc) => readNotifIds.has(doc.id))

  function markNotifRead(id) {
    setReadNotifIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)))
  }
  function markAllNotifsRead() {
    setReadNotifIds((prev) => {
      const next = new Set(prev)
      notifDocs.forEach((doc) => next.add(doc.id))
      return next
    })
  }

  function renderNotifRow(doc, unread) {
    const { title } = notificationMessage(doc)
    const code = AGENCY_BADGE[doc.doc_type]?.label || 'OTHER'
    return (
      <button
        key={doc.id}
        onClick={() => openNotificationDoc(doc)}
        className="glass-interactive glass-interactive-flat w-full flex items-center gap-2.5 px-2 py-2 rounded-xl text-left"
      >
        <AgencyBubble isDark={isDark} code={code} size={28} ring={false} />
        <span className="min-w-0 flex-1">
          <span className={`block text-sm truncate ${t(isDark, 'text-slate-200', 'text-slate-700')}`}>{title}</span>
          <span className="block text-xs text-slate-500 truncate">{formatCompactDaysUntil(doc.daysUntil)}</span>
        </span>
        {unread && <span className="w-2 h-2 rounded-full shrink-0 ml-1" style={{ backgroundColor: 'var(--accent-400)' }} />}
      </button>
    )
  }

  const filtered = enriched.filter((doc) => {
    if (searchQuery && !doc.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (activeNav === 'my_documents' && selectedOrbit && AGENCY_BADGE[doc.doc_type]?.label !== selectedOrbit) return false
    if (activeFilter === 'all') return true
    if (activeFilter === 'active') return doc.urgency !== 'expired'
    if (activeFilter === 'expiring_soon') return doc.urgency === 'urgent' || doc.urgency === 'critical'
    if (activeFilter === 'expired') return doc.urgency === 'expired'
    return true
  }).sort((a, b) => {
    if (sortBy === 'name') return (a.title || '').localeCompare(b.title || '')
    if (sortBy === 'department') {
      const deptA = DEPARTMENT_NAMES[AGENCY_BADGE[a.doc_type]?.label] || ''
      const deptB = DEPARTMENT_NAMES[AGENCY_BADGE[b.doc_type]?.label] || ''
      return deptA.localeCompare(deptB) || a.daysUntil - b.daysUntil
    }
    return a.daysUntil - b.daysUntil // 'expiry' — soonest first, same order the urgency system already prioritizes elsewhere
  })

  // Only departments the user actually has something tracked with show up as
  // orbits — an empty orbit for every possible PH agency would just be noise
  // (that's what Requirements is for). Grouped by issuing department rather
  // than document type, since National ID and PSA Birth Certificate are both
  // "PSA" as far as the orbit view is concerned.
  const orbitCounts = {}
  enriched.forEach((doc) => {
    const dept = AGENCY_BADGE[doc.doc_type]?.label || 'OTHER'
    orbitCounts[dept] = (orbitCounts[dept] || 0) + 1
  })
  const orbitGroups = Object.keys(orbitCounts)
    .map((dept) => ({
      docType: dept,
      count: orbitCounts[dept],
      label: DEPARTMENT_NAMES[dept] || dept,
    }))
    .sort((a, b) => a.label.localeCompare(b.label))

  const allFilteredSelected = filtered.length > 0 && filtered.every((d) => selectedIds.includes(d.id))
  function toggleSelectAll() {
    setSelectedIds(allFilteredSelected ? [] : filtered.map((d) => d.id))
  }

  // Focusing an empty field shows the plain search history (Google-style);
  // once there's a query, it narrows to matches and document recommendations
  // join in below.
  const hasSearchQuery = searchQuery.trim().length > 0
  const matchingRecent = hasSearchQuery
    ? recentSearches.filter((s) =>
        s.toLowerCase().startsWith(searchQuery.toLowerCase()) && s.toLowerCase() !== searchQuery.toLowerCase()
      )
    : recentSearches
  const ghostSuggestion = hasSearchQuery ? matchingRecent[0] || null : null

  // Recent searches are stored as plain strings, not references — this
  // resolves one back to whatever document/type it most likely came from,
  // purely to show the same type + department subtitle a live suggestion
  // gets. Best-effort: a free-text query that doesn't match anything just
  // renders without one.
  function describeQuery(query) {
    const q = query.toLowerCase()
    const trackedMatch = enriched.find((d) => d.title.toLowerCase() === q)
    if (trackedMatch) {
      const code = AGENCY_BADGE[trackedMatch.doc_type]?.label || 'OTHER'
      const typeLabel = DOC_TYPE_LABELS[trackedMatch.doc_type] || translate('search_docs_heading')
      return { subtitle: `${typeLabel} • ${DEPARTMENT_NAMES[code] || code}`, code }
    }
    const typeMatch = DOC_TYPE_OPTIONS.find((opt) => opt.label.toLowerCase() === q)
    if (typeMatch) {
      const code = AGENCY_BADGE[typeMatch.value]?.label || 'OTHER'
      return { subtitle: `${DEPARTMENT_NAMES[code] || code} • ${translate('search_not_added')}`, code }
    }
    return null
  }

  // Every known document type is searchable, not just ones the user
  // already tracks — someone typing "passport" should find Passport even
  // with zero documents saved, just visibly marked as not added yet rather
  // than opened like a real tracked one.
  const trackedDocTypesForSearch = new Set(enriched.map((d) => d.doc_type))
  const matchingTrackedDocs = hasSearchQuery
    ? enriched.filter((doc) => doc.title.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 4)
    : []
  const matchingUntrackedTypes = hasSearchQuery
    ? DOC_TYPE_OPTIONS.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) && !trackedDocTypesForSearch.has(opt.value)
      ).slice(0, 4)
    : []
  const matchingDocSuggestions = [
    ...matchingTrackedDocs.map((doc) => {
      const code = AGENCY_BADGE[doc.doc_type]?.label || 'OTHER'
      return {
        key: `doc-${doc.id}`,
        title: doc.title,
        subtitle: `${DOC_TYPE_LABELS[doc.doc_type] || translate('search_docs_heading')} • ${DEPARTMENT_NAMES[code] || code}`,
        code,
        tracked: true,
        onSelect: () => openSuggestedDoc(doc),
      }
    }),
    ...matchingUntrackedTypes.map((opt) => {
      const code = AGENCY_BADGE[opt.value]?.label || 'OTHER'
      return {
        key: `type-${opt.value}`,
        title: opt.label,
        subtitle: `${DEPARTMENT_NAMES[code] || code} • ${translate('search_not_added')}`,
        code,
        tracked: false,
        onSelect: () => openSuggestedType(opt.label),
      }
    }),
  ].slice(0, 6)
  const showSuggestions = searchFocused && (matchingRecent.length > 0 || matchingDocSuggestions.length > 0)

  // Shared by the flat Reminders/History views and by each expanded orbit
  // in My Space — same status filter pills + document grid either way, just
  // scoped to whatever `filtered` currently resolves to.
  function renderFilterBarAndGrid() {
    return (
      <>
        <div
          className="flex flex-wrap items-center justify-between gap-4 mb-6"
          style={{ animation: 'rise-in 0.5s cubic-bezier(0.16,1,0.3,1) 0.05s both' }}
        >
          <div className="relative flex items-center gap-1 rounded-full p-1.5">
            {filterIndicator && (
              <div
                className={t(isDark, 'absolute top-1.5 bottom-1.5 rounded-full glass-chip-dark', 'absolute top-1.5 bottom-1.5 rounded-full glass-chip-light')}
                style={{ left: filterIndicator.left, width: filterIndicator.width, transition: 'left 250ms cubic-bezier(0.4, 0, 0.2, 1), width 250ms cubic-bezier(0.4, 0, 0.2, 1)' }}
              />
            )}
            {FILTERS.map((f) => (
              <button
                key={f.id}
                ref={(el) => {
                  filterRefs.current[f.id] = el
                  // The activeFilter-keyed effect below can't reposition the
                  // indicator until these buttons exist in the DOM — inside
                  // an orbit accordion they mount fresh each time it opens
                  // (after being unmounted while closed), which can land
                  // after that effect already ran and found nothing. Measure
                  // directly the moment the active button itself mounts.
                  if (el && f.id === activeFilter) {
                    const left = el.offsetLeft
                    const width = el.offsetWidth
                    // Functional form so an unchanged measurement returns the
                    // exact same object back — React bails out of re-rendering
                    // on that, which is what keeps this from looping forever
                    // (this ref callback is a new function every render, so
                    // it re-fires on every render; an unconditional setState
                    // here would re-trigger itself infinitely).
                    setFilterIndicator((prev) =>
                      prev && prev.left === left && prev.width === width ? prev : { left, width }
                    )
                  }
                }}
                onClick={() => setActiveFilter(f.id)}
                className={`glass-interactive glass-interactive-tab relative z-10 px-5 py-2 rounded-full text-sm ${
                  activeFilter === f.id
                    ? t(isDark, 'text-slate-100', 'text-slate-900')
                    : t(isDark, 'text-slate-400 hover:text-slate-100', 'text-slate-500 hover:text-slate-900')
                }`}
              >
                {translate(f.labelKey)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {selectionMode && (
              <>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={toggleSelectAll}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSelectAll() } }}
                  className={t(isDark,
                    'flex items-center gap-2 text-sm text-slate-300 hover:text-slate-100 cursor-pointer select-none',
                    'flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 cursor-pointer select-none'
                  )}
                >
                  <ThemedCheckbox isDark={isDark} checked={allFilteredSelected} onClick={toggleSelectAll} size={16} />
                  {translate('select_all')}
                </div>
                <span className={t(isDark, 'text-sm text-slate-400', 'text-sm text-slate-500')}>{translate('n_selected', { count: selectedIds.length })}</span>
                <button
                  onClick={() => setConfirmDelete({ type: 'bulk', count: selectedIds.length })}
                  disabled={selectedIds.length === 0}
                  className={t(isDark,
                    'text-sm font-medium bg-red-500/15 text-red-300 px-3 py-2 rounded-xl hover:bg-red-500/25 disabled:opacity-40',
                    'text-sm font-medium bg-red-100 text-red-700 px-3 py-2 rounded-xl hover:bg-red-200 disabled:opacity-40'
                  )}
                >
                  {translate('delete_selected')}
                </button>
                <button
                  onClick={() => { setSelectionMode(false); setSelectedIds([]) }}
                  className={t(isDark, 'text-sm text-slate-400 hover:text-slate-100 px-3 py-2', 'text-sm text-slate-500 hover:text-slate-900 px-3 py-2')}
                >
                  {translate('confirm_cancel')}
                </button>
              </>
            )}
            {!selectionMode && (
              <div className="relative">
                <button
                  onClick={() => setShowSortMenu((v) => !v)}
                  className={`glass-interactive flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl ${t(isDark, 'text-slate-300', 'text-slate-600')}`}
                >
                  <Icon size={14}><path d="M3 6h18M6 12h12M10 18h4" /></Icon>
                  {translate(SORT_OPTIONS.find((o) => o.id === sortBy).labelKey)}
                  <Icon size={12}><path d="M6 9l6 6 6-6" /></Icon>
                </button>
                {sortMenuShouldRender && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                    <div
                      style={{ animation: showSortMenu ? 'dropdown-in 140ms ease-out' : 'dropdown-out 140ms ease-in forwards' }}
                      className={t(isDark,
                        'absolute right-0 mt-2 w-44 z-20 bg-[#0a0a0f] border border-white/10 shadow-xl rounded-xl p-1.5 origin-top-right',
                        'absolute right-0 mt-2 w-44 z-20 bg-white border border-slate-200 shadow-xl rounded-xl p-1.5 origin-top-right'
                      )}
                    >
                      {SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => { setSortBy(opt.id); setShowSortMenu(false) }}
                          className={`glass-interactive glass-interactive-flat w-full flex items-center justify-between text-left px-3 py-1.5 rounded-lg text-sm ${
                            sortBy === opt.id ? t(isDark, 'text-slate-100', 'text-slate-900') : t(isDark, 'text-slate-300', 'text-slate-600')
                          }`}
                        >
                          {translate(opt.labelKey)}
                          {sortBy === opt.id && <Icon size={13}><path d="M20 6L9 17l-5-5" /></Icon>}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Document cards. contain: layout below — the sidebar's collapse/
            expand animates its own width, which without this forces every
            card in this grid to reflow on every animation frame. With a
            lot of documents tracked, that reflow cost is what actually
            reads as "the sidebar is laggy" even though the sidebar itself
            is cheap. */}
        {loading ? (
          <p className="text-slate-500">{translate('loading')}</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4" style={{ contain: 'layout' }}>
            <AddDocumentTile
              isDark={isDark}
              onClick={() => openAddDocument(undefined, activeNav === 'my_documents' ? selectedOrbit : null)}
              tileRef={addTileRef}
            />
            {filtered.length === 0 && (
              <p className="text-slate-500 col-span-full">{translate('card_no_match')}</p>
            )}
            {filtered.map((doc, i) => {
              const meta = URGENCY_META[doc.urgency]
              const playbook = getPlaybook(doc.doc_type, doc.intent)
              const totalSteps = playbook?.steps.length || 0
              const completedCount = (doc.completed_steps || []).length
              // A literal empty bar reads as "you haven't started." Tracking the
              // document at all is itself progress, so the bar never bottoms out —
              // the fraction label ("0/6") stays honest, only the visual gets a floor.
              const progressPct = totalSteps ? Math.max(8, Math.round((completedCount / totalSteps) * 100)) : 0
              const nextStepIndex = playbook
                ? playbook.steps.findIndex((_, i) => !(doc.completed_steps || []).includes(i))
                : -1
              const nextStepText = playbook
                ? nextStepIndex !== -1 ? playbook.steps[nextStepIndex].title : 'All steps complete'
                : null
              const isSelected = selectedIds.includes(doc.id)

              return (
                <div
                  key={doc.id}
                  onClick={() => selectionMode ? toggleSelected(doc.id) : setSelectedDoc(doc)}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={`glass-interactive relative text-left rounded-2xl p-3 cursor-pointer ${t(isDark,
                    isSelected ? 'border border-blue-400/60 bg-blue-950' : 'glass-dark',
                    isSelected ? 'border border-blue-400 bg-blue-50' : 'glass-light'
                  )}`}
                  style={{
                    ...(isDark && !isSelected ? { backgroundColor: 'rgba(255,255,255,0.02)' } : null),
                    animation: `rise-in 0.5s cubic-bezier(0.16,1,0.3,1) ${Math.min(i * 0.04, 0.4)}s both`,
                  }}
                >
                  {selectionMode && (
                    <div className="absolute top-5 left-5 z-20">
                      <ThemedCheckbox isDark={isDark} checked={isSelected} onClick={() => toggleSelected(doc.id)} />
                    </div>
                  )}

                  <div className={`flex justify-between items-center gap-2 mb-2 ${selectionMode ? 'pl-6' : ''}`}>
                    <div className="min-w-0 flex items-center gap-1.5">
                      <p className={t(isDark, 'text-xs font-medium text-slate-300 truncate', 'text-xs font-medium text-slate-600 truncate')}>{doc.title}</p>
                      {doc.household_member_id && householdMembers.find((m) => m.id === doc.household_member_id) && (
                        <HouseholdMemberAvatar
                          member={householdMembers.find((m) => m.id === doc.household_member_id)}
                          size={16}
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {!selectionMode && (
                        <div onClick={(e) => e.stopPropagation()}>
                          <ThreeDotMenu
                            isDark={isDark}
                            id={`menu-doc-${doc.id}`}
                            openId={openMenuId}
                            setOpenId={setOpenMenuId}
                            options={[
                              { label: translate('card_select'), onClick: () => { setSelectionMode(true); toggleSelected(doc.id) } },
                              { label: translate('card_delete'), danger: true, onClick: () => setConfirmDelete({ type: 'single', id: doc.id }) },
                            ]}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <FlippableIDCard
                    flipped={!!flippedIds[doc.id]}
                    onFlip={() => setFlippedIds((f) => ({ ...f, [doc.id]: !f[doc.id] }))}
                    front={
                      <div className={doc.urgency === 'ongoing' ? 'opacity-50' : ''}>
                        <DocumentCardFront
                          docType={doc.doc_type}
                          title={doc.title}
                          fields={doc.urgency === 'ongoing' ? {} : (doc.card_fields || {})}
                          expiryDate={doc.urgency === 'ongoing' ? '' : doc.expiry_date}
                          photoPath={doc.photo_path}
                        />
                      </div>
                    }
                    back={
                      <IDCardBack
                        docType={doc.doc_type}
                        doc={doc}
                        meta={meta}
                        playbook={playbook}
                        totalSteps={totalSteps}
                        completedCount={completedCount}
                        progressPct={progressPct}
                        nextStepText={nextStepText}
                      />
                    }
                  />
                </div>
              )
            })}
          </div>
        )}
      </>
    )
  }

  return (
    <div
      className={`relative h-screen w-full overflow-hidden ${t(isDark, 'text-slate-200', 'text-slate-900')}`}
      style={{
        backgroundColor: isDark ? '#050505' : '#f4f7fb',
        '--accent-400': AVATAR_ACCENT_HEX[profileColor]?.[400] || AVATAR_ACCENT_HEX[0][400],
        '--accent-500': AVATAR_ACCENT_HEX[profileColor]?.[500] || AVATAR_ACCENT_HEX[0][500],
        '--accent-600': AVATAR_ACCENT_HEX[profileColor]?.[600] || AVATAR_ACCENT_HEX[0][600],
      }}
    >
      {/* Deep space base + starfield, both themes. Always mounted (styled
          via isDark ternaries, never conditionally rendered) so switching
          themes is a plain prop/style update on existing nodes instead of
          unmounting/remounting layers — that mount cost (new gradient
          layers, animations restarting from t=0) was why light→dark had a
          faint delay that dark→light never did, since the light branch
          used to render fewer nodes than the dark one. Shared with the
          landing page's demo/FAQ sections so "night mode" means the exact
          same background everywhere, not just a similar one. */}
      <StarfieldBackground isDark={isDark} />

      <div className="relative z-10 h-full w-full flex overflow-hidden p-3 gap-3">
      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        onClick={() => { if (!sidebarOpen) setSidebarOpen(true) }}
        className={`hidden md:flex flex-col h-full rounded-2xl py-6 shrink-0 overflow-hidden transition-[width,padding] duration-300 ease-in-out ${sidebarOpen ? 'w-64 px-5 cursor-default' : 'w-20 px-3 cursor-pointer'}`}
      >
        <div className={`flex items-center mb-10 ${sidebarOpen ? 'justify-between px-2' : 'justify-center'}`}>
          {showSettings ? (
            <button
              onClick={(e) => { e.stopPropagation(); setShowSettings(false) }}
              className={`glass-interactive flex items-center gap-2 rounded-full ${sidebarOpen ? 'pr-3' : ''} ${t(isDark, 'text-slate-300', 'text-slate-700')}`}
              title={translate('nav_back_to_dashboard')}
            >
              <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0">
                <Icon size={14}><path d="M15 18l-6-6 6-6" /></Icon>
              </span>
              {sidebarOpen && <span className="font-semibold whitespace-nowrap">{translate('settings_title')}</span>}
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); window.location.reload() }}
              className={`glass-interactive flex items-center gap-2 rounded-full ${sidebarOpen ? 'pr-3' : ''}`}
            >
              <img src={orbitLogo} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
              {sidebarOpen && <span className={`font-dancing text-lg whitespace-nowrap ${t(isDark, 'text-slate-100', 'text-slate-900')}`}>Orbit</span>}
            </button>
          )}
          {sidebarOpen && (
            <button
              onClick={(e) => { e.stopPropagation(); setSidebarOpen(false) }}
              className={`glass-interactive p-1.5 rounded-full ${t(isDark,
                'text-slate-500 hover:text-slate-100 hover:bg-white/10',
                'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              )}`}
            >
              <Icon size={16}><path d="M15 18l-6-6 6-6" /></Icon>
            </button>
          )}
        </div>

        {showSettings ? (
          <nav
            key="settings-nav"
            className="flex flex-col gap-4 flex-1 overflow-y-auto no-scrollbar"
            style={{ animation: 'flashcard-in-forward 220ms ease-out' }}
          >
            {SETTINGS_NAV.map((group) => (
              <div key={group.sectionKey} className="flex flex-col gap-1.5">
                {sidebarOpen && (
                  <p className={t(isDark,
                    'text-[11px] font-semibold tracking-wider text-slate-500 px-2 mb-1',
                    'text-[11px] font-semibold tracking-wider text-slate-400 px-2 mb-1'
                  )}>
                    {translate(group.sectionKey)}
                  </p>
                )}
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    title={translate(item.labelKey)}
                    onClick={(e) => { e.stopPropagation(); setSettingsTab(item.id) }}
                    className={`glass-interactive flex items-center rounded-xl text-sm text-left ${
                      sidebarOpen ? 'gap-3 py-2 px-2 whitespace-nowrap' : 'flex-col gap-0.5 py-2 px-1 justify-center text-center'
                    } ${
                      item.id === settingsTab
                        ? t(isDark, 'glass-chip-dark', 'glass-chip-light')
                        : t(isDark, 'text-slate-400 hover:bg-white/5 hover:text-slate-100', 'text-slate-500 hover:bg-slate-50 hover:text-slate-900')
                    }`}
                  >
                    <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0">
                      {item.iconSrc ? (
                        <img
                          src={item.iconSrc}
                          alt=""
                          className="w-[18px] h-[18px] object-contain"
                          style={{ filter: isDark ? 'invert(1) brightness(1.3)' : 'brightness(0) opacity(0.6)' }}
                        />
                      ) : (
                        <Icon size={15}>{item.icon}</Icon>
                      )}
                    </span>
                    {sidebarOpen ? (
                      <span className="flex-1 min-w-0 truncate">{translate(item.labelKey)}</span>
                    ) : (
                      <span className="text-[9px] leading-tight font-medium">{translate(item.labelKey)}</span>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </nav>
        ) : (
          <nav
            key="dashboard-nav"
            className="flex flex-col gap-1.5 flex-1"
            style={{ animation: 'flashcard-in-backward 220ms ease-out' }}
          >
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                title={translate(item.labelKey)}
                onClick={(e) => { e.stopPropagation(); selectNav(item.id) }}
                className={`glass-interactive flex items-center rounded-xl text-sm text-left ${
                  sidebarOpen ? 'gap-3 py-2 px-2 whitespace-nowrap' : 'flex-col gap-0.5 py-2 px-1 justify-center text-center'
                } ${
                  item.id === activeNav
                    ? t(isDark, 'glass-chip-dark', 'glass-chip-light')
                    : t(isDark, 'text-slate-400 hover:bg-white/5 hover:text-slate-100', 'text-slate-500 hover:bg-slate-50 hover:text-slate-900')
                }`}
              >
                <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0">
                  <img
                    src={item.iconSrc}
                    alt=""
                    className="w-[18px] h-[18px] object-contain"
                    style={{ filter: isDark ? 'invert(1) brightness(1.3)' : 'brightness(0) opacity(0.6)' }}
                  />
                </span>
                {sidebarOpen ? (
                  translate(item.labelKey)
                ) : (
                  <span className="text-[9px] leading-tight font-medium">{translate(item.labelKey)}</span>
                )}
              </button>
            ))}
          </nav>
        )}

        <div className="flex flex-col gap-1 pt-4">
          {!showSettings && (
          <button
            title={translate('nav_settings')}
            onClick={(e) => { e.stopPropagation(); setShowSettings(true); setSettingsTab('general') }}
            className={`glass-interactive flex items-center rounded-xl text-sm text-left ${sidebarOpen ? 'gap-3 py-2 px-2 whitespace-nowrap' : 'flex-col gap-0.5 py-2 px-1 justify-center text-center'} ${t(isDark, 'text-slate-400 hover:bg-white/5 hover:text-slate-100', 'text-slate-500 hover:bg-slate-50 hover:text-slate-900')}`}
          >
            <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0">
              <img
                src={settingsIcon}
                alt=""
                className="w-[18px] h-[18px] object-contain"
                style={{ filter: isDark ? 'invert(1) brightness(1.3)' : 'brightness(0) opacity(0.6)' }}
              />
            </span>
            {sidebarOpen ? (
              translate('nav_settings')
            ) : (
              <span className="text-[9px] leading-tight font-medium">{translate('nav_settings')}</span>
            )}
          </button>
          )}
          <button
            title={translate('nav_logout')}
            onClick={(e) => { e.stopPropagation(); setConfirmLogout(true) }}
            className={`glass-interactive flex items-center rounded-xl text-sm text-left ${sidebarOpen ? 'gap-3 py-2 px-2 whitespace-nowrap' : 'flex-col gap-0.5 py-2 px-1 justify-center text-center'} ${t(isDark, 'text-slate-400 hover:bg-white/5 hover:text-red-300', 'text-slate-500 hover:bg-slate-50 hover:text-red-500')}`}
          >
            <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0">
              <img src={logoutIcon} alt="" className="w-[15px] h-[15px] object-contain" style={{ filter: isDark ? 'invert(1) brightness(1.3)' : 'brightness(0) opacity(0.6)' }} />
            </span>
            {sidebarOpen ? (
              translate('nav_logout')
            ) : (
              <span className="text-[9px] leading-tight font-medium">{translate('nav_logout')}</span>
            )}
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 min-w-0 h-full flex flex-col gap-3 overflow-hidden pt-1.5">
        {isGuest && (
          <div
            className="shrink-0 flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-sm backdrop-blur-xl backdrop-saturate-150"
            style={{ backgroundColor: 'color-mix(in srgb, var(--accent-500) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--accent-500) 30%, transparent)' }}
          >
            <span className={t(isDark, 'text-slate-300', 'text-slate-700')}>{translate('guest_banner_text')}</span>
            <button
              onClick={onUpgradeAccount}
              className="glass-accent glass-interactive shrink-0 text-xs font-semibold text-white px-3 py-1.5 rounded-lg"
            >
              {translate('guest_banner_cta')}
            </button>
          </div>
        )}
        {offlineCacheInfo && (
          <div
            className="shrink-0 flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-sm backdrop-blur-xl backdrop-saturate-150"
            style={{ backgroundColor: 'color-mix(in srgb, var(--accent-500) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--accent-500) 30%, transparent)' }}
          >
            <span className={t(isDark, 'text-slate-300', 'text-slate-700')}>
              {translate('offline_banner_text', { time: formatTimeAgo(offlineCacheInfo.cachedAt) })}
            </span>
            <button
              onClick={() => fetchDocuments()}
              className="glass-accent glass-interactive shrink-0 text-xs font-semibold text-white px-3 py-1.5 rounded-lg"
            >
              {translate('offline_banner_retry')}
            </button>
          </div>
        )}
        {/* Top bar — floats on the page background; each control is its own bubble */}
        <div className="shrink-0 flex items-center justify-between">
          {/* h-11 pins this to the collapsed pill's own height — the panel
              below is `absolute` (out of flow) precisely so that it growing
              taller to fit suggestions never pushes this row, or anything
              after it in the page, downward. It overlays in front instead. */}
          <div className="relative w-full max-w-xs h-11 group">
            {searchFocused && (
              <div className="fixed inset-0 z-10" onClick={() => setSearchFocused(false)} onMouseDown={(e) => e.stopPropagation()} />
            )}
            <div
              className={`absolute inset-x-0 top-0 z-20 overflow-hidden transition-all duration-200 ${t(isDark, 'glass-dark', 'glass-light')} ${
                // Tailwind's rounded-full compiles to an enormous fixed
                // border-radius (not literally infinite, but functionally
                // so at this element's height) rather than scaling with it.
                // Animating from that down to rounded-2xl's 16px spends
                // nearly the whole transition still looking like a full
                // pill — visually nothing happens until the very last
                // fraction of a percent of progress, which reads as an
                // abrupt snap right at the end instead of a smooth morph.
                // rounded-[22px] is a normal finite value that already
                // reads as a full pill at this bar's ~44px height, so the
                // eased transition actually plays out over the whole 200ms.
                searchFocused ? 'rounded-2xl' : 'rounded-[22px]'
              }`}
              style={{
                boxShadow: searchFocused ? (isDark ? '0 16px 40px -12px rgba(0,0,0,0.6)' : '0 16px 40px -16px rgba(15,23,42,0.25)') : undefined,
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="relative flex items-center">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                  <Icon><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></Icon>
                </span>
                {searchFocused && ghostSuggestion && (
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 flex items-center pl-11 pr-20 py-2.5 text-sm whitespace-pre overflow-hidden pointer-events-none"
                  >
                    <span className="invisible">{searchQuery}</span>
                    <span className={t(isDark, 'text-slate-600', 'text-slate-400')}>{ghostSuggestion.slice(searchQuery.length)}</span>
                  </div>
                )}
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={translate('topbar_search_placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onKeyDown={handleSearchKeyDown}
                  onMouseDown={handleSearchMouseDown}
                  onMouseUp={handleSearchMouseUp}
                  className={t(isDark,
                    'relative w-full bg-transparent pl-11 pr-20 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none',
                    'relative w-full bg-transparent pl-11 pr-20 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none'
                  )}
                />
                <span
                  className={t(isDark,
                    'absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-white/[0.08] px-2 py-1 rounded-md pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150',
                    'absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150'
                  )}
                >
                  Ctrl K
                </span>
              </div>
              {searchFocused && (
                <div
                  className={`py-2 px-2 border-t ${t(isDark, 'border-white/10', 'border-slate-200')}`}
                  style={{ animation: 'fade-slide-in 0.15s ease-out both' }}
                >
                  {searchLoading && hasSearchQuery ? (
                    <div className="flex flex-col gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-2.5 px-1 py-2.5">
                          <span className={`w-9 h-9 rounded-full shrink-0 animate-pulse ${t(isDark, 'bg-white/10', 'bg-slate-200')}`} />
                          <span className="min-w-0 flex-1 flex flex-col gap-1.5">
                            <span className={`block h-3 rounded-full animate-pulse ${t(isDark, 'bg-white/10', 'bg-slate-200')}`} style={{ width: `${65 - i * 8}%` }} />
                            <span className={`block h-2.5 rounded-full animate-pulse ${t(isDark, 'bg-white/5', 'bg-slate-100')}`} style={{ width: `${40 - i * 5}%` }} />
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {matchingRecent.length === 0 && matchingDocSuggestions.length === 0 && (
                        <p className={`text-sm px-2 py-2 ${t(isDark, 'text-slate-500', 'text-slate-400')}`}>
                          {translate('search_empty_state')}
                        </p>
                      )}

                      {matchingRecent.length > 0 && (
                        <div>
                          <p className="text-xs text-slate-500 px-2 pb-1">{translate('search_recent_heading')}</p>
                          {/* Nothing gets dropped past 5 anymore (see saveSearch) — this
                              scrolls to reach older entries instead of history being
                              silently discarded. */}
                          <div className="max-h-[300px] overflow-y-auto">
                          {matchingRecent.map((s, i) => {
                            const meta = describeQuery(s)
                            return (
                              <div
                                key={s}
                                onMouseEnter={() => setHighlightedIndex(i)}
                                className={`glass-interactive glass-interactive-flat flex items-center justify-between px-2 py-2.5 rounded-xl ${
                                  highlightedIndex === i ? `glass-interactive-kbd ${t(isDark, 'bg-white/5', 'bg-slate-50')}` : ''
                                }`}
                              >
                                <button
                                  onClick={() => executeSearch(s)}
                                  className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
                                >
                                  {meta ? (
                                    <AgencyBubble isDark={isDark} code={meta.code} size={28} ring={false} />
                                  ) : (
                                    <span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${t(isDark, 'text-slate-500', 'text-slate-400')}`}>
                                      <Icon size={14}><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></Icon>
                                    </span>
                                  )}
                                  <span className="min-w-0 flex-1">
                                    <span className={`block text-sm truncate ${t(isDark, 'text-slate-200', 'text-slate-700')}`}>{s}</span>
                                    {meta && <span className="block text-xs text-slate-500 truncate">{meta.subtitle}</span>}
                                  </span>
                                </button>
                                <button
                                  onClick={() => removeSearch(s)}
                                  className={`ml-2 shrink-0 ${t(isDark, 'text-slate-500 hover:text-slate-200', 'text-slate-400 hover:text-slate-700')}`}
                                >
                                  <Icon size={13}><path d="M18 6L6 18M6 6l12 12" /></Icon>
                                </button>
                              </div>
                            )
                          })}
                          </div>
                        </div>
                      )}

                      {matchingDocSuggestions.length > 0 && (
                        <div className={matchingRecent.length > 0 ? t(isDark, 'border-t border-white/10 mt-1 pt-1', 'border-t border-slate-200 mt-1 pt-1') : ''}>
                          <p className="text-xs text-slate-500 px-2 pb-1">{translate('search_docs_heading')}</p>
                          {matchingDocSuggestions.map((item, i) => (
                            <button
                              key={item.key}
                              onMouseEnter={() => setHighlightedIndex(matchingRecent.length + i)}
                              onClick={item.onSelect}
                              className={`glass-interactive glass-interactive-flat w-full flex items-center gap-2.5 px-2 py-2.5 rounded-xl text-left ${
                                item.tracked ? '' : 'opacity-60'
                              } ${
                                highlightedIndex === matchingRecent.length + i ? `glass-interactive-kbd ${t(isDark, 'bg-white/5', 'bg-slate-50')}` : ''
                              }`}
                            >
                              <AgencyBubble isDark={isDark} code={item.code} size={28} ring={false} />
                              <span className="min-w-0 flex-1">
                                <span className={`block text-sm truncate ${t(isDark, 'text-slate-200', 'text-slate-700')}`}>{item.title}</span>
                                <span className="block text-xs text-slate-500 truncate">{item.subtitle}</span>
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              title={translate(isDark ? 'theme_toggle_to_light' : 'theme_toggle_to_dark')}
              onClick={() => setThemeMode(isDark ? 'light' : 'dark')}
              className={`glass-interactive w-9 h-9 rounded-full flex items-center justify-center ${t(isDark,
                'text-slate-400 hover:text-slate-100 hover:bg-white/5',
                'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              )}`}
            >
              {isDark ? (
                <Icon size={16}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></Icon>
              ) : (
                <Icon size={16}><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></Icon>
              )}
            </button>
            <Dropdown open={showNotifDropdown} onClose={() => setShowNotifDropdown(false)} backdropZ="z-40" contentZ="z-50">
              <button
                title={translate('nav_reminders')}
                onClick={() => {
                  const opening = !showNotifDropdown
                  setShowNotifDropdown(opening)
                  // Opening clears the badge (you've "seen" the current set)
                  // without marking every row read — the New/Earlier split
                  // and each row's dot are a separate, more deliberate
                  // "read" state (see markNotifRead/markAllNotifsRead).
                  if (opening && notifDocs.length > 0) {
                    setSeenNotifIds((prev) => {
                      const next = new Set(prev)
                      notifDocs.forEach((doc) => next.add(doc.id))
                      return next
                    })
                  }
                }}
                className={`glass-interactive relative w-9 h-9 rounded-full flex items-center justify-center ${t(isDark,
                  'text-slate-400 hover:text-slate-100 hover:bg-white/5',
                  'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                )}`}
              >
                <img
                  src={notificationIcon}
                  alt=""
                  className="w-[16px] h-[16px] object-contain"
                  style={{ filter: isDark ? 'invert(1) brightness(1.3)' : 'brightness(0) opacity(0.6)' }}
                />
                {notifUnreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[10px] font-semibold text-white bg-red-500">
                    {notifUnreadCount > 9 ? '9+' : notifUnreadCount}
                  </span>
                )}
              </button>
              {notifShouldRender && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{ animation: showNotifDropdown ? 'dropdown-in 140ms ease-out' : 'dropdown-out 140ms ease-in forwards' }}
                  className={t(isDark,
                    'absolute right-0 mt-2 w-80 glass-dark rounded-xl p-3 origin-top-right',
                    'absolute right-0 mt-2 w-80 glass-light rounded-xl p-3 origin-top-right'
                  )}
                >
                  <div className="flex items-center justify-between mb-2 px-1">
                    <p className={`text-sm font-semibold ${t(isDark, 'text-slate-100', 'text-slate-900')}`}>
                      {translate('nav_reminders')}
                    </p>
                    <ThreeDotMenu
                      isDark={isDark}
                      id="notif-menu"
                      openId={openMenuId}
                      setOpenId={setOpenMenuId}
                      options={[
                        {
                          label: translate('notif_mark_all_read'),
                          icon: <Icon size={14}><path d="M20 6L9 17l-5-5" /></Icon>,
                          onClick: markAllNotifsRead,
                        },
                        {
                          label: translate('notif_settings_option'),
                          icon: <Icon size={14}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></Icon>,
                          onClick: () => { setShowSettings(true); setSettingsTab('notifications'); setShowNotifDropdown(false) },
                        },
                        {
                          label: translate('notif_open_option'),
                          icon: <Icon size={14}><rect x="3" y="4" width="18" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></Icon>,
                          onClick: () => { selectNav('reminders'); setShowNotifDropdown(false) },
                        },
                      ]}
                    />
                  </div>

                  <div className="relative flex items-center gap-1 mb-2">
                    {notifTabIndicator && (
                      <div
                        className={t(isDark, 'absolute top-0 bottom-0 rounded-full glass-chip-dark', 'absolute top-0 bottom-0 rounded-full glass-chip-light')}
                        style={{ left: notifTabIndicator.left, width: notifTabIndicator.width, transition: 'left 250ms cubic-bezier(0.4, 0, 0.2, 1), width 250ms cubic-bezier(0.4, 0, 0.2, 1)' }}
                      />
                    )}
                    {['all', 'unread'].map((tabId) => (
                      <button
                        key={tabId}
                        ref={(el) => {
                          notifTabRefs.current[tabId] = el
                          if (el && tabId === notifFilterTab) {
                            const left = el.offsetLeft
                            const width = el.offsetWidth
                            setNotifTabIndicator((prev) =>
                              prev && prev.left === left && prev.width === width ? prev : { left, width }
                            )
                          }
                        }}
                        onClick={() => setNotifFilterTab(tabId)}
                        className={`glass-interactive glass-interactive-tab relative z-10 px-3 py-1 rounded-full text-xs font-medium ${
                          notifFilterTab === tabId
                            ? t(isDark, 'text-slate-100', 'text-slate-900')
                            : t(isDark, 'text-slate-400 hover:text-slate-200', 'text-slate-500 hover:text-slate-700')
                        }`}
                      >
                        {translate(tabId === 'all' ? 'notif_filter_all' : 'notif_filter_unread')}
                      </button>
                    ))}
                  </div>

                  {notifLoading ? (
                    <div className="flex flex-col gap-1">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="flex items-center gap-2.5 px-1 py-2.5">
                          <span className={`w-7 h-7 rounded-full shrink-0 animate-pulse ${t(isDark, 'bg-white/10', 'bg-slate-200')}`} />
                          <span className="min-w-0 flex-1 flex flex-col gap-1.5">
                            <span className={`block h-3 rounded-full animate-pulse ${t(isDark, 'bg-white/10', 'bg-slate-200')}`} style={{ width: `${70 - i * 10}%` }} />
                            <span className={`block h-2.5 rounded-full animate-pulse ${t(isDark, 'bg-white/5', 'bg-slate-100')}`} style={{ width: `${30 - i * 4}%` }} />
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : notifVisibleDocs.length === 0 ? (
                    <p className="text-sm text-slate-400 px-1 py-2">{translate('notif_dropdown_empty')}</p>
                  ) : (
                    <>
                      {/* ~5 rows tall before scrolling — overflow-x-hidden
                          alongside overflow-y-auto matters here: a lone
                          overflow-y without it computes overflow-x to auto
                          per spec, which can put a stray horizontal scrollbar
                          under a row that's fractionally wider than the panel. */}
                      <div className="max-h-[280px] overflow-y-auto overflow-x-hidden flex flex-col gap-1">
                        {notifNewDocs.length > 0 && (
                          <>
                            <p className="text-[11px] font-semibold text-slate-500 px-2 pt-1 pb-0.5">{translate('notif_group_new')}</p>
                            {notifNewDocs.map((doc) => renderNotifRow(doc, true))}
                          </>
                        )}
                        {notifEarlierDocs.length > 0 && (
                          <>
                            <p className="text-[11px] font-semibold text-slate-500 px-2 pt-1 pb-0.5">{translate('notif_group_earlier')}</p>
                            {notifEarlierDocs.map((doc) => renderNotifRow(doc, false))}
                          </>
                        )}
                      </div>
                      <button
                        onClick={() => { selectNav('reminders'); setShowNotifDropdown(false) }}
                        className={`w-full text-center text-xs font-medium px-2 py-2 mt-1 rounded-xl transition-colors duration-75 ${t(isDark, 'text-slate-300 hover:bg-white/5', 'text-slate-600 hover:bg-slate-50')}`}
                      >
                        {translate('notif_view_all')}
                      </button>
                    </>
                  )}
                </div>
              )}
            </Dropdown>

            <Dropdown open={showUserDropdown} onClose={() => setShowUserDropdown(false)} backdropZ="z-40" contentZ="z-50">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className={`glass-interactive flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-full ${t(isDark, 'hover:bg-white/5', 'hover:bg-slate-50')}`}
              >
                {profilePhoto ? (
                  <img src={profilePhoto} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                ) : (
                  <div
                    style={{ backgroundColor: AVATAR_COLORS[profileColor] || AVATAR_COLORS[0] }}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white shrink-0"
                  >
                    {(profileUsername || session.user.email || 'G')[0].toUpperCase()}
                  </div>
                )}
                <div className="hidden sm:flex flex-col items-start leading-tight max-w-[140px]">
                  <span className={t(isDark, 'text-sm font-semibold text-slate-100 truncate w-full text-left', 'text-sm font-semibold text-slate-900 truncate w-full text-left')}>
                    {profileUsername || getDisplayName(session.user.email)}
                  </span>
                  <span className="text-xs text-slate-400 truncate w-full text-left">
                    {session.user.email || translate('guest_account_label')}
                  </span>
                </div>
                <Icon size={14}><path d="M6 9l6 6 6-6" /></Icon>
              </button>
              {userDropdownShouldRender && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{ animation: showUserDropdown ? 'dropdown-in 140ms ease-out' : 'dropdown-out 140ms ease-in forwards' }}
                  className={t(isDark,
                    'absolute right-0 mt-2 w-48 glass-dark rounded-xl p-1.5 origin-top-right',
                    'absolute right-0 mt-2 w-48 glass-light rounded-xl p-1.5 origin-top-right'
                  )}
                >
                  <button
                    onClick={() => { setShowSettings(true); setSettingsTab('account'); setShowUserDropdown(false) }}
                    className={`glass-interactive glass-interactive-flat w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-lg text-sm ${t(isDark, 'text-slate-300 hover:bg-white/5', 'text-slate-600 hover:bg-slate-50')}`}
                  >
                    <img src={accountIcon} alt="" className="w-[15px] h-[15px] object-contain" style={{ filter: isDark ? 'invert(1) brightness(1.3)' : 'brightness(0) opacity(0.6)' }} />
                    {translate('settings_tab_account')}
                  </button>
                  <button
                    onClick={() => { setShowSettings(true); setSettingsTab('general'); setShowUserDropdown(false) }}
                    className={`glass-interactive glass-interactive-flat w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-lg text-sm ${t(isDark, 'text-slate-300 hover:bg-white/5', 'text-slate-600 hover:bg-slate-50')}`}
                  >
                    <Icon size={15}>
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                    </Icon>
                    {translate('nav_settings')}
                  </button>
                  <div className={t(isDark, 'border-t border-white/10 -mx-1.5 my-1', 'border-t border-slate-200 -mx-1.5 my-1')} />
                  <button
                    onClick={() => { setConfirmLogout(true); setShowUserDropdown(false) }}
                    className={`glass-interactive glass-interactive-flat w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-lg text-sm ${t(isDark, 'text-red-300 hover:bg-white/5', 'text-red-500 hover:bg-slate-50')}`}
                  >
                    <img src={logoutIcon} alt="" className="w-[15px] h-[15px] object-contain" style={{ filter: isDark ? 'invert(1) brightness(1.3)' : 'brightness(0) opacity(0.6)' }} />
                    {translate('nav_logout')}
                  </button>
                </div>
              )}
            </Dropdown>
          </div>
        </div>

        {/* Scrollable content area */}
        <div
          id="dashboard-scroll-container"
          className="flex-1 overflow-y-auto no-scrollbar rounded-2xl px-6 md:px-10 py-8"
        >
          {showSettings ? (
            <div key={settingsTab} style={{ animation: 'flashcard-in-forward 220ms ease-out' }}>
              {settingsTab === 'general' && (
                <GeneralSettingsPanel
                  isDark={isDark}
                  session={session}
                  profilePhoto={profilePhoto}
                  profileUsername={profileUsername}
                  profileColor={profileColor}
                  onGoToAccount={() => setSettingsTab('account')}
                  onLogout={() => setConfirmLogout(true)}
                />
              )}
              {settingsTab === 'account' && (
                <ProfilePage
                  isDark={isDark}
                  session={session}
                  photoUrl={profilePhoto}
                  onPhotoChange={setProfilePhoto}
                  username={profileUsername}
                  onUsernameChange={setProfileUsername}
                  color={profileColor}
                  onActivity={(text) => logAction(text, 'security')}
                />
              )}
              {settingsTab === 'theme' && (
                <ThemePanel
                  isDark={isDark}
                  themeMode={themeMode}
                  onSetMode={setThemeMode}
                  accentColor={profileColor}
                  onSetAccentColor={setProfileColor}
                />
              )}
              {settingsTab === 'notifications' && (
                <NotificationsPanel
                  isDark={isDark}
                  emailAlerts={notifPrefs.emailAlerts}
                  onEmailAlerts={(v) => updateNotifPref({ emailAlerts: v })}
                  pushAlerts={notifPrefs.pushAlerts}
                  onPushAlerts={handlePushToggle}
                  pushBusy={pushToggleBusy}
                  pushSupported={isPushSupported()}
                  weeklyDigest={notifPrefs.weeklyDigest}
                  onWeeklyDigest={(v) => updateNotifPref({ weeklyDigest: v })}
                />
              )}
              {settingsTab === 'linked_documents' && (
                <LinkedDocumentsPanel
                  isDark={isDark}
                  documents={documents}
                  onAddType={(docType) => { setShowSettings(false); openAddDocument(docType) }}
                />
              )}
              {settingsTab === 'language' && <LanguagePanel isDark={isDark} lang={lang} onSetLang={setLang} />}
              {settingsTab === 'calendar' && <CalendarPanel isDark={isDark} documents={enriched} />}
              {settingsTab === 'household' && (
                <HouseholdPanel
                  isDark={isDark}
                  userId={session.user.id}
                  members={householdMembers}
                  onRefresh={fetchHouseholdMembers}
                />
              )}
              {settingsTab === 'data' && <DataPrivacyPanel isDark={isDark} documents={enriched} />}
            </div>
          ) : activeNav === 'requirements' ? (
            <div key={activeNav} style={{ animation: 'rise-in 0.5s cubic-bezier(0.16,1,0.3,1) both' }}>
              <LinkedDocumentsPanel isDark={isDark} documents={documents} onAddType={(docType) => openAddDocument(docType)} />
            </div>
          ) : activeNav === 'appointments' ? (
            <div key={activeNav} style={{ animation: 'rise-in 0.5s cubic-bezier(0.16,1,0.3,1) both' }}>
              <CalendarPanel isDark={isDark} documents={enriched} />
            </div>
          ) : activeNav === 'dashboard' ? (
            <div key={activeNav} style={{ animation: 'rise-in 0.5s cubic-bezier(0.16,1,0.3,1) both' }}>
              <div className="flex flex-col lg:flex-row gap-10">
                <div className="flex-1 min-w-0">
                  <DashboardHero
                    isDark={isDark}
                    displayName={profileUsername || getDisplayName(session.user.email)}
                  />
                  <ExpirationChart isDark={isDark} documents={enriched} />
                  <CostRollupCard isDark={isDark} documents={enriched} />
                </div>
                {/* News gets the whole right column now (was sharing it
                    with the urgent-docs rail) so each headline has room for
                    its photo — the rail moved below, full width. */}
                <div className="lg:w-[340px] shrink-0">
                  <NewsPanel isDark={isDark} />
                </div>
              </div>
              {/* Full page width here, not squeezed into either column above. */}
              {progressDocs.length > 0 ? (
                <div className="mt-10">
                  <p className={`text-xs font-semibold tracking-widest uppercase mb-4 ${t(isDark, 'text-slate-400', 'text-slate-500')}`}>
                    {translate('dashboard_progress_heading')}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {progressDocs.map((doc, i) => (
                      <DocumentProgressCard
                        key={doc.id}
                        isDark={isDark}
                        doc={doc}
                        onSelect={() => setSelectedDoc(doc)}
                        delay={Math.min(i * 0.05, 0.4)}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                // Otherwise this whole area below the chart just sits empty,
                // which for a brand new account with nothing tracked yet
                // reads as "nothing here" rather than pointing at the one
                // thing they should do next. Same card weight as the stat
                // cards above it (rounded-2xl, p-5/p-6, glass material)
                // instead of AddDocumentTile's compact dashed pill, so it
                // doesn't read as an afterthought next to them.
                <button
                  type="button"
                  onClick={() => openAddDocument()}
                  className={`glass-interactive glass-interactive-no-sweep w-full flex items-center gap-3 mt-6 rounded-2xl p-5 md:p-6 border-2 border-dashed text-left ${t(isDark,
                    'glass-dark border-white/15 hover:border-white/30 text-slate-400 hover:text-slate-200',
                    'glass-light border-slate-300 hover:border-slate-400 text-slate-500 hover:text-slate-700'
                  )}`}
                  style={{ animation: 'rise-in 0.8s cubic-bezier(0.16,1,0.3,1) 0.85s both' }}
                >
                  <Icon size={22}><path d="M12 5v14M5 12h14" /></Icon>
                  <span className="text-sm font-medium">{translate('add_orbit')}</span>
                </button>
              )}
            </div>
          ) : activeNav === 'reminders' ? (
            <div key={activeNav} style={{ animation: 'rise-in 0.5s cubic-bezier(0.16,1,0.3,1) both' }}>
              <NotificationsFeed isDark={isDark} documents={enriched} onSelectDoc={setSelectedDoc} />
            </div>
          ) : activeNav === 'history' ? (
            <div key={activeNav} style={{ animation: 'rise-in 0.5s cubic-bezier(0.16,1,0.3,1) both' }}>
              <HistoryFeed isDark={isDark} activityLog={activityLog} />
            </div>
          ) : activeNav === 'search_results' ? (
            <div key={activeNav} style={{ animation: 'rise-in 0.5s cubic-bezier(0.16,1,0.3,1) both' }}>
              <p className={`font-instrument text-3xl mb-6 ${t(isDark, 'text-slate-100', 'text-slate-900')}`}>
                {translate('search_results_heading', { query: searchQuery })}
              </p>
              {renderFilterBarAndGrid()}
            </div>
          ) : (
          <div key={activeNav}>
          {/* Filter tabs + document grid — wrapped so selection mode can detect clicks outside it */}
          <div ref={docsSectionRef}>
          {activeNav === 'my_documents' ? (
            <>
              <p
                className={`font-instrument text-3xl mb-6 ${t(isDark, 'text-slate-100', 'text-slate-900')}`}
                style={{ animation: 'rise-in 0.5s cubic-bezier(0.16,1,0.3,1) both' }}
              >
                {translate('nav_my_orbits')}
              </p>
              <div className="flex flex-col gap-3">
                <AddDocumentTile
                  isDark={isDark}
                  onClick={() => openAddDocument()}
                  tileRef={addTileRef}
                  label={translate('add_orbit')}
                  fullWidth
                />
                {orbitGroups.map((orbit, i) => {
                  const isOpen = selectedOrbit === orbit.docType
                  return (
                    <OrbitAccordionItem
                      key={orbit.docType}
                      isDark={isDark}
                      orbit={{ ...orbit, countText: translate(orbit.count === 1 ? 'orbit_count_one' : 'orbit_count_other', { count: orbit.count }) }}
                      isOpen={isOpen}
                      delay={Math.min(0.05 + i * 0.05, 0.4)}
                      onToggle={() => {
                        if (isOpen) {
                          setSelectedOrbit(null)
                        } else {
                          setSelectedOrbit(orbit.docType)
                          setActiveFilter('all')
                        }
                      }}
                      renderContent={renderFilterBarAndGrid}
                    />
                  )
                })}
              </div>
            </>
          ) : (
            renderFilterBarAndGrid()
          )}
          </div>
          </div>
          )}
        </div>
      </div>

      {addModalShouldRender && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
          style={{ animation: addingDocument ? 'backdrop-in 150ms ease-out' : 'backdrop-out 180ms ease-in forwards' }}
          onClick={() => setAddingDocument(false)}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div
            className="w-full max-w-sm"
            style={{
              animation: addingDocument ? 'modal-in 180ms ease-out' : 'modal-out 180ms ease-in forwards',
              // Morphing the modal out of whatever tile was clicked reads well
              // for the small "+ Add Document" tile inside a document grid,
              // but the "Add Orbit" tile spans the full content width — using
              // that measured width verbatim stretched the picker into a
              // wide, oddly-proportioned box instead of the compact card it's
              // designed as, so it's capped at the same width as max-w-sm.
              ...(addCardWidth ? { maxWidth: `${Math.min(addCardWidth, 384)}px` } : {}),
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <AddDocumentCard
              isDark={isDark}
              userId={session.user.id}
              existingDocs={documents}
              householdMembers={householdMembers}
              initialType={pendingDocType}
              initialAgency={pendingAgency}
              onAdded={(title) => { fetchDocuments(); setAddingDocument(false); logAction(`Added ${title}`, 'add') }}
              onCancel={() => setAddingDocument(false)}
              profilePhoto={profilePhoto}
              profileColor={profileColor}
            />
          </div>
        </div>
      )}

      {confirmDeleteShouldRender && confirmDeleteSnapshot && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
          style={{ animation: confirmDelete ? 'backdrop-in 150ms ease-out' : 'backdrop-out 180ms ease-in forwards' }}
          onClick={() => { if (!deleting) setConfirmDelete(null) }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div
            className={t(isDark,
              'glass-dark rounded-2xl max-w-sm w-full p-6',
              'glass-light rounded-2xl max-w-sm w-full p-6'
            )}
            style={{ animation: confirmDelete ? 'modal-in 180ms ease-out' : 'modal-out 180ms ease-in forwards' }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {(() => {
              const targetDoc = confirmDeleteSnapshot.type === 'single'
                ? enriched.find((d) => d.id === confirmDeleteSnapshot.id)
                : null
              const targetPlaybook = targetDoc ? getPlaybook(targetDoc.doc_type, targetDoc.intent) : null
              const targetCompleted = targetDoc ? (targetDoc.completed_steps || []).length : 0
              const targetTotal = targetPlaybook ? targetPlaybook.steps.length : 0
              const docLabel = targetDoc ? (targetDoc.title || DOC_TYPE_LABELS[targetDoc.doc_type]) : ''
              return (
                <>
                  <h3 className={t(isDark, 'text-slate-100 font-semibold mb-2', 'text-slate-900 font-semibold mb-2')}>
                    {confirmDeleteSnapshot.type === 'bulk'
                      ? translate('confirm_delete_title_bulk', { count: confirmDeleteSnapshot.count })
                      : translate('confirm_delete_title_single_named', { title: docLabel })}
                  </h3>
                  <p className={t(isDark, 'text-sm text-slate-400 mb-4', 'text-sm text-slate-500 mb-4')}>
                    {confirmDeleteSnapshot.type === 'bulk'
                      ? translate('confirm_delete_body')
                      : targetCompleted > 0
                        ? translate('confirm_delete_body_progress', { completed: targetCompleted, total: targetTotal, title: docLabel })
                        : translate('confirm_delete_body_named', { title: docLabel })}
                  </p>
                </>
              )
            })()}
            {deleteError && (
              <p className={t(isDark,
                'text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-4',
                'text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4'
              )}>
                {deleteError}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
                className={t(isDark,
                  'text-sm text-slate-400 hover:text-slate-100 px-4 py-2 disabled:opacity-50',
                  'text-sm text-slate-500 hover:text-slate-900 px-4 py-2 disabled:opacity-50'
                )}
              >
                {translate('confirm_cancel')}
              </button>
              <button
                onClick={confirmAndDelete}
                disabled={deleting}
                className="glass-danger glass-interactive text-sm text-white font-semibold px-4 py-2 rounded-lg disabled:opacity-60"
              >
                {deleting ? translate('confirm_deleting') : translate('confirm_delete_btn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmLogoutShouldRender && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
          style={{ animation: confirmLogout ? 'backdrop-in 150ms ease-out' : 'backdrop-out 180ms ease-in forwards' }}
          onClick={() => setConfirmLogout(false)}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div
            className={t(isDark,
              'glass-dark rounded-2xl max-w-sm w-full p-6',
              'glass-light rounded-2xl max-w-sm w-full p-6'
            )}
            style={{ animation: confirmLogout ? 'modal-in 180ms ease-out' : 'modal-out 180ms ease-in forwards' }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h3 className={t(isDark, 'text-slate-100 font-semibold mb-2', 'text-slate-900 font-semibold mb-2')}>
              {isGuest && documents.length > 0 ? translate('guest_logout_title') : translate('confirm_logout_title')}
            </h3>
            <p className={t(isDark, 'text-sm text-slate-400 mb-4', 'text-sm text-slate-500 mb-4')}>
              {isGuest && documents.length > 0 ? translate('guest_logout_desc') : translate('confirm_logout_body')}
            </p>
            <div className="flex justify-end gap-3">
              {isGuest && documents.length > 0 ? (
                <button
                  onClick={() => { setConfirmLogout(false); onUpgradeAccount?.() }}
                  className="glass-accent glass-interactive text-sm text-white font-semibold px-4 py-2 rounded-lg"
                >
                  {translate('guest_logout_cancel')}
                </button>
              ) : (
                <button
                  onClick={() => setConfirmLogout(false)}
                  className={t(isDark,
                    'text-sm text-slate-400 hover:text-slate-100 px-4 py-2',
                    'text-sm text-slate-500 hover:text-slate-900 px-4 py-2'
                  )}
                >
                  {translate('confirm_cancel')}
                </button>
              )}
              <button
                onClick={() => supabase.auth.signOut()}
                className="glass-danger glass-interactive text-sm text-white font-semibold px-4 py-2 rounded-lg"
              >
                {isGuest && documents.length > 0 ? translate('guest_logout_confirm') : translate('confirm_logout_btn')}
              </button>
            </div>
          </div>
        </div>
      )}

      <PlaybookModal
        isDark={isDark}
        playbook={selectedDoc ? getPlaybook(selectedDoc.doc_type, selectedDoc.intent) : null}
        docType={selectedDoc?.doc_type}
        userId={session.user.id}
        doc={selectedDoc}
        householdMember={selectedDoc?.household_member_id ? householdMembers.find((m) => m.id === selectedDoc.household_member_id) : null}
        onStepsUpdated={handleStepsUpdated}
        onClose={() => setSelectedDoc(null)}
        onActivity={logAction}
      />
      </div>
    </div>
  )
}