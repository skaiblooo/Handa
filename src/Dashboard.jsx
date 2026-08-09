import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'
import { getPlaybook } from './data/playbooks'
import PlaybookModal from './PlaybookModal'
import ProfilePage from './ProfilePage'
import { getDaysUntilExpiry, getUrgencyLevel, formatDaysUntil } from './utils/dateHelpers'
import { getActivityLog, logActivity } from './utils/activityLog'
import { useLanguage } from './i18n'
import { AVATAR_COLORS, AVATAR_ACCENT_HEX } from './avatarColors'
import { DOC_TYPE_LABELS, AGENCY_BADGE, URGENCY_META } from './data/docTypes'
import ltoLogo from './assets/LTO LOGO.webp'
import psaLogo from './assets/PSA LOGO.webp'
import orbitLogo from './assets/orbit logo.png'

// Full department names for the orbit-grouping view — AGENCY_BADGE only has
// short codes (LTO, PSA, ...), which read as cryptic on their own outside a
// small badge context.
const DEPARTMENT_NAMES = {
  LTO: 'Land Transportation Office',
  DFA: 'Department of Foreign Affairs',
  NBI: 'National Bureau of Investigation',
  PSA: 'Philippine Statistics Authority',
  SSS: 'Social Security System',
  PH: 'PhilHealth',
  HDMF: 'Pag-IBIG Fund',
  BIR: 'Bureau of Internal Revenue',
}

// Real logos only exist for a couple departments so far — this is a first
// look at the direction, not a complete set. Everything else still falls
// back to the generic orbit icon.
const DEPARTMENT_LOGOS = {
  LTO: ltoLogo,
  PSA: psaLogo,
}

export { DOC_TYPE_LABELS, AGENCY_BADGE }

// Stylized, simplified mock-ID visuals — not exact reproductions of real PH
// government IDs (no seals/logos/flags copied), just enough per-type
// branding to feel like the real thing.
export const CARD_THEME = {
  drivers_license: { gradient: 'from-blue-700 to-blue-950', agency: 'REPUBLIC OF THE PHILIPPINES', office: 'LAND TRANSPORTATION OFFICE', docName: "DRIVER'S LICENSE" },
  passport: { gradient: 'from-red-900 to-stone-950', agency: 'REPUBLIC OF THE PHILIPPINES', office: 'DEPARTMENT OF FOREIGN AFFAIRS', docName: 'PASSPORT' },
  nbi_clearance: { gradient: 'from-purple-700 to-purple-950', agency: 'REPUBLIC OF THE PHILIPPINES', office: 'NATIONAL BUREAU OF INVESTIGATION', docName: 'NBI CLEARANCE' },
  national_id: { gradient: 'from-orange-600 to-orange-900', agency: 'REPUBLIC OF THE PHILIPPINES', office: 'PHILIPPINE IDENTIFICATION SYSTEM', docName: 'NATIONAL ID' },
  psa_birth_certificate: { gradient: 'from-amber-600 to-orange-900', agency: 'REPUBLIC OF THE PHILIPPINES', office: 'PHILIPPINE STATISTICS AUTHORITY', docName: 'BIRTH CERTIFICATE' },
  sss: { gradient: 'from-emerald-700 to-emerald-950', agency: 'REPUBLIC OF THE PHILIPPINES', office: 'SOCIAL SECURITY SYSTEM', docName: 'SSS ID' },
  philhealth: { gradient: 'from-red-700 to-red-950', agency: 'REPUBLIC OF THE PHILIPPINES', office: 'PHILHEALTH', docName: 'PHILHEALTH ID' },
  pagibig: { gradient: 'from-yellow-600 to-yellow-900', agency: 'REPUBLIC OF THE PHILIPPINES', office: 'PAG-IBIG FUND', docName: 'PAG-IBIG MID CARD' },
  tin_bir: { gradient: 'from-slate-700 to-slate-950', agency: 'REPUBLIC OF THE PHILIPPINES', office: 'BUREAU OF INTERNAL REVENUE', docName: 'TIN ID' },
}

export const CARD_FIELD_SCHEMAS = {
  drivers_license: [
    { key: 'fullName', label: 'Last Name, First Name, Middle Name', span: 2 },
    { key: 'sex', label: 'Sex' },
    { key: 'dob', label: 'Date of Birth' },
    { key: 'address', label: 'Address', span: 2 },
    { key: 'licenseNo', label: 'License No.' },
    { key: 'bloodType', label: 'Blood Type' },
  ],
  passport: [
    { key: 'fullName', label: 'Surname, Given Names', span: 2 },
    { key: 'nationality', label: 'Nationality', default: 'FILIPINO' },
    { key: 'sex', label: 'Sex' },
    { key: 'dob', label: 'Date of Birth' },
    { key: 'passportNo', label: 'Passport No.' },
  ],
  nbi_clearance: [
    { key: 'fullName', label: 'Full Name', span: 2 },
    { key: 'dob', label: 'Date of Birth' },
    { key: 'address', label: 'Address', span: 2 },
    { key: 'nbiNo', label: 'NBI No.' },
  ],
  national_id: [
    { key: 'fullName', label: 'Full Name', span: 2 },
    { key: 'sex', label: 'Sex' },
    { key: 'dob', label: 'Date of Birth' },
    { key: 'address', label: 'Address', span: 2 },
    { key: 'pcn', label: 'PhilSys Card Number' },
  ],
  psa_birth_certificate: [
    { key: 'fullName', label: 'Full Name', span: 2 },
    { key: 'dob', label: 'Date of Birth' },
    { key: 'placeOfBirth', label: 'Place of Birth' },
    { key: 'motherName', label: "Mother's Maiden Name", span: 2 },
    { key: 'registryNo', label: 'Registry No.' },
  ],
  sss: [
    { key: 'fullName', label: 'Full Name', span: 2 },
    { key: 'sssNo', label: 'SSS No.' },
    { key: 'dob', label: 'Date of Birth' },
  ],
  philhealth: [
    { key: 'fullName', label: 'Full Name', span: 2 },
    { key: 'philhealthNo', label: 'PhilHealth No.' },
    { key: 'dob', label: 'Date of Birth' },
  ],
  pagibig: [
    { key: 'fullName', label: 'Full Name', span: 2 },
    { key: 'midNo', label: 'Pag-IBIG MID No.' },
    { key: 'dob', label: 'Date of Birth' },
  ],
  tin_bir: [
    { key: 'fullName', label: 'Full Name', span: 2 },
    { key: 'tin', label: 'TIN' },
    { key: 'address', label: 'Address', span: 2 },
  ],
}

// Only document types with a well-established, fixed official validity
// period get a smart-default expiry date — inventing a number for types
// without one (e.g. National ID, SSS) would just be a guess dressed up as fact.
const TYPICAL_VALIDITY_YEARS = {
  drivers_license: 10,
  passport: 10,
  nbi_clearance: 1,
}

export function BlankAvatar({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="9" r="4" opacity="0.9" />
      <path d="M4 20.5a8 8 0 0116 0" opacity="0.9" />
    </svg>
  )
}

function IDCardFace({ children, minHeight = 208, faceStyle }) {
  return (
    <div
      className="glass-dark rounded-2xl overflow-hidden text-white flex flex-col"
      style={{ minHeight, ...faceStyle }}
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
        <div className={`w-8 h-8 rounded-full ${agency.color} flex items-center justify-center shrink-0 ring-2 ring-white/25`}>
          <span className="text-white text-[8px] font-bold">{agency.label}</span>
        </div>
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
        className="absolute bottom-2.5 right-2.5 z-10 w-6 h-6 rounded-full bg-black/25 hover:bg-black/40 text-white flex items-center justify-center transition-colors"
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
  return (
    <div className={`w-11 h-11 rounded-xl ${agency.color} flex items-center justify-center shrink-0`}>
      <span className="text-white text-[10px] font-bold tracking-tight leading-none text-center px-1">
        {agency.label}
      </span>
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
  { id: 'dashboard', labelKey: 'nav_dashboard', icon: <path d="M3 3h7v9H3V3zm11 0h7v5h-7V3zm0 9h7v9h-7v-9zM3 16h7v5H3v-5z" /> },
  {
    id: 'my_documents',
    labelKey: 'nav_my_documents',
    icon: (
      <>
        <circle cx="10" cy="12" r="5" />
        <ellipse cx="10" cy="12" rx="8.5" ry="2.4" transform="rotate(-20 10 12)" />
        <path d="M18.5 5.5l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6z" strokeLinejoin="round" />
        <path d="M19.2 16.8l.4 1.1 1.1.4-1.1.4-.4 1.1-.4-1.1-1.1-.4 1.1-.4z" strokeLinejoin="round" />
        <circle cx="3.5" cy="6" r="0.7" fill="currentColor" stroke="none" />
        <circle cx="21" cy="10.5" r="0.7" fill="currentColor" stroke="none" />
      </>
    ),
  },
  { id: 'reminders', labelKey: 'nav_reminders', icon: <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" /> },
  { id: 'requirements', labelKey: 'nav_requirements', icon: <path d="M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 006.5 22H20V2H6.5A2.5 2.5 0 004 4.5v15z" /> },
  { id: 'appointments', labelKey: 'nav_appointments', icon: <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" /> },
  { id: 'history', labelKey: 'nav_history', icon: <path d="M12 8v4l3 3M12 21a9 9 0 100-18 9 9 0 000 18z" /> },
]

const PROFILE_ICON = <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></>

const SETTINGS_NAV = [
  {
    sectionKey: 'settings_section_general',
    items: [
      { id: 'account', labelKey: 'settings_tab_account', icon: PROFILE_ICON },
    ],
  },
  {
    sectionKey: 'settings_section_system',
    items: [
      {
        id: 'theme',
        labelKey: 'settings_tab_theme',
        icon: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></>,
      },
      {
        id: 'reminders',
        labelKey: 'settings_tab_reminders',
        icon: <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />,
      },
      {
        id: 'notifications',
        labelKey: 'settings_tab_notifications',
        icon: <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />,
      },
      {
        id: 'linked_documents',
        labelKey: 'settings_tab_linked_documents',
        icon: <><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></>,
      },
      {
        id: 'language',
        labelKey: 'settings_tab_language',
        icon: <><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 010 20 15 15 0 010-20z" /></>,
      },
      {
        id: 'calendar',
        labelKey: 'settings_tab_calendar',
        icon: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
      },
      {
        id: 'data',
        labelKey: 'settings_tab_data_privacy',
        icon: <path d="M12 2L4 6v6c0 5.5 3.8 9 8 10 4.2-1 8-4.5 8-10V6l-8-4z" />,
      },
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
        className={`glass-interactive p-1.5 rounded-full transition-colors ${t(isDark,
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
          className={t(isDark,
            'absolute right-0 mt-2 w-40 glass-dark rounded-xl p-1.5 origin-top-right',
            'absolute right-0 mt-2 w-40 glass-light rounded-xl p-1.5 origin-top-right'
          )}
        >
          {options.map((opt) => (
            <button
              key={opt.label}
              onClick={() => { opt.onClick(); setOpenId(null) }}
              className={t(isDark,
                `w-full text-left px-3 py-1.5 rounded-lg text-sm hover:bg-white/5 ${opt.danger ? 'text-red-300' : 'text-slate-300'}`,
                `w-full text-left px-3 py-1.5 rounded-lg text-sm hover:bg-slate-50 ${opt.danger ? 'text-red-500' : 'text-slate-600'}`
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </Dropdown>
  )
}

const DOC_TYPE_OPTIONS = Object.entries(DOC_TYPE_LABELS).map(([value, label]) => ({ value, label }))

function AddDocumentTile({ isDark, onClick, tileRef, label, fullWidth }) {
  const { translate } = useLanguage()
  return (
    <button
      ref={tileRef}
      type="button"
      onClick={onClick}
      onMouseDown={(e) => e.stopPropagation()}
      className={`flex items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-colors ${
        fullWidth ? 'flex-row py-5' : 'flex-col min-h-[220px]'
      } ${t(isDark,
        'border-white/15 hover:border-white/30 text-slate-500 hover:text-slate-300',
        'border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-400 hover:text-slate-600'
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
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className={t(isDark, 'font-semibold text-slate-100', 'font-semibold text-slate-900')}>{translate('add_doc_choose_intent')}</h3>
          <p className={t(isDark, 'text-xs text-slate-400', 'text-xs text-slate-500')}>{translate('add_doc_choose_intent_desc')}</p>
        </div>
        <button
          type="button"
          title={translate('add_doc_cancel')}
          onClick={onCancel}
          className={t(isDark,
            'p-1.5 rounded-full text-slate-500 hover:text-slate-100 hover:bg-white/10 transition-colors shrink-0',
            'p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0'
          )}
        >
          <Icon size={16}><path d="M18 6L6 18M6 6l12 12" /></Icon>
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => onSelect('application')}
          className={t(isDark,
            'flex flex-col items-center text-center gap-2 p-4 rounded-xl border border-white/10 hover:bg-white/5 hover:border-white/20 transition-colors',
            'flex flex-col items-center text-center gap-2 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors'
          )}
        >
          <span className={t(isDark, 'w-9 h-9 rounded-full bg-blue-500/15 text-blue-300 flex items-center justify-center', 'w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center')}>
            <Icon size={17}><path d="M12 5v14M5 12h14" /></Icon>
          </span>
          <span className={t(isDark, 'text-sm font-medium text-slate-100', 'text-sm font-medium text-slate-900')}>{translate('add_doc_intent_application')}</span>
          <span className={t(isDark, 'text-[11px] text-slate-400 leading-tight', 'text-[11px] text-slate-500 leading-tight')}>{translate('add_doc_intent_application_desc')}</span>
        </button>
        <button
          type="button"
          onClick={() => onSelect('renewal')}
          className={t(isDark,
            'flex flex-col items-center text-center gap-2 p-4 rounded-xl border border-white/10 hover:bg-white/5 hover:border-white/20 transition-colors',
            'flex flex-col items-center text-center gap-2 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors'
          )}
        >
          <span className={t(isDark, 'w-9 h-9 rounded-full bg-emerald-500/15 text-emerald-300 flex items-center justify-center', 'w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center')}>
            <Icon size={17}><path d="M3 12a9 9 0 0115.3-6.4M21 12a9 9 0 01-15.3 6.4" /><path d="M21 3v6h-6M3 21v-6h6" /></Icon>
          </span>
          <span className={t(isDark, 'text-sm font-medium text-slate-100', 'text-sm font-medium text-slate-900')}>{translate('add_doc_intent_renewal')}</span>
          <span className={t(isDark, 'text-[11px] text-slate-400 leading-tight', 'text-[11px] text-slate-500 leading-tight')}>{translate('add_doc_intent_renewal_desc')}</span>
        </button>
      </div>
    </div>
  )
}

function DocTypePicker({ isDark, onSelect, onCancel }) {
  const { translate } = useLanguage()
  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      className={t(isDark,
        'relative text-left rounded-2xl glass-dark p-5',
        'relative text-left rounded-2xl glass-light p-5'
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className={t(isDark, 'font-semibold text-slate-100', 'font-semibold text-slate-900')}>{translate('add_doc_choose_type')}</h3>
          <p className={t(isDark, 'text-xs text-slate-400', 'text-xs text-slate-500')}>{translate('add_doc_choose_type_desc')}</p>
        </div>
        <button
          type="button"
          title={translate('add_doc_cancel')}
          onClick={onCancel}
          className={t(isDark,
            'p-1.5 rounded-full text-slate-500 hover:text-slate-100 hover:bg-white/10 transition-colors shrink-0',
            'p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0'
          )}
        >
          <Icon size={16}><path d="M18 6L6 18M6 6l12 12" /></Icon>
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {DOC_TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            className={t(isDark,
              'flex flex-col items-center gap-1.5 p-3 rounded-xl border border-white/10 hover:bg-white/5 hover:border-white/20 transition-colors',
              'flex flex-col items-center gap-1.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors'
            )}
          >
            <AgencyBadge docType={opt.value} />
            <span className={t(isDark, 'text-[10px] text-center text-slate-300 leading-tight', 'text-[10px] text-center text-slate-600 leading-tight')}>{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// An applicant doesn't have license numbers, passport numbers, or an expiry
// date yet — asking them to fill those in would mean asking them to invent
// data. This just confirms the type and shows the card in an obviously
// unfinished state (dimmed, every field blank) instead.
function ApplicationConfirmCard({ isDark, docType, title, onTitleChange, onBack, onCancel, onSave, saving, errorMsg }) {
  const { translate } = useLanguage()
  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      className={t(isDark,
        'relative text-left rounded-2xl glass-dark p-4',
        'relative text-left rounded-2xl glass-light p-4'
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="flex gap-1 flex-1">
          <div className="h-1 flex-1 rounded-full bg-blue-400" />
          <div className="h-1 flex-1 rounded-full bg-blue-400" />
          <div className="h-1 flex-1 rounded-full bg-blue-400" />
        </div>
        <span className={t(isDark, 'text-[10px] text-slate-500 shrink-0', 'text-[10px] text-slate-400 shrink-0')}>
          {translate('add_doc_step2_momentum')}
        </span>
      </div>
      <div className="flex justify-between items-center mb-3">
        <input
          type="text"
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
            className={`glass-interactive p-1.5 rounded-full transition-colors ${t(isDark,
              'text-slate-500 hover:text-slate-100 hover:bg-white/10',
              'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            )}`}
          >
            <Icon size={16}><path d="M15 18l-6-6 6-6" /></Icon>
          </button>
          <button
            type="button"
            title={translate('add_doc_save')}
            onClick={onSave}
            disabled={saving}
            className={`glass-interactive p-1.5 rounded-full transition-colors disabled:opacity-40 ${t(isDark,
              'text-emerald-400 hover:bg-emerald-400/10',
              'text-emerald-600 hover:bg-emerald-50'
            )}`}
          >
            <Icon size={16}><path d="M20 6L9 17l-5-5" /></Icon>
          </button>
          <button
            type="button"
            title={translate('add_doc_cancel')}
            onClick={onCancel}
            className={`glass-interactive p-1.5 rounded-full transition-colors ${t(isDark,
              'text-slate-500 hover:text-slate-100 hover:bg-white/10',
              'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            )}`}
          >
            <Icon size={16}><path d="M18 6L6 18M6 6l12 12" /></Icon>
          </button>
        </div>
      </div>

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

function AddDocumentCard({ isDark, userId, existingDocs, initialType, onAdded, onCancel }) {
  const { translate } = useLanguage()
  const [step, setStep] = useState('intent')
  const [intent, setIntent] = useState(null)
  const [docType, setDocType] = useState(initialType || 'drivers_license')
  const [title, setTitle] = useState('')
  const [expiryDate, setExpiryDate] = useState(() => (initialType ? computeSmartDefaults(initialType, existingDocs).expiryDate : ''))
  const [fields, setFields] = useState(() => (initialType ? computeSmartDefaults(initialType, existingDocs).fields : {}))
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const isApplication = intent === 'application'

  // Most of these document types are one-per-person in real life — flag it,
  // but don't block: someone tracking a renewal-in-progress legitimately
  // has an old and a new one active at the same time.
  const duplicateDocs = (existingDocs || []).filter((d) => d.doc_type === docType)

  function selectIntent(chosenIntent) {
    setIntent(chosenIntent)
    if (!initialType) {
      setStep('type')
      return
    }
    if (chosenIntent === 'application') {
      setStep('confirm')
      return
    }
    const defaults = computeSmartDefaults(initialType, existingDocs)
    setExpiryDate((prev) => prev || defaults.expiryDate)
    setFields((prev) => ({ ...defaults.fields, ...prev }))
    setStep('fill')
  }

  function selectType(type) {
    setDocType(type)
    if (isApplication) {
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

  async function handleSave() {
    if (!isApplication && !expiryDate) {
      setErrorMsg('Please set an expiry date.')
      return
    }
    setSaving(true)
    setErrorMsg('')

    const { error } = await supabase.from('documents').insert({
      user_id: userId,
      title: title.trim() || DOC_TYPE_LABELS[docType],
      doc_type: docType,
      expiry_date: isApplication ? placeholderExpiryForApplication(docType) : expiryDate,
      card_fields: isApplication ? {} : fields,
      intent: intent || 'renewal',
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

  if (step === 'type') {
    return <DocTypePicker isDark={isDark} onSelect={selectType} onCancel={onCancel} />
  }

  if (step === 'confirm') {
    return (
      <ApplicationConfirmCard
        isDark={isDark}
        docType={docType}
        title={title}
        onTitleChange={setTitle}
        onBack={() => setStep(initialType ? 'intent' : 'type')}
        onCancel={onCancel}
        onSave={handleSave}
        saving={saving}
        errorMsg={errorMsg}
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
      <div className="flex items-center gap-2 mb-3">
        <div className="flex gap-1 flex-1">
          {Array.from({ length: initialType ? 2 : 3 }).map((_, i) => (
            <div key={i} className="h-1 flex-1 rounded-full bg-blue-400" />
          ))}
        </div>
        <span className={t(isDark, 'text-[10px] text-slate-500 shrink-0', 'text-[10px] text-slate-400 shrink-0')}>
          {translate('add_doc_step2_momentum')}
        </span>
      </div>
      <div className="flex justify-between items-center mb-3">
        <input
          type="text"
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
            className={`glass-interactive p-1.5 rounded-full transition-colors ${t(isDark,
              'text-slate-500 hover:text-slate-100 hover:bg-white/10',
              'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            )}`}
          >
            <Icon size={16}><path d="M15 18l-6-6 6-6" /></Icon>
          </button>
          <button
            type="button"
            title={translate('add_doc_save')}
            onClick={handleSave}
            disabled={saving}
            className={`glass-interactive p-1.5 rounded-full transition-colors disabled:opacity-40 ${t(isDark,
              'text-emerald-400 hover:bg-emerald-400/10',
              'text-emerald-600 hover:bg-emerald-50'
            )}`}
          >
            <Icon size={16}><path d="M20 6L9 17l-5-5" /></Icon>
          </button>
          <button
            type="button"
            title={translate('add_doc_cancel')}
            onClick={onCancel}
            className={`glass-interactive p-1.5 rounded-full transition-colors ${t(isDark,
              'text-slate-500 hover:text-slate-100 hover:bg-white/10',
              'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            )}`}
          >
            <Icon size={16}><path d="M18 6L6 18M6 6l12 12" /></Icon>
          </button>
        </div>
      </div>

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
    </div>
  )
}

const TIME_AGNOSTIC_GREETING_KEYS = ['greeting_welcome_back', 'greeting_hello', 'greeting_hi', 'greeting_hey_there', 'greeting_good_to_see_you', 'greeting_great_to_see_you']

function getTimeOfDayGreetingKey(hour) {
  if (hour < 12) return 'greeting_good_morning'
  if (hour < 18) return 'greeting_good_afternoon'
  return 'greeting_good_evening'
}

function pickGreetingKey() {
  const pool = [...TIME_AGNOSTIC_GREETING_KEYS, getTimeOfDayGreetingKey(new Date().getHours())]
  return pool[Math.floor(Math.random() * pool.length)]
}

// The dashboard tab's hero — greeting/name reveal line by line from behind
// a mask, then the status line, then the chart below it fades/draws in.
// Timings are adapted from the liquid-glass weather-dashboard reference
// build's headline + blurb choreography.
function DashboardHero({ isDark, displayName, mostUrgentDoc, extraUrgentCount = 0 }) {
  const { translate } = useLanguage()
  const [greetingKey] = useState(pickGreetingKey)

  // Loss aversion lands harder when the stakes are concrete: naming the
  // actual document and what happens if they don't act, not just a count.
  let statusNode
  if (mostUrgentDoc) {
    const docLabel = mostUrgentDoc.title || DOC_TYPE_LABELS[mostUrgentDoc.doc_type]
    let base
    if (mostUrgentDoc.urgency === 'expired') {
      base = translate('greeting_status_named_expired', { title: docLabel })
    } else if (mostUrgentDoc.daysUntil === 0) {
      base = translate('greeting_status_named_due_today', { title: docLabel })
    } else if (mostUrgentDoc.daysUntil === 1) {
      base = translate('greeting_status_named_due_one', { title: docLabel })
    } else {
      base = translate('greeting_status_named_due_many', { title: docLabel, days: mostUrgentDoc.daysUntil })
    }
    statusNode = extraUrgentCount > 0
      ? `${base} ${translate('greeting_status_plus_more', { count: extraUrgentCount })}`
      : base
  } else {
    statusNode = translate('greeting_status_ok')
  }

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
      <p
        className={`mt-4 max-w-lg text-base ${t(isDark, 'text-slate-400', 'text-slate-500')}`}
        style={{ animation: 'rise-in 0.7s cubic-bezier(0.16,1,0.3,1) 0.5s both' }}
      >
        {statusNode}
      </p>
    </div>
  )
}

// Smooth cubic-bezier interpolation between arbitrary points — a midpoint
// control-point trick, not a real spline, but reads as a fluid wave with
// only a handful of data points.
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

// Same draw-then-fill SVG technique as the weather reference's chart, but
// plotting how many tracked documents expire per month (application-intent
// documents excluded — they have no real expiry to plot) instead of temps.
function DocumentStatsChart({ isDark, documents }) {
  const { lang } = useLanguage()
  const width = 835
  const height = 200
  const topPad = 24
  const bottomPad = 30

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() + i)
    const count = documents.filter((doc) => {
      if (doc.urgency === 'ongoing') return false
      const exp = new Date(doc.expiry_date)
      return exp.getFullYear() === d.getFullYear() && exp.getMonth() === d.getMonth()
    }).length
    return { label: d.toLocaleDateString(lang === 'fil' ? 'fil-PH' : 'en-US', { month: 'short' }), count }
  })

  const maxCount = Math.max(1, ...months.map((m) => m.count))
  const points = months.map((m, i) => ({
    x: (i / (months.length - 1)) * width,
    y: height - bottomPad - (m.count / maxCount) * (height - topPad - bottomPad),
  }))
  const linePath = buildSmoothPath(points)
  const fillPath = `${linePath} L ${width},${height} L 0,${height} Z`
  const lineColor = isDark ? '#ffffff' : '#0f172a'
  const fillColor = isDark ? '#60a5fa' : '#3b82f6'

  return (
    <div className="mt-10" style={{ animation: 'rise-in 0.8s cubic-bezier(0.16,1,0.3,1) 0.75s both' }}>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full" style={{ height: 180, display: 'block' }}>
        <defs>
          <linearGradient id="doc-chart-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0" />
            <stop offset="12%" stopColor={lineColor} stopOpacity="0.9" />
            <stop offset="88%" stopColor={lineColor} stopOpacity="0.9" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="doc-chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillColor} stopOpacity="0.28" />
            <stop offset="100%" stopColor={fillColor} stopOpacity="0" />
          </linearGradient>
          <clipPath id="doc-chart-clip"><rect width={width} height={height} /></clipPath>
        </defs>
        <g clipPath="url(#doc-chart-clip)">
          <g style={{ transformOrigin: '0px 0px', animation: 'chart-fill-wipe 1.1s cubic-bezier(0.37,0.01,0.2,1) 1.1s both' }}>
            <path d={fillPath} fill="url(#doc-chart-fill)" />
          </g>
          <path
            d={linePath}
            fill="none"
            stroke="url(#doc-chart-line)"
            strokeWidth="3"
            strokeLinecap="round"
            pathLength="1"
            style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: 'chart-draw 1.3s cubic-bezier(0.37,0.01,0.2,1) 0.85s both' }}
          />
        </g>
      </svg>
      <div className="flex justify-between mt-1">
        {months.map((m, i) => (
          <span
            key={`${m.label}-${i}`}
            className={`text-sm ${i === 0 ? t(isDark, 'text-slate-100 font-semibold', 'text-slate-900 font-semibold') : t(isDark, 'text-slate-500', 'text-slate-400')}`}
          >
            {m.label}
          </span>
        ))}
      </div>
    </div>
  )
}

function urgencyStatusKey(urgency) {
  if (urgency === 'expired') return 'card_status_expired'
  if (urgency === 'critical') return 'card_status_due_soon'
  return 'card_status_active'
}

// Right-rail replacement for the weather reference's "Central Jakarta +
// 3 cities" cards — the single most urgent document gets the big card,
// the next three (soonest to least soon) get the row cards. Only ever 4.
function UrgentDocsRail({ isDark, documents, onSelectDoc }) {
  const { translate } = useLanguage()
  const urgent = [...documents]
    .filter((doc) => doc.urgency !== 'ongoing')
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 4)

  if (urgent.length === 0) {
    return (
      <div className={`glass-dark rounded-2xl p-6 text-sm ${t(isDark, 'text-slate-400', 'text-slate-500')}`}>
        {translate('dashboard_no_urgent')}
      </div>
    )
  }

  const [primary, ...rest] = urgent

  return (
    <div className="flex flex-col gap-4">
      <UrgentDocCard isDark={isDark} doc={primary} big onSelect={() => onSelectDoc(primary)} delay={0.55} />
      {rest.map((doc, i) => (
        <UrgentDocCard key={doc.id} isDark={isDark} doc={doc} onSelect={() => onSelectDoc(doc)} delay={0.68 + i * 0.11} />
      ))}
    </div>
  )
}

// Radius shrinks and orbital period speeds up as a document's runway
// shrinks — reads as decay rather than a generic status dot. Expired
// documents don't orbit at all; they've already come down.
// How far the rocket sits from Earth — 1 is the far corner, 0 is docked
// at Earth's edge. Expiring soon reads as "almost home."
// Placeholder for the rocket/Earth widget while that visual gets redesigned
// — just a colored triangle pointing at the urgency direction.
const URGENCY_ARROW_COLOR = {
  safe: '#34d399',
  upcoming: '#60a5fa',
  urgent: '#fbbf24',
  critical: '#f87171',
  expired: '#f87171',
}

function UrgencyArrow({ urgency, size = 48 }) {
  const color = URGENCY_ARROW_COLOR[urgency] || '#60a5fa'
  return (
    <div className="shrink-0 flex items-center justify-center" style={{ width: size, height: size }} aria-hidden="true">
      <svg
        width={size * 0.5}
        height={size * 0.5}
        viewBox="0 0 24 24"
        style={{ animation: 'icon-bob 3s ease-in-out infinite' }}
      >
        <path d="M12 3 L21 20 L12 15.5 L3 20 Z" fill={color} />
      </svg>
    </div>
  )
}

function UrgentDocCard({ isDark, doc, big, onSelect, delay }) {
  const { translate } = useLanguage()
  const agency = AGENCY_BADGE[doc.doc_type]
  const label = doc.title || DOC_TYPE_LABELS[doc.doc_type]
  const dayText = doc.urgency === 'expired' ? translate('card_status_expired') : formatDaysUntil(doc.daysUntil)

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`glass-interactive sheen-once relative text-left rounded-2xl w-full ${big ? 'p-6' : 'p-4 flex items-center justify-between gap-3'}`}
      style={{ animation: `slide-in-right 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s both` }}
    >
      {big ? (
        <>
          <div className="absolute top-4 right-4">
            <UrgencyArrow urgency={doc.urgency} size={64} />
          </div>
          <p className={`flex items-center gap-1.5 text-xs pr-16 ${t(isDark, 'text-slate-400', 'text-slate-500')}`}>
            <span className={`w-4 h-4 rounded-full ${agency.color} flex items-center justify-center text-[7px] font-bold text-white shrink-0`}>
              {agency.label[0]}
            </span>
            <span className="truncate">{label}</span>
          </p>
          <p className={`text-4xl font-medium tracking-tight mt-3 ${t(isDark, 'text-slate-100', 'text-slate-900')}`}>{dayText}</p>
          <p className={`text-xs mt-2 ${t(isDark, 'text-slate-400', 'text-slate-500')}`}>{translate(urgencyStatusKey(doc.urgency))}</p>
        </>
      ) : (
        <>
          <div className="min-w-0">
            <p className={`text-xs truncate ${t(isDark, 'text-slate-400', 'text-slate-500')}`}>{label}</p>
            <p className={`text-sm font-semibold mt-0.5 ${t(isDark, 'text-slate-100', 'text-slate-900')}`}>{dayText}</p>
          </div>
          <UrgencyArrow urgency={doc.urgency} size={32} />
        </>
      )}
    </button>
  )
}

function ToggleSwitch({ isDark, checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-6 rounded-full shrink-0 transition-colors duration-75 ${
        checked ? 'bg-blue-500' : t(isDark, 'bg-white/10', 'bg-slate-200')
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

function SettingsPanelHeader({ isDark, title, description }) {
  return (
    <div className="mb-8">
      <h1 className={t(isDark, 'font-instrument text-3xl text-slate-100 mb-2', 'font-instrument text-3xl text-slate-900 mb-2')}>{title}</h1>
      <p className={t(isDark, 'text-sm text-slate-400', 'text-sm text-slate-500')}>{description}</p>
    </div>
  )
}

function ThemeMockupCard({ variant }) {
  const palettes = {
    light: { bar: '#e5e7eb', card: '#ffffff', line: '#d1d5db', content: '#9ca3af', border: '#e5e7eb' },
    dark: { bar: '#27272a', card: '#3f3f46', line: '#71717a', content: '#a1a1aa', border: '#000000' },
  }
  if (variant === 'system') {
    return (
      <div className="w-full h-20 rounded-lg overflow-hidden border border-black/10 flex">
        {['light', 'dark'].map((half) => {
          const p = palettes[half]
          return (
            <div key={half} className="w-1/2 h-full" style={{ backgroundColor: p.card }}>
              <div className="h-3" style={{ backgroundColor: p.bar }} />
              <div className="p-1.5 flex flex-col gap-1">
                <span className="h-1 w-3/4 rounded-full block" style={{ backgroundColor: p.line }} />
                <span className="h-1 w-1/2 rounded-full block" style={{ backgroundColor: p.line }} />
              </div>
            </div>
          )
        })}
      </div>
    )
  }
  const p = palettes[variant]
  return (
    <div className="w-full h-20 rounded-lg overflow-hidden border" style={{ backgroundColor: p.card, borderColor: p.border }}>
      <div className="h-3 flex items-center gap-1 px-2" style={{ backgroundColor: p.bar }}>
        <span className="w-4 h-1 rounded-full" style={{ backgroundColor: p.line }} />
        <span className="w-2 h-1 rounded-full ml-auto" style={{ backgroundColor: p.line }} />
        <span className="w-2 h-1 rounded-full" style={{ backgroundColor: p.line }} />
      </div>
      <div className="flex gap-1.5 p-1.5">
        <div className="w-1/3 flex flex-col gap-1 pt-0.5">
          <span className="h-1 rounded-full block" style={{ backgroundColor: p.line }} />
          <span className="h-1 rounded-full block" style={{ backgroundColor: p.line }} />
          <span className="h-1 rounded-full block" style={{ backgroundColor: p.line }} />
        </div>
        <div className="flex-1 rounded h-10" style={{ backgroundColor: p.content }} />
      </div>
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
        {AVATAR_COLORS.map((gradient, i) => (
          <button
            key={gradient}
            type="button"
            onClick={() => onSetAccentColor(i)}
            aria-label={`Color ${i + 1}`}
            className={`glass-interactive w-10 h-10 rounded-full bg-gradient-to-br ${gradient} ${t(isDark,
              accentColor === i ? 'ring-2 ring-offset-2 ring-offset-[#0a0a0f] ring-white' : '',
              accentColor === i ? 'ring-2 ring-offset-2 ring-offset-white ring-slate-900' : ''
            )}`}
          />
        ))}
      </div>
    </div>
  )
}

function RemindersPanel({ isDark }) {
  const { translate } = useLanguage()
  return (
    <div className="mb-8">
      <SettingsPanelHeader isDark={isDark} title={translate('reminders_title')} description={translate('reminders_desc')} />
      <div className={`rounded-xl p-4 max-w-md ${t(isDark, 'glass-dark', 'glass-light')}`}>
        <p className={t(isDark, 'text-sm text-slate-300', 'text-sm text-slate-600')}>
          {translate('reminders_body')}
        </p>
      </div>
    </div>
  )
}

function notificationMessage(doc) {
  const sub = formatDaysUntil(doc.daysUntil)
  if (doc.urgency === 'ongoing') return { title: `Your ${doc.title} application is in progress.`, sub: '' }
  if (doc.urgency === 'expired') return { title: `${doc.title} has expired. Renew it soon.`, sub }
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

  const visible = items.filter((n) => {
    if (query && !n.title.toLowerCase().includes(query.toLowerCase())) return false
    if (tab === 'archive') return archived.has(n.id)
    if (tab === 'favorite') return favorites.has(n.id)
    return !archived.has(n.id)
  })

  const tabs = [
    { id: 'all', label: 'All', count: items.filter((n) => !archived.has(n.id)).length },
    { id: 'archive', label: 'Archive', count: archived.size },
    { id: 'favorite', label: 'Favorite', count: favorites.size },
  ]

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-1">
        <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${t(isDark, 'text-slate-300', 'text-slate-600')}`}>
          <Icon size={18}><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" /></Icon>
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
              className={`relative z-10 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors duration-75 ${
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

      <div className="flex flex-col gap-2">
        {visible.length === 0 ? (
          <div className={`rounded-2xl p-8 text-center text-sm border ${t(isDark, 'border-white/10 text-slate-400', 'border-slate-200 text-slate-500')}`}>
            Nothing here yet.
          </div>
        ) : (
          visible.map((n, i) => {
            const meta = URGENCY_META[n.urgency]
            const isFav = favorites.has(n.id)
            const isArchived = archived.has(n.id)
            const dept = AGENCY_BADGE[n.doc.doc_type]?.label
            const logo = DEPARTMENT_LOGOS[dept]
            return (
              <div
                key={n.id}
                onClick={() => onSelectDoc?.(n.doc)}
                className={`glass-interactive cursor-pointer flex items-center gap-3 rounded-2xl p-3.5 border ${t(isDark, 'border-white/10', 'border-slate-200')}`}
                style={{ animation: 'rise-in 0.4s cubic-bezier(0.16,1,0.3,1) both', animationDelay: `${Math.min(i * 0.04, 0.3)}s` }}
              >
                <span className={`w-9 h-9 rounded-full overflow-hidden flex items-center justify-center shrink-0 ${t(isDark, meta?.badgeDark, meta?.badgeLight)}`}>
                  {logo ? (
                    <img src={logo} alt="" className="w-full h-full object-contain p-1 rounded-full bg-white" />
                  ) : (
                    <Icon size={15}><path d="M13 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V9z" /><path d="M13 3v6h6M9 13h6M9 17h6" /></Icon>
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${t(isDark, 'text-slate-200', 'text-slate-700')}`}>{n.title}</p>
                  {n.sub && <p className="text-xs text-slate-500 mt-0.5">{n.sub}</p>}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(n.id) }}
                  title={isFav ? 'Unfavorite' : 'Favorite'}
                  className={`glass-interactive p-1.5 rounded-full shrink-0 ${isFav ? 'text-amber-400' : t(isDark, 'text-slate-500 hover:text-slate-200', 'text-slate-400 hover:text-slate-700')}`}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleArchived(n.id) }}
                  title={isArchived ? 'Restore' : 'Archive'}
                  className="glass-interactive p-1.5 rounded-full shrink-0 text-red-400/70 hover:text-red-400"
                >
                  <Icon size={15}><path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" /></Icon>
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function activityTimeAgo(dateStr) {
  if (!dateStr) return ''
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
}

const ACTIVITY_ICON_PATH = {
  add: <path d="M12 5v14M5 12h14" />,
  delete: <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />,
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
                <Icon size={15}>{ACTIVITY_ICON_PATH[entry.type] || ACTIVITY_ICON_PATH.update}</Icon>
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm truncate ${t(isDark, 'text-slate-200', 'text-slate-700')}`}>{entry.text}</p>
                <p className="text-xs text-slate-500 mt-0.5">{activityTimeAgo(entry.timestamp)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function NotificationsPanel({ isDark, emailAlerts, onEmailAlerts, pushAlerts, onPushAlerts, smsAlerts, onSmsAlerts, weeklyDigest, onWeeklyDigest }) {
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
            <p className={t(isDark, 'text-xs text-slate-500', 'text-xs text-slate-400')}>{translate('notifications_push_desc')}</p>
          </div>
          <ToggleSwitch isDark={isDark} checked={pushAlerts} onChange={onPushAlerts} />
        </div>
        <div className="flex items-center justify-between gap-4 p-4">
          <div>
            <p className={t(isDark, 'text-sm font-medium text-slate-200', 'text-sm font-medium text-slate-700')}>{translate('notifications_sms_label')}</p>
            <p className={t(isDark, 'text-xs text-slate-500', 'text-xs text-slate-400')}>{translate('notifications_sms_desc')}</p>
          </div>
          <ToggleSwitch isDark={isDark} checked={smsAlerts} onChange={onSmsAlerts} />
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
  const trackedTypes = new Set(documents.map((d) => d.doc_type))
  return (
    <div>
      <SettingsPanelHeader isDark={isDark} title={translate('linked_docs_title')} description={translate('linked_docs_desc')} />
      <div className="grid sm:grid-cols-2 gap-3 max-w-2xl">
        {DOC_TYPE_OPTIONS.map((opt) => {
          const count = documents.filter((d) => d.doc_type === opt.value).length
          const tracked = trackedTypes.has(opt.value)
          const agency = AGENCY_BADGE[opt.value]
          return (
            <div
              key={opt.value}
              onClick={() => onAddType(opt.value)}
              className={`glass-interactive cursor-pointer flex items-center gap-3 rounded-xl p-3 border ${t(isDark, 'border-white/10', 'border-slate-200')}`}
            >
              <div className={t(isDark, 'w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0', 'w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0')}>
                <span className={t(isDark, 'text-slate-300 text-[9px] font-bold tracking-tight', 'text-slate-600 text-[9px] font-bold tracking-tight')}>{agency?.label}</span>
              </div>
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
                  className="glass-accent glass-interactive shrink-0 text-xs font-medium text-white px-3 py-1.5 rounded-lg"
                >
                  {translate('linked_docs_add')}
                </button>
              )}
            </div>
          )
        })}
      </div>
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
              className={`glass-interactive flex-1 flex items-center justify-center gap-2 rounded-xl py-4 border ${t(isDark, 'border-white/10', 'border-slate-200')} ${active ? 'ring-2 ring-blue-400' : ''}`}
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

function CalendarPanel({ isDark }) {
  const { translate } = useLanguage()
  return (
    <div>
      <SettingsPanelHeader isDark={isDark} title={translate('calendar_title')} description={translate('calendar_desc')} />
      <div className={`rounded-xl p-4 max-w-md flex items-center justify-between gap-4 border ${t(isDark, 'border-white/10', 'border-slate-200')}`}>
        <div>
          <p className={t(isDark, 'text-sm font-medium text-slate-200', 'text-sm font-medium text-slate-700')}>{translate('calendar_export_title')}</p>
          <p className={t(isDark, 'text-xs text-slate-500', 'text-xs text-slate-400')}>{translate('calendar_export_desc')}</p>
        </div>
        <button
          type="button"
          disabled
          className={t(isDark,
            'shrink-0 text-sm font-medium bg-white/10 text-slate-500 px-4 py-2 rounded-lg cursor-not-allowed',
            'shrink-0 text-sm font-medium bg-slate-200 text-slate-400 px-4 py-2 rounded-lg cursor-not-allowed'
          )}
        >
          {translate('calendar_export_btn')}
        </button>
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
    a.download = 'handa-documents.json'
    a.click()
    URL.revokeObjectURL(url)
    setExported(true)
    setTimeout(() => setExported(false), 2000)
  }

  return (
    <div>
      <SettingsPanelHeader isDark={isDark} title="Data & Privacy" description="Your documents, on your terms." />
      <div className={`rounded-xl p-4 max-w-md flex items-center justify-between gap-4 border ${t(isDark, 'border-white/10', 'border-slate-200')}`}>
        <div>
          <p className={t(isDark, 'text-sm font-medium text-slate-200', 'text-sm font-medium text-slate-700')}>Export my documents</p>
          <p className={t(isDark, 'text-xs text-slate-500', 'text-xs text-slate-400')}>Download a JSON copy of everything you're tracking.</p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="glass-accent glass-interactive shrink-0 text-sm font-medium text-white px-4 py-2 rounded-lg"
        >
          {exported ? 'Downloaded' : 'Export'}
        </button>
      </div>
      <p className={t(isDark, 'text-xs text-slate-500 mt-4 max-w-md', 'text-xs text-slate-400 mt-4 max-w-md')}>
        Account deletion isn't available in-app yet.
      </p>
    </div>
  )
}

// A single row in "My Orbits" — collapsed it's just a header; expanded it
// reveals the status filters + document grid for that department, passed in
// as a lazy render function so it's only built while actually visible.
// useDelayedUnmount keeps the content mounted a beat past the collapse so it
// fades out instead of vanishing the instant you close it.
function OrbitAccordionItem({ isDark, orbit, isOpen, onToggle, logo, renderContent, delay }) {
  const shouldRenderContent = useDelayedUnmount(isOpen, 300)
  return (
    <div
      className={`rounded-2xl overflow-hidden border ${t(isDark, 'border-white/10', 'border-slate-200')}`}
      style={{ animation: `rise-in 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}s both` }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="glass-interactive w-full flex items-center justify-between gap-3 p-5 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center shrink-0 ${t(isDark, 'glass-chip-dark', 'glass-chip-light')}`}>
            {logo ? (
              <img src={logo} alt="" className="w-full h-full object-contain p-1 rounded-full bg-white" />
            ) : (
              <Icon size={16}>
                <circle cx="10" cy="12" r="5" />
                <ellipse cx="10" cy="12" rx="8.5" ry="2.4" transform="rotate(-20 10 12)" />
              </Icon>
            )}
          </span>
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
  const [loading, setLoading] = useState(true)
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

  function openAddDocument(initialType) {
    if (addTileRef.current) setAddCardWidth(addTileRef.current.getBoundingClientRect().width)
    setPendingDocType(typeof initialType === 'string' ? initialType : null)
    setAddingDocument(true)
  }
  const [activeFilter, setActiveFilter] = useState('all')
  // null = browsing the "My Orbits" category grid; a doc_type = drilled
  // into that orbit's documents, where the status filter pills apply.
  const [selectedOrbit, setSelectedOrbit] = useState(null)
  const [showNotifDropdown, setShowNotifDropdown] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  // Persisted locally (per-account) since there's no profiles table yet to
  // sync this to a backend — survives refresh, but only on this browser.
  const [profilePhoto, setProfilePhoto] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(`handa_profile_meta_${session.user.id}`) || 'null')
      return saved?.photo || null
    } catch {
      return null
    }
  })
  const [profileUsername, setProfileUsername] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(`handa_profile_meta_${session.user.id}`) || 'null')
      return saved?.username || ''
    } catch {
      return ''
    }
  })
  // Defaults to the color chosen during signup (see Auth.jsx); falls back to
  // the original hardcoded blue for accounts created before this existed.
  const [profileColor, setProfileColor] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(`handa_profile_meta_${session.user.id}`) || 'null')
      return typeof saved?.color === 'number' ? saved.color : 0
    } catch {
      return 0
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(`handa_profile_meta_${session.user.id}`, JSON.stringify({ photo: profilePhoto, username: profileUsername, color: profileColor }))
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

  const [notifPrefs, setNotifPrefs] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(`handa_notification_prefs_${session.user.id}`) || 'null')
      return { emailAlerts: true, pushAlerts: true, smsAlerts: false, weeklyDigest: true, ...saved }
    } catch {
      return { emailAlerts: true, pushAlerts: true, smsAlerts: false, weeklyDigest: true }
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(`handa_notification_prefs_${session.user.id}`, JSON.stringify(notifPrefs))
    } catch {
      // localStorage can throw (quota exceeded, private browsing) — persistence is best-effort.
    }
  }, [notifPrefs, session.user.id])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  // Persisted so a hard reload (e.g. clicking the logo) doesn't silently
  // snap the theme back to the default instead of keeping what was chosen.
  // 'system' follows the OS preference live rather than being captured once.
  const [themeMode, setThemeModeState] = useState(() => {
    try {
      const saved = localStorage.getItem('handa_theme_mode')
      if (saved === 'light' || saved === 'dark' || saved === 'system') return saved
      const legacy = localStorage.getItem('handa_theme')
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
    try { localStorage.setItem('handa_theme_mode', mode) } catch {}
  }
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('handa_recent_searches') || '[]')
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
  const [confirmDeleteSnapshot, setConfirmDeleteSnapshot] = useState(null)
  useEffect(() => {
    if (confirmDelete) {
      setConfirmDeleteSnapshot(confirmDelete)
      setDeleteError('')
    }
  }, [confirmDelete])

  useEffect(() => {
    fetchDocuments()
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

  async function fetchDocuments(options = {}) {
    if (!options.silent) setLoading(true)
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('expiry_date', { ascending: true })

    if (error) {
      console.error('Error fetching documents:', error)
      if (!options.silent) setLoading(false)
      return
    }

    setDocuments(data)
    if (!options.silent) setLoading(false)
    return data
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
    const updated = [query, ...recentSearches.filter((s) => s !== query)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('handa_recent_searches', JSON.stringify(updated))
  }

  function removeSearch(query) {
    const updated = recentSearches.filter((s) => s !== query)
    setRecentSearches(updated)
    localStorage.setItem('handa_recent_searches', JSON.stringify(updated))
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
        return prev > 0 ? prev - 1 : total - 1
      })
      return
    }

    if (e.key === 'Enter') {
      if (showSuggestions && highlightedIndex >= 0 && highlightedIndex < total) {
        e.preventDefault()
        if (highlightedIndex < matchingRecent.length) {
          const s = matchingRecent[highlightedIndex]
          setSearchQuery(s)
          saveSearch(s)
        } else {
          const doc = matchingDocSuggestions[highlightedIndex - matchingRecent.length]
          setSearchQuery(doc.title)
          saveSearch(doc.title)
        }
        setSearchFocused(false)
        return
      }
      saveSearch(searchQuery)
      setSearchFocused(false)
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
  const dueSoonDocs = enriched.filter((d) => d.urgency === 'critical')
  const expiredDocs = enriched.filter((d) => d.urgency === 'expired')

  // Named, not just counted — "your Passport expires in 4 days" is concrete
  // enough to act on; "1 document expiring soon" is easy to shrug off.
  const urgentDocs = [...expiredDocs, ...dueSoonDocs].sort((a, b) => a.daysUntil - b.daysUntil)
  const mostUrgentDoc = urgentDocs[0] || null
  const extraUrgentCount = Math.max(0, urgentDocs.length - 1)

  const filtered = enriched.filter((doc) => {
    if (searchQuery && !doc.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (activeNav === 'my_documents' && selectedOrbit && AGENCY_BADGE[doc.doc_type]?.label !== selectedOrbit) return false
    if (activeFilter === 'all') return true
    if (activeFilter === 'active') return doc.urgency !== 'expired'
    if (activeFilter === 'expiring_soon') return doc.urgency === 'urgent' || doc.urgency === 'critical'
    if (activeFilter === 'expired') return doc.urgency === 'expired'
    return true
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
  const matchingDocSuggestions = hasSearchQuery
    ? documents.filter((doc) => doc.title.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5)
    : []
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
                className={`relative z-10 px-5 py-2 rounded-full text-sm transition-colors duration-75 ${
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
          </div>
        </div>

        {/* Document cards */}
        {loading ? (
          <p className="text-slate-500">{translate('loading')}</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AddDocumentTile isDark={isDark} onClick={() => openAddDocument()} tileRef={addTileRef} />
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
                    <p className={t(isDark, 'text-xs font-medium text-slate-300 truncate', 'text-xs font-medium text-slate-600 truncate')}>{doc.title}</p>
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
                        <IDCardFront
                          docType={doc.doc_type}
                          title={doc.title}
                          fields={doc.urgency === 'ongoing' ? {} : (doc.card_fields || {})}
                          expiryDate={doc.urgency === 'ongoing' ? '' : doc.expiry_date}
                          editing={false}
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
      {isDark ? (
        <>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2400&auto=format&fit=crop)',
              backgroundSize: '115% auto',
              backgroundRepeat: 'no-repeat',
              animation: 'earth-drift 90s ease-in-out infinite alternate',
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(180deg, rgba(3,6,10,0.32) 0%, rgba(3,6,10,0.52) 100%)' }}
          />
        </>
      ) : (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 0%, rgba(59,130,246,0.06), transparent 45%)' }}
        />
      )}

      <div className="relative z-10 h-full w-full flex overflow-hidden p-3 gap-3">
      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        onClick={() => { if (!sidebarOpen) setSidebarOpen(true) }}
        className={`hidden md:flex flex-col h-full rounded-2xl py-6 shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-64 px-5 cursor-default' : 'w-20 px-3 cursor-pointer'}`}
      >
        <div className={`flex items-center mb-10 ${sidebarOpen ? 'justify-between px-2' : 'justify-center'}`}>
          {showSettings ? (
            <button
              onClick={(e) => { e.stopPropagation(); setShowSettings(false) }}
              className="flex items-center gap-2"
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
              className="flex items-center gap-2"
            >
              <img src={orbitLogo} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
              {sidebarOpen && <span className="font-dancing text-lg whitespace-nowrap">Orbit</span>}
            </button>
          )}
          {sidebarOpen && (
            <button
              onClick={(e) => { e.stopPropagation(); setSidebarOpen(false) }}
              className={t(isDark,
                'p-1.5 rounded-full text-slate-500 hover:text-slate-100 hover:bg-white/10 transition-colors duration-75',
                'p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors duration-75'
              )}
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
                    className={`glass-interactive flex items-center gap-3 py-2 rounded-xl text-sm text-left whitespace-nowrap ${
                      sidebarOpen ? 'px-2' : 'px-0 justify-center'
                    } ${
                      item.id === settingsTab
                        ? t(isDark, 'glass-chip-dark', 'glass-chip-light')
                        : t(isDark, 'text-slate-400 hover:bg-white/5 hover:text-slate-100 transition-colors duration-75', 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors duration-75')
                    }`}
                  >
                    <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                      <Icon size={15}>{item.icon}</Icon>
                    </span>
                    {sidebarOpen && translate(item.labelKey)}
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
                className={`glass-interactive flex items-center gap-3 py-2 rounded-xl text-sm text-left whitespace-nowrap ${
                  sidebarOpen ? 'px-2' : 'px-0 justify-center'
                } ${
                  item.id === activeNav
                    ? t(isDark, 'glass-chip-dark', 'glass-chip-light')
                    : t(isDark, 'text-slate-400 hover:bg-white/5 hover:text-slate-100 transition-colors duration-75', 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors duration-75')
                }`}
              >
                <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                  <Icon size={15}>{item.icon}</Icon>
                </span>
                {sidebarOpen && translate(item.labelKey)}
              </button>
            ))}
          </nav>
        )}

        <div className="flex flex-col gap-1 pt-4">
          {!showSettings && (
          <button
            title={translate('nav_settings')}
            onClick={(e) => { e.stopPropagation(); setShowSettings(true) }}
            className={`flex items-center gap-3 py-2 rounded-xl text-sm text-left transition-colors duration-75 whitespace-nowrap ${sidebarOpen ? 'px-2' : 'px-0 justify-center'} ${t(isDark, 'text-slate-400 hover:bg-white/5 hover:text-slate-100', 'text-slate-500 hover:bg-slate-50 hover:text-slate-900')}`}
          >
            <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0">
              <Icon size={15}>
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
              </Icon>
            </span>
            {sidebarOpen && translate('nav_settings')}
          </button>
          )}
          <button
            title={translate('nav_logout')}
            onClick={(e) => { e.stopPropagation(); setConfirmLogout(true) }}
            className={`flex items-center gap-3 py-2 rounded-xl text-sm text-left transition-colors duration-75 whitespace-nowrap ${sidebarOpen ? 'px-2' : 'px-0 justify-center'} ${t(isDark, 'text-slate-400 hover:bg-white/5 hover:text-red-300', 'text-slate-500 hover:bg-slate-50 hover:text-red-500')}`}
          >
            <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0">
              <Icon size={15}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></Icon>
            </span>
            {sidebarOpen && translate('nav_logout')}
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
        {/* Top bar — floats on the page background; each control is its own bubble */}
        <div className="shrink-0 flex items-center justify-between">
          <div className="relative w-full max-w-xs">
            <div
              className="relative z-20 flex items-center rounded-full transition-colors duration-200"
            >
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
                  'absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-white/[0.08] px-2 py-1 rounded-md pointer-events-none',
                  'absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md pointer-events-none'
                )}
              >
                Ctrl K
              </span>
            </div>
            {showSuggestions && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setSearchFocused(false)} onMouseDown={(e) => e.stopPropagation()} />
                <div
                  className={t(isDark,
                    'absolute top-full left-0 mt-2 w-full glass-dark rounded-xl py-2 z-20',
                    'absolute top-full left-0 mt-2 w-full glass-light rounded-xl py-2 z-20'
                  )}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {matchingRecent.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 px-3 pb-1 uppercase tracking-widest">Recent Searches</p>
                      {matchingRecent.map((s, i) => (
                        <div
                          key={i}
                          onMouseEnter={() => setHighlightedIndex(i)}
                          className={t(isDark,
                            `flex items-center justify-between px-3 py-1.5 ${highlightedIndex === i ? 'bg-white/5' : 'hover:bg-white/5'}`,
                            `flex items-center justify-between px-3 py-1.5 ${highlightedIndex === i ? 'bg-slate-50' : 'hover:bg-slate-50'}`
                          )}
                        >
                          <button
                            onClick={() => {
                              setSearchQuery(s)
                              saveSearch(s)
                              setSearchFocused(false)
                            }}
                            className={t(isDark, 'text-sm text-slate-300 flex-1 text-left', 'text-sm text-slate-600 flex-1 text-left')}
                          >
                            {s}
                          </button>
                          <button onClick={() => removeSearch(s)} className="text-slate-500 hover:text-red-400 ml-2">
                            <Icon size={13}><path d="M18 6L6 18M6 6l12 12" /></Icon>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {matchingDocSuggestions.length > 0 && (
                    <div className={matchingRecent.length > 0 ? t(isDark, 'border-t border-white/10 mt-1 pt-1', 'border-t border-slate-200 mt-1 pt-1') : ''}>
                      <p className="text-xs text-slate-500 px-3 pb-1 uppercase tracking-widest">Documents</p>
                      {matchingDocSuggestions.map((doc, i) => (
                        <button
                          key={doc.id}
                          onMouseEnter={() => setHighlightedIndex(matchingRecent.length + i)}
                          onClick={() => {
                            setSearchQuery(doc.title)
                            saveSearch(doc.title)
                            setSearchFocused(false)
                          }}
                          className={t(isDark,
                            `w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left text-slate-300 ${highlightedIndex === matchingRecent.length + i ? 'bg-white/5' : 'hover:bg-white/5'}`,
                            `w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left text-slate-600 ${highlightedIndex === matchingRecent.length + i ? 'bg-slate-50' : 'hover:bg-slate-50'}`
                          )}
                        >
                          <span className="text-slate-500 shrink-0">
                            <Icon size={13}><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></Icon>
                          </span>
                          <span className="truncate">{doc.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Dropdown open={showNotifDropdown} onClose={() => setShowNotifDropdown(false)} backdropZ="z-40" contentZ="z-50">
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className={`glass-interactive w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-75 ${t(isDark,
                  'text-slate-400 hover:text-slate-100',
                  'text-slate-500 hover:text-slate-900'
                )}`}
              >
                <Icon size={16}><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" /></Icon>
              </button>
              {notifShouldRender && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{ animation: showNotifDropdown ? 'dropdown-in 140ms ease-out' : 'dropdown-out 140ms ease-in forwards' }}
                  className={t(isDark,
                    'absolute right-0 mt-2 w-64 glass-dark rounded-xl p-4 origin-top-right',
                    'absolute right-0 mt-2 w-64 glass-light rounded-xl p-4 origin-top-right'
                  )}
                >
                  <p className="text-sm text-slate-400">No new notifications</p>
                </div>
              )}
            </Dropdown>

            <Dropdown open={showUserDropdown} onClose={() => setShowUserDropdown(false)} backdropZ="z-40" contentZ="z-50">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className={`glass-interactive flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-full transition-colors duration-75 ${t(isDark, 'hover:bg-white/5', 'hover:bg-slate-50')}`}
              >
                {profilePhoto ? (
                  <img src={profilePhoto} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                ) : (
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${AVATAR_COLORS[profileColor] || AVATAR_COLORS[0]} flex items-center justify-center text-sm font-semibold text-white shrink-0`}>
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
                    'absolute right-0 mt-2 w-48 glass-dark rounded-xl py-1 origin-top-right',
                    'absolute right-0 mt-2 w-48 glass-light rounded-xl py-1 origin-top-right'
                  )}
                >
                  <button
                    onClick={() => { setShowSettings(true); setSettingsTab('account'); setShowUserDropdown(false) }}
                    className={t(isDark, 'w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-white/5', 'w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50')}
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => { setShowSettings(true); setShowUserDropdown(false) }}
                    className={t(isDark, 'w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-white/5', 'w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50')}
                  >
                    Settings
                  </button>
                  <div className={t(isDark, 'border-t border-white/10 my-1', 'border-t border-slate-200 my-1')} />
                  <button
                    onClick={() => { setConfirmLogout(true); setShowUserDropdown(false) }}
                    className={t(isDark, 'w-full text-left px-4 py-2 text-sm text-red-300 hover:bg-white/5', 'w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-slate-50')}
                  >
                    Log out
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
              {settingsTab === 'reminders' && <RemindersPanel isDark={isDark} />}
              {settingsTab === 'notifications' && (
                <NotificationsPanel
                  isDark={isDark}
                  emailAlerts={notifPrefs.emailAlerts}
                  onEmailAlerts={(v) => setNotifPrefs((p) => ({ ...p, emailAlerts: v }))}
                  pushAlerts={notifPrefs.pushAlerts}
                  onPushAlerts={(v) => setNotifPrefs((p) => ({ ...p, pushAlerts: v }))}
                  smsAlerts={notifPrefs.smsAlerts}
                  onSmsAlerts={(v) => setNotifPrefs((p) => ({ ...p, smsAlerts: v }))}
                  weeklyDigest={notifPrefs.weeklyDigest}
                  onWeeklyDigest={(v) => setNotifPrefs((p) => ({ ...p, weeklyDigest: v }))}
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
              {settingsTab === 'calendar' && <CalendarPanel isDark={isDark} />}
              {settingsTab === 'data' && <DataPrivacyPanel isDark={isDark} documents={enriched} />}
            </div>
          ) : activeNav === 'requirements' ? (
            <div key={activeNav} style={{ animation: 'rise-in 0.5s cubic-bezier(0.16,1,0.3,1) both' }}>
              <LinkedDocumentsPanel isDark={isDark} documents={documents} onAddType={(docType) => openAddDocument(docType)} />
            </div>
          ) : activeNav === 'appointments' ? (
            <div key={activeNav} style={{ animation: 'rise-in 0.5s cubic-bezier(0.16,1,0.3,1) both' }}>
              <CalendarPanel isDark={isDark} />
            </div>
          ) : activeNav === 'dashboard' ? (
            <div className="flex flex-col lg:flex-row gap-10">
              <div className="flex-1 min-w-0">
                <DashboardHero
                  isDark={isDark}
                  displayName={profileUsername || getDisplayName(session.user.email)}
                  mostUrgentDoc={mostUrgentDoc}
                  extraUrgentCount={extraUrgentCount}
                />
                <DocumentStatsChart isDark={isDark} documents={enriched} />
              </div>
              <div className="lg:w-[300px] shrink-0">
                <UrgentDocsRail isDark={isDark} documents={enriched} onSelectDoc={setSelectedDoc} />
              </div>
            </div>
          ) : activeNav === 'reminders' ? (
            <div key={activeNav} style={{ animation: 'rise-in 0.5s cubic-bezier(0.16,1,0.3,1) both' }}>
              <NotificationsFeed isDark={isDark} documents={enriched} onSelectDoc={setSelectedDoc} />
            </div>
          ) : activeNav === 'history' ? (
            <div key={activeNav} style={{ animation: 'rise-in 0.5s cubic-bezier(0.16,1,0.3,1) both' }}>
              <HistoryFeed isDark={isDark} activityLog={activityLog} />
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
                      logo={DEPARTMENT_LOGOS[orbit.docType]}
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
              ...(addCardWidth ? { maxWidth: `${addCardWidth}px` } : {}),
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <AddDocumentCard
              isDark={isDark}
              userId={session.user.id}
              existingDocs={documents}
              initialType={pendingDocType}
              onAdded={(title) => { fetchDocuments(); setAddingDocument(false); logAction(`Added ${title}`, 'add') }}
              onCancel={() => setAddingDocument(false)}
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
        onStepsUpdated={handleStepsUpdated}
        onClose={() => setSelectedDoc(null)}
      />
      </div>
    </div>
  )
}