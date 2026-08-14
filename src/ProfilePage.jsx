import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'
import { useLanguage } from './i18n'
import { AVATAR_COLORS } from './avatarColors'

function t(isDark, darkClasses, lightClasses) {
  return isDark ? darkClasses : lightClasses
}

function Icon({ children, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}

const COUNTRY_CODES = [
  { code: '+63', name: 'Philippines', id: 'PH' },
  { code: '+1', name: 'US / Canada', id: 'US' },
  { code: '+44', name: 'United Kingdom', id: 'GB' },
  { code: '+61', name: 'Australia', id: 'AU' },
  { code: '+971', name: 'UAE', id: 'AE' },
  { code: '+966', name: 'Saudi Arabia', id: 'SA' },
  { code: '+65', name: 'Singapore', id: 'SG' },
  { code: '+852', name: 'Hong Kong', id: 'HK' },
  { code: '+81', name: 'Japan', id: 'JP' },
  { code: '+974', name: 'Qatar', id: 'QA' },
  { code: '+965', name: 'Kuwait', id: 'KW' },
]

function renderFlagShape(country) {
  switch (country) {
    case 'PH':
      return (<>
        <rect width="24" height="9" fill="#0038a8" />
        <rect y="9" width="24" height="9" fill="#ce1126" />
        <path d="M0 0L10 9L0 18Z" fill="#fff" />
        <circle cx="4" cy="9" r="1.8" fill="#fcd116" />
      </>)
    case 'US':
      return (<>
        <rect width="24" height="18" fill="#b22234" />
        <rect y="1.4" width="24" height="1.4" fill="#fff" />
        <rect y="4.2" width="24" height="1.4" fill="#fff" />
        <rect y="7" width="24" height="1.4" fill="#fff" />
        <rect y="9.8" width="24" height="1.4" fill="#fff" />
        <rect y="12.6" width="24" height="1.4" fill="#fff" />
        <rect y="15.4" width="24" height="1.4" fill="#fff" />
        <rect width="10" height="9.8" fill="#3c3b6e" />
      </>)
    case 'GB':
    case 'AU':
      return (<>
        <rect width="24" height="18" fill="#012169" />
        <rect x="10" width="4" height="18" fill="#fff" />
        <rect y="7" width="24" height="4" fill="#fff" />
        <rect x="11" width="2" height="18" fill="#c8102e" />
        <rect y="8" width="24" height="2" fill="#c8102e" />
      </>)
    case 'AE':
      return (<>
        <rect width="24" height="6" fill="#00732f" />
        <rect y="6" width="24" height="6" fill="#fff" />
        <rect y="12" width="24" height="6" fill="#000" />
        <rect width="7" height="18" fill="#ce1126" />
      </>)
    case 'SA':
      return <rect width="24" height="18" fill="#006c35" />
    case 'SG':
      return (<>
        <rect width="24" height="9" fill="#ed2939" />
        <rect y="9" width="24" height="9" fill="#fff" />
      </>)
    case 'HK':
      return <rect width="24" height="18" fill="#de2910" />
    case 'JP':
      return (<>
        <rect width="24" height="18" fill="#fff" />
        <circle cx="12" cy="9" r="5" fill="#bc002d" />
      </>)
    case 'QA':
      return (<>
        <rect width="24" height="18" fill="#8d1b3d" />
        <rect width="6" height="18" fill="#fff" />
      </>)
    case 'KW':
      return (<>
        <rect width="24" height="6" fill="#007a3d" />
        <rect y="6" width="24" height="6" fill="#fff" />
        <rect y="12" width="24" height="6" fill="#000" />
        <rect width="7" height="18" fill="#ce1126" />
      </>)
    default:
      return <rect width="24" height="18" fill="#64748b" />
  }
}

function FlagIcon({ country, size = 18 }) {
  const h = Math.round(size * 0.75)
  return (
    <span className="inline-block shrink-0 rounded-[3px] overflow-hidden ring-1 ring-black/10" style={{ width: size, height: h }}>
      <svg width={size} height={h} viewBox="0 0 24 18" preserveAspectRatio="none">
        {renderFlagShape(country)}
      </svg>
    </span>
  )
}

function getDisplayName(email) {
  if (!email) return 'Explorer'
  const local = email.split('@')[0]
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function formatDOB(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 6)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

function SectionCard({ isDark, title, children }) {
  return (
    <div className={t(isDark,
      'rounded-2xl border border-white/10 p-5',
      'rounded-2xl border border-slate-200 p-5'
    )}>
      <p className={t(isDark, 'text-xs font-semibold tracking-widest text-slate-400 mb-4', 'text-xs font-semibold tracking-widest text-slate-500 mb-4')}>
        {title}
      </p>
      {children}
    </div>
  )
}

function FieldInput({ isDark, label, value, onChange, placeholder, editing, inputMode, maxLength }) {
  return (
    <div>
      <label className={t(isDark, 'text-xs text-slate-400 mb-1.5 block', 'text-xs text-slate-500 mb-1.5 block')}>{label}</label>
      <input
        type="text"
        inputMode={inputMode}
        maxLength={maxLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={!editing}
        className={t(isDark,
          `w-full bg-[#16171c] border rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors ${editing ? 'border-blue-400/50' : 'border-white/10'}`,
          `w-full bg-slate-50 border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-colors ${editing ? 'border-blue-400' : 'border-slate-200'}`
        )}
      />
    </div>
  )
}

const DOB_MASK = 'MM/DD/YY'

function DOBField({ isDark, value, onChange, editing }) {
  const showMask = editing && value.length > 0 && value.length < DOB_MASK.length
  return (
    <div>
      <label className={t(isDark, 'text-xs text-slate-400 mb-1.5 block', 'text-xs text-slate-500 mb-1.5 block')}>Date of Birth</label>
      <div className="relative">
        {showMask && (
          <div aria-hidden="true" className="absolute inset-0 flex items-center px-3 py-2.5 text-sm whitespace-pre overflow-hidden pointer-events-none">
            <span className="invisible">{value}</span>
            <span className={t(isDark, 'text-slate-600', 'text-slate-400')}>{DOB_MASK.slice(value.length)}</span>
          </div>
        )}
        <input
          type="text"
          inputMode="numeric"
          maxLength={8}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={DOB_MASK}
          disabled={!editing}
          className={t(isDark,
            `w-full bg-[#16171c] border rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors ${editing ? 'border-blue-400/50' : 'border-white/10'}`,
            `w-full bg-slate-50 border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-colors ${editing ? 'border-blue-400' : 'border-slate-200'}`
          )}
        />
      </div>
    </div>
  )
}

function CountryCodeDropdown({ isDark, value, onChange, editing }) {
  const [open, setOpen] = useState(false)
  const [openUpward, setOpenUpward] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside, true)
    return () => document.removeEventListener('mousedown', handleClickOutside, true)
  }, [])

  const selected = COUNTRY_CODES.find((c) => c.code === value) || COUNTRY_CODES[0]

  function toggleOpen() {
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect()
      setOpenUpward(window.innerHeight - rect.bottom < 260)
    }
    setOpen((o) => !o)
  }

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        disabled={!editing}
        onClick={toggleOpen}
        className={t(isDark,
          `flex items-center gap-1 text-sm font-medium text-slate-200 ${editing ? 'cursor-pointer hover:text-white' : 'cursor-default'}`,
          `flex items-center gap-1 text-sm font-medium text-slate-800 ${editing ? 'cursor-pointer hover:text-slate-900' : 'cursor-default'}`
        )}
      >
        <FlagIcon country={selected.id} size={18} />
        <span>{selected.code}</span>
        {editing && <Icon size={12}><path d={open ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'} /></Icon>}
      </button>
      {open && editing && (
        <div
          className={t(isDark,
            `absolute left-0 ${openUpward ? 'bottom-full mb-2' : 'top-full mt-2'} w-52 max-h-56 overflow-y-auto bg-[#0a0a0f] border border-white/10 rounded-xl shadow-xl p-1.5 z-30`,
            `absolute left-0 ${openUpward ? 'bottom-full mb-2' : 'top-full mt-2'} w-52 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 z-30`
          )}
        >
          {COUNTRY_CODES.map((c) => (
            <button
              key={c.code + c.name}
              type="button"
              onClick={() => { onChange(c.code); setOpen(false) }}
              className={t(isDark,
                `w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm text-left hover:bg-white/5 ${c.code === value ? 'text-blue-300' : 'text-slate-300'}`,
                `w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm text-left hover:bg-slate-50 ${c.code === value ? 'text-blue-600' : 'text-slate-600'}`
              )}
            >
              <FlagIcon country={c.id} size={18} />
              <span>{c.code}</span>
              <span className="text-xs text-slate-500 truncate">{c.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function RowShell({ isDark, icon, children }) {
  return (
    <div className={t(isDark,
      'flex items-center gap-3 px-3 py-3 rounded-xl border border-white/10',
      'flex items-center gap-3 px-3 py-3 rounded-xl border border-slate-200'
    )}>
      <span className={t(isDark, 'w-9 h-9 rounded-full bg-[#16171c] flex items-center justify-center text-slate-400 shrink-0', 'w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0')}>
        <Icon size={15}>{icon}</Icon>
      </span>
      {children}
    </div>
  )
}

function ContactRow({ isDark, icon, label, value, editing, onChange, placeholder, verified }) {
  const { translate } = useLanguage()
  return (
    <RowShell isDark={isDark} icon={icon}>
      <div className="flex-1 min-w-0">
        <p className={t(isDark, 'text-xs text-slate-400', 'text-xs text-slate-500')}>{label}</p>
        {onChange ? (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={!editing}
            className={t(isDark,
              'w-full bg-transparent text-sm font-medium text-slate-100 placeholder-slate-500 focus:outline-none',
              'w-full bg-transparent text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none'
            )}
          />
        ) : (
          <p className={t(isDark, 'text-sm font-medium text-slate-100 truncate', 'text-sm font-medium text-slate-900 truncate')}>{value}</p>
        )}
      </div>
      {verified !== undefined && (
        verified ? (
          <span className={t(isDark, 'shrink-0 text-xs font-medium px-2 py-1 rounded-full bg-emerald-400/10 text-emerald-300', 'shrink-0 text-xs font-medium px-2 py-1 rounded-full bg-emerald-100 text-emerald-700')}>
            {translate('profile_verified')}
          </span>
        ) : (
          <span className={t(isDark, 'shrink-0 text-xs font-medium px-2 py-1 rounded-full bg-white/5 text-slate-400', 'shrink-0 text-xs font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-500')}>
            {translate('profile_unverified')}
          </span>
        )
      )}
    </RowShell>
  )
}

function MobileRow({ isDark, editing, countryCode, onCountryChange, value, onChange }) {
  const { translate } = useLanguage()
  const icon = <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z" />
  return (
    <RowShell isDark={isDark} icon={icon}>
      <div className="flex-1 min-w-0">
        <p className={t(isDark, 'text-xs text-slate-400', 'text-xs text-slate-500')}>{translate('profile_mobile')}</p>
        <div className="flex items-center gap-2">
          <CountryCodeDropdown isDark={isDark} value={countryCode} onChange={onCountryChange} editing={editing} />
          <span className={t(isDark, 'text-slate-600', 'text-slate-300')}>·</span>
          <input
            type="tel"
            inputMode="numeric"
            value={value}
            onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder={translate('profile_not_set')}
            disabled={!editing}
            className={t(isDark,
              'flex-1 min-w-0 bg-transparent text-sm font-medium text-slate-100 placeholder-slate-500 focus:outline-none',
              'flex-1 min-w-0 bg-transparent text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none'
            )}
          />
        </div>
      </div>
    </RowShell>
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

function ExpandableRow({ isDark, icon, title, subtitle, open, onToggle, children }) {
  return (
    <div className={t(isDark,
      'rounded-xl border border-white/10 overflow-hidden',
      'rounded-xl border border-slate-200 overflow-hidden'
    )}>
      <button
        type="button"
        onClick={onToggle}
        className={t(isDark,
          'w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-white/5 transition-colors',
          'w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-slate-50 transition-colors'
        )}
      >
        <span className={t(isDark, 'w-9 h-9 rounded-full bg-[#16171c] flex items-center justify-center text-slate-400 shrink-0', 'w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0')}>
          <Icon size={15}>{icon}</Icon>
        </span>
        <div className="flex-1 min-w-0">
          <p className={t(isDark, 'text-sm font-medium text-slate-100', 'text-sm font-medium text-slate-900')}>{title}</p>
          <p className={t(isDark, 'text-xs text-slate-400', 'text-xs text-slate-500')}>{subtitle}</p>
        </div>
        <span className={t(isDark, 'text-slate-500', 'text-slate-400')}>
          <Icon size={16}><path d={open ? 'M18 15l-6-6-6 6' : 'M9 18l6-6-6-6'} /></Icon>
        </span>
      </button>
      {open && (
        <div className={t(isDark, 'px-3 pb-4 pt-1 border-t border-white/10', 'px-3 pb-4 pt-1 border-t border-slate-200')}>
          {children}
        </div>
      )}
    </div>
  )
}

function InlineMessage({ type, text }) {
  if (!text) return null
  return (
    <p className={`text-xs mt-2 ${type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>{text}</p>
  )
}

function panelInputClass(isDark) {
  return t(isDark,
    'w-full bg-[#16171c] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-400/50 transition-colors',
    'w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-400 transition-colors'
  )
}

function panelButtonClass(isDark) {
  return 'bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50'
}

function PasswordVisibilityToggle({ isDark, visible, onToggle }) {
  return (
    <button
      type="button"
      tabIndex={-1}
      onClick={onToggle}
      title={visible ? 'Hide password' : 'Show password'}
      className={t(isDark,
        'absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 transition-colors',
        'absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors'
      )}
    >
      {visible ? (
        <Icon size={16}><path d="M17.94 17.94A10.94 10.94 0 0112 20c-7 0-11-8-11-8a19.68 19.68 0 015.06-5.94M9.9 4.24A10.94 10.94 0 0112 4c7 0 11 8 11 8a19.65 19.65 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><path d="M1 1l22 22" /></Icon>
      ) : (
        <Icon size={16}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></Icon>
      )}
    </button>
  )
}

function PasswordPanel({ isDark, email, onActivity }) {
  const { translate } = useLanguage()
  const [step, setStep] = useState('verify') // 'verify' | 'change'
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  async function handleVerify() {
    setMessage(null)
    if (!currentPassword) {
      setMessage({ type: 'error', text: translate('profile_enter_current_password') })
      return
    }
    setSaving(true)
    // Supabase has no standalone "check this password" call, so re-signing-in
    // with the current password is how we confirm it's really the account owner.
    const { error } = await supabase.auth.signInWithPassword({ email, password: currentPassword })
    setSaving(false)
    if (error) {
      setMessage({ type: 'error', text: translate('profile_current_password_incorrect') })
      return
    }
    setStep('change')
  }

  function handleBack() {
    setStep('verify')
    setNewPassword('')
    setConfirmPassword('')
    setMessage(null)
  }

  async function handleSave() {
    setMessage(null)
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: translate('profile_password_too_short') })
      return
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: translate('profile_passwords_no_match') })
      return
    }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSaving(false)
    if (error) {
      setMessage({ type: 'error', text: error.message })
      return
    }
    setMessage({ type: 'success', text: translate('profile_password_updated') })
    setStep('verify')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    onActivity?.('Changed password')
  }

  if (step === 'verify') {
    return (
      <div className="flex flex-col gap-3 pt-3">
        <p className={t(isDark, 'text-xs text-slate-500', 'text-xs text-slate-400')}>
          {translate('profile_confirm_it_you')}
        </p>
        <div className="relative">
          <input
            type={showCurrent ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
            placeholder={translate('profile_current_password')}
            autoComplete="new-password"
            className={panelInputClass(isDark) + ' pr-10'}
          />
          <PasswordVisibilityToggle isDark={isDark} visible={showCurrent} onToggle={() => setShowCurrent((v) => !v)} />
        </div>
        <button type="button" onClick={handleVerify} disabled={saving} className={`self-start ${panelButtonClass(isDark)}`}>
          {saving ? translate('profile_confirming') : translate('profile_confirm_btn')}
        </button>
        <InlineMessage type={message?.type} text={message?.text} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 pt-3">
      <div className={t(isDark, 'flex items-center gap-1.5 text-xs text-emerald-400', 'flex items-center gap-1.5 text-xs text-emerald-600')}>
        <Icon size={14}><path d="M20 6L9 17l-5-5" /></Icon>
        {translate('profile_identity_confirmed')}
      </div>
      <div className="relative">
        <input
          type={showNew ? 'text' : 'password'}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder={translate('profile_new_password')}
          autoComplete="new-password"
          className={panelInputClass(isDark) + ' pr-10'}
        />
        <PasswordVisibilityToggle isDark={isDark} visible={showNew} onToggle={() => setShowNew((v) => !v)} />
      </div>
      <div className="relative">
        <input
          type={showConfirm ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onPaste={(e) => e.preventDefault()}
          placeholder={translate('profile_confirm_new_password')}
          autoComplete="new-password"
          className={panelInputClass(isDark) + ' pr-10'}
        />
        <PasswordVisibilityToggle isDark={isDark} visible={showConfirm} onToggle={() => setShowConfirm((v) => !v)} />
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={handleSave} disabled={saving} className={panelButtonClass(isDark)}>
          {saving ? translate('profile_updating') : translate('profile_update_password_btn')}
        </button>
        <button
          type="button"
          onClick={handleBack}
          disabled={saving}
          className={t(isDark, 'text-sm text-slate-400 hover:text-slate-100', 'text-sm text-slate-500 hover:text-slate-900')}
        >
          {translate('profile_2fa_cancel')}
        </button>
      </div>
      <InlineMessage type={message?.type} text={message?.text} />
    </div>
  )
}

function TwoFactorPanel({ isDark, onActivity }) {
  const { translate } = useLanguage()
  const [factors, setFactors] = useState(null)
  const [enrollData, setEnrollData] = useState(null)
  const [verifyCode, setVerifyCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    refreshFactors()
  }, [])

  async function refreshFactors() {
    const { data, error } = await supabase.auth.mfa.listFactors()
    if (!error) setFactors(data.totp || [])
  }

  async function startEnroll() {
    setMessage(null)
    setBusy(true)
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
    setBusy(false)
    if (error) {
      setMessage({ type: 'error', text: error.message })
      return
    }
    setEnrollData(data)
  }

  async function verifyEnroll() {
    if (!enrollData) return
    setBusy(true)
    setMessage(null)
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: enrollData.id })
    if (challengeError) {
      setBusy(false)
      setMessage({ type: 'error', text: challengeError.message })
      return
    }
    const { error: verifyError } = await supabase.auth.mfa.verify({ factorId: enrollData.id, challengeId: challenge.id, code: verifyCode })
    setBusy(false)
    if (verifyError) {
      setMessage({ type: 'error', text: verifyError.message })
      return
    }
    setMessage({ type: 'success', text: translate('profile_2fa_enabled_msg') })
    setEnrollData(null)
    setVerifyCode('')
    refreshFactors()
    onActivity?.('Enabled two-factor authentication')
  }

  async function cancelEnroll() {
    if (enrollData) await supabase.auth.mfa.unenroll({ factorId: enrollData.id })
    setEnrollData(null)
    setVerifyCode('')
    setMessage(null)
  }

  async function handleUnenroll(factorId) {
    setBusy(true)
    const { error } = await supabase.auth.mfa.unenroll({ factorId })
    setBusy(false)
    if (error) {
      setMessage({ type: 'error', text: error.message })
      return
    }
    setMessage({ type: 'success', text: translate('profile_2fa_disabled_msg') })
    refreshFactors()
    onActivity?.('Disabled two-factor authentication')
  }

  const verifiedFactor = factors?.find((f) => f.status === 'verified')

  if (factors === null) {
    return <p className={t(isDark, 'text-sm text-slate-500 pt-3', 'text-sm text-slate-400 pt-3')}>{translate('profile_2fa_loading')}</p>
  }

  if (verifiedFactor) {
    return (
      <div className="flex flex-col gap-2 pt-3">
        <p className={t(isDark, 'text-sm text-emerald-400', 'text-sm text-emerald-600')}>{translate('profile_2fa_is_enabled')}</p>
        <button
          type="button"
          onClick={() => handleUnenroll(verifiedFactor.id)}
          disabled={busy}
          className={t(isDark,
            'self-start text-sm font-medium bg-red-500/15 text-red-300 px-4 py-2 rounded-lg hover:bg-red-500/25 disabled:opacity-50 transition-colors',
            'self-start text-sm font-medium bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 disabled:opacity-50 transition-colors'
          )}
        >
          {busy ? translate('profile_2fa_removing') : translate('profile_2fa_disable_btn')}
        </button>
        <InlineMessage type={message?.type} text={message?.text} />
      </div>
    )
  }

  if (enrollData) {
    return (
      <div className="flex flex-col gap-3 pt-3">
        <p className={t(isDark, 'text-sm text-slate-400', 'text-sm text-slate-500')}>
          {translate('profile_2fa_scan_qr')}
        </p>
        <div className="bg-white p-3 rounded-lg self-start" dangerouslySetInnerHTML={{ __html: enrollData.totp.qr_code }} />
        <p className={t(isDark, 'text-xs text-slate-500 font-mono break-all', 'text-xs text-slate-400 font-mono break-all')}>
          {enrollData.totp.secret}
        </p>
        <input
          type="text"
          inputMode="numeric"
          value={verifyCode}
          onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder={translate('profile_2fa_code_placeholder')}
          className={panelInputClass(isDark) + ' max-w-[160px]'}
        />
        <div className="flex items-center gap-2">
          <button type="button" onClick={verifyEnroll} disabled={busy || verifyCode.length !== 6} className={panelButtonClass(isDark)}>
            {busy ? translate('profile_2fa_verifying') : translate('profile_2fa_verify_enable')}
          </button>
          <button
            type="button"
            onClick={cancelEnroll}
            className={t(isDark, 'text-sm text-slate-400 hover:text-slate-100 px-3 py-2', 'text-sm text-slate-500 hover:text-slate-900 px-3 py-2')}
          >
            {translate('profile_2fa_cancel')}
          </button>
        </div>
        <InlineMessage type={message?.type} text={message?.text} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 pt-3">
      <p className={t(isDark, 'text-sm text-slate-400', 'text-sm text-slate-500')}>
        {translate('profile_2fa_add_layer')}
      </p>
      <button type="button" onClick={startEnroll} disabled={busy} className={`self-start ${panelButtonClass(isDark)}`}>
        {busy ? translate('profile_2fa_starting') : translate('profile_2fa_setup_btn')}
      </button>
      <InlineMessage type={message?.type} text={message?.text} />
    </div>
  )
}

function AvatarCropModal({ isDark, imageUrl, onCancel, onConfirm }) {
  const CONTAINER = 300 // whole-image backdrop, blurred outside the circle
  const CIRCLE = 200 // the actual crop selection, always fully covered by image
  const OUTPUT = 320 // exported avatar resolution
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [naturalSize, setNaturalSize] = useState(null)
  const dragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0, offX: 0, offY: 0 })
  const imgRef = useRef(null)

  function handleImgLoad() {
    const img = imgRef.current
    setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight })
  }

  // "Contain" fit: the whole image is visible at scale=1 (nothing pre-cropped).
  // Zooming in (scale > 1) is what starts narrowing down to just the circle.
  const fitScale = naturalSize ? Math.min(CONTAINER / naturalSize.w, CONTAINER / naturalSize.h) : 1
  const baseW = naturalSize ? naturalSize.w * fitScale : CONTAINER
  const baseH = naturalSize ? naturalSize.h * fitScale : CONTAINER

  // Keeps the circle always fully covered by image content — scale never
  // goes below "whole image visible" and pan never drags the image so far
  // that the circle would show empty space.
  function clampOffset(off, s) {
    const maxX = Math.max(0, (baseW * s - CIRCLE) / 2)
    const maxY = Math.max(0, (baseH * s - CIRCLE) / 2)
    return {
      x: Math.min(maxX, Math.max(-maxX, off.x)),
      y: Math.min(maxY, Math.max(-maxY, off.y)),
    }
  }

  function onPointerDown(e) {
    dragging.current = true
    dragStart.current = { x: e.clientX, y: e.clientY, offX: offset.x, offY: offset.y }
  }
  function onPointerMove(e) {
    if (!dragging.current) return
    const next = {
      x: dragStart.current.offX + (e.clientX - dragStart.current.x),
      y: dragStart.current.offY + (e.clientY - dragStart.current.y),
    }
    setOffset(clampOffset(next, scale))
  }
  function onPointerUp() {
    dragging.current = false
  }
  function onWheel(e) {
    e.preventDefault()
    const nextScale = Math.min(4, Math.max(1, scale - e.deltaY * 0.0015))
    setScale(nextScale)
    setOffset((prev) => clampOffset(prev, nextScale))
  }
  function handleScaleInput(nextScale) {
    setScale(nextScale)
    setOffset((prev) => clampOffset(prev, nextScale))
  }

  function handleConfirm() {
    if (!naturalSize) return
    const canvas = document.createElement('canvas')
    canvas.width = OUTPUT
    canvas.height = OUTPUT
    const ctx = canvas.getContext('2d')
    ctx.save()
    ctx.beginPath()
    ctx.arc(OUTPUT / 2, OUTPUT / 2, OUTPUT / 2, 0, Math.PI * 2)
    ctx.clip()

    const ratio = OUTPUT / CIRCLE
    const drawW = baseW * scale * ratio
    const drawH = baseH * scale * ratio
    const drawX = OUTPUT / 2 + offset.x * ratio - drawW / 2
    const drawY = OUTPUT / 2 + offset.y * ratio - drawH / 2

    ctx.drawImage(imgRef.current, drawX, drawY, drawW, drawH)
    ctx.restore()

    // A data URL (not a blob URL) so the avatar survives a page refresh
    // once it's persisted to localStorage.
    onConfirm(canvas.toDataURL('image/png'))
  }

  const imgTransformStyle = {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: baseW,
    height: baseH,
    transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
    pointerEvents: 'none',
    maxWidth: 'none',
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[60]"
      onMouseMove={onPointerMove}
      onMouseUp={onPointerUp}
      onMouseLeave={onPointerUp}
    >
      <div className={t(isDark,
        'bg-[#0a0a0f] border border-white/10 rounded-2xl p-6 w-full max-w-sm',
        'bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-sm shadow-sm'
      )}>
        <p className={t(isDark, 'text-slate-100 font-semibold mb-1', 'text-slate-900 font-semibold mb-1')}>Adjust Photo</p>
        <p className={t(isDark, 'text-xs text-slate-400 mb-4', 'text-xs text-slate-500 mb-4')}>Drag to reposition, scroll or use the slider to zoom.</p>
        <div
          className="relative mx-auto rounded-xl overflow-hidden cursor-move select-none bg-black"
          style={{ width: CONTAINER, height: CONTAINER }}
          onMouseDown={onPointerDown}
          onWheel={onWheel}
        >
          {/* Blurred backdrop — the whole picture, for context */}
          <img
            ref={imgRef}
            src={imageUrl}
            onLoad={handleImgLoad}
            draggable={false}
            alt=""
            style={{ ...imgTransformStyle, filter: 'blur(10px) brightness(0.5)' }}
          />
          <div className="absolute inset-0 bg-black/25" />
          {/* Sharp circular window — exactly what gets saved */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative rounded-full overflow-hidden ring-2 ring-white/90 shadow-xl" style={{ width: CIRCLE, height: CIRCLE }}>
              <img src={imageUrl} draggable={false} alt="" style={imgTransformStyle} />
            </div>
          </div>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <Icon size={14}><circle cx="12" cy="12" r="3" /><path d="M19 12h2M3 12h2M12 3v2M12 19v2" /></Icon>
          <input
            type="range"
            min="1"
            max="4"
            step="0.02"
            value={scale}
            onChange={(e) => handleScaleInput(Number(e.target.value))}
            className="flex-1 accent-blue-500"
          />
          <Icon size={20}><circle cx="12" cy="12" r="3" /><path d="M19 12h2M3 12h2M12 3v2M12 19v2" /></Icon>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className={t(isDark, 'text-sm text-slate-400 hover:text-slate-100 px-4 py-2', 'text-sm text-slate-500 hover:text-slate-900 px-4 py-2')}
          >
            Cancel
          </button>
          <button type="button" onClick={handleConfirm} className={panelButtonClass(isDark)}>
            Save Photo
          </button>
        </div>
      </div>
    </div>
  )
}


export default function ProfilePage({ isDark, session, photoUrl, onPhotoChange, username, onUsernameChange, color, onActivity }) {
  const { translate } = useLanguage()
  const [isEditing, setIsEditing] = useState(false)

  // Persisted locally (per-account) since there's no profiles table yet to
  // sync this to a backend — survives refresh, but only on this browser.
  const storageKey = `orbit_profile_details_${session.user.id}`
  const saved = (() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || 'null') || {}
    } catch {
      return {}
    }
  })()

  const [firstName, setFirstName] = useState(() => saved.firstName ?? (getDisplayName(session.user.email).split(' ')[0] || ''))
  const [lastName, setLastName] = useState(() => saved.lastName ?? getDisplayName(session.user.email).split(' ').slice(1).join(' '))
  const [dob, setDob] = useState(() => saved.dob ?? '')
  const [countryCode, setCountryCode] = useState(() => saved.countryCode ?? '+63')
  const [mobile, setMobile] = useState(() => saved.mobile ?? '')
  const [address, setAddress] = useState(() => saved.address ?? '')

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        firstName, lastName, dob, countryCode, mobile, address,
      }))
    } catch {
      // localStorage can throw (quota exceeded, private browsing) — persistence is best-effort.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstName, lastName, dob, countryCode, mobile, address])

  const [openSecurityPanel, setOpenSecurityPanel] = useState(null) // null | 'password' | '2fa'

  const [pendingImageUrl, setPendingImageUrl] = useState(null)
  const [photoError, setPhotoError] = useState('')
  const fileInputRef = useRef(null)

  const MAX_PHOTO_BYTES = 8 * 1024 * 1024 // 8MB — generous for a phone photo, small enough that a bad file can't hang the crop canvas
  const ALLOWED_PHOTO_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

  function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPhotoError('')

    // `accept="image/*"` on the input is only a UI hint — the browser file
    // picker doesn't enforce it, so anything selected still needs checking
    // here before it's treated as an image.
    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      setPhotoError(translate('profile_photo_invalid_type'))
      return
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError(translate('profile_photo_too_large'))
      return
    }

    setPendingImageUrl(URL.createObjectURL(file))
  }

  function handleCropCancel() {
    if (pendingImageUrl) URL.revokeObjectURL(pendingImageUrl)
    setPendingImageUrl(null)
  }

  function handleCropConfirm(croppedDataUrl) {
    if (pendingImageUrl) URL.revokeObjectURL(pendingImageUrl)
    setPendingImageUrl(null)
    onPhotoChange(croppedDataUrl)
  }

  const emailVerified = !!session.user.email_confirmed_at
  const displayName = `${firstName} ${lastName}`.trim() || getDisplayName(session.user.email)

  return (
    <div>
      <div className={t(isDark,
        'relative overflow-hidden rounded-2xl border border-white/10 p-6 md:p-8 mb-6',
        'relative overflow-hidden rounded-2xl border border-slate-200 p-6 md:p-8 mb-6'
      )}>
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              {photoUrl ? (
                <img src={photoUrl} alt="Profile" className="w-20 h-20 rounded-2xl object-cover" />
              ) : (
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${AVATAR_COLORS[color] || AVATAR_COLORS[0]} flex items-center justify-center text-3xl font-bold text-white`}>
                  {(username || session.user.email || 'G')[0].toUpperCase()}
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              <button
                type="button"
                title="Change photo"
                onClick={() => fileInputRef.current?.click()}
                className={t(isDark,
                  'absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-[#16171c] border border-white/10 flex items-center justify-center text-slate-300 hover:text-slate-100 transition-colors',
                  'absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors'
                )}
              >
                <Icon size={13}>
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </Icon>
              </button>
            </div>
            <div>
              <h1 className={t(isDark, 'text-2xl font-bold text-slate-100', 'text-2xl font-bold text-slate-900')}>{displayName}</h1>
              <p className={t(isDark, 'text-sm text-slate-400', 'text-sm text-slate-500')}>{session.user.email || translate('guest_account_label')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsEditing((e) => { if (e) onActivity?.('Updated profile details'); return !e })}
            className={t(isDark,
              'flex items-center gap-1.5 text-sm font-medium bg-[#16171c] border border-white/10 text-slate-200 px-4 py-2 rounded-xl hover:bg-[#25262e] transition-colors',
              'flex items-center gap-1.5 text-sm font-medium bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors'
            )}
          >
            <Icon size={14}><path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></Icon>
            {isEditing ? translate('profile_done_editing') : translate('profile_edit')}
          </button>
        </div>
        {photoError && <p className="text-red-400 text-xs mt-3">{photoError}</p>}
      </div>

      <div className="flex flex-col gap-6 max-w-2xl">
          <SectionCard isDark={isDark} title={translate('profile_section_personal')}>
            <div className="grid sm:grid-cols-2 gap-4">
              <FieldInput isDark={isDark} label={translate('profile_first_name')} value={firstName} onChange={setFirstName} editing={isEditing} placeholder={translate('profile_first_name')} />
              <FieldInput isDark={isDark} label={translate('profile_last_name')} value={lastName} onChange={setLastName} editing={isEditing} placeholder={translate('profile_last_name')} />
              <FieldInput isDark={isDark} label={translate('profile_username')} value={username} onChange={onUsernameChange} editing={isEditing} placeholder={translate('profile_not_set')} />
              <DOBField isDark={isDark} value={dob} onChange={(v) => setDob(formatDOB(v))} editing={isEditing} />
            </div>
          </SectionCard>

          <SectionCard isDark={isDark} title={translate('profile_section_contact')}>
            <div className="flex flex-col gap-2.5">
              <ContactRow
                isDark={isDark}
                icon={<><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 6l-10 7L2 6" /></>}
                label={translate('profile_email')}
                value={session.user.email || translate('guest_no_email')}
                verified={session.user.email ? emailVerified : undefined}
              />
              <MobileRow isDark={isDark} editing={isEditing} countryCode={countryCode} onCountryChange={setCountryCode} value={mobile} onChange={setMobile} />
              <ContactRow isDark={isDark} icon={<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></>} label={translate('profile_address')} value={address} editing={isEditing} onChange={setAddress} placeholder={translate('profile_not_set')} />
            </div>
          </SectionCard>

          <SectionCard isDark={isDark} title={translate('profile_section_security')}>
            <div className="flex flex-col gap-2.5">
              <ExpandableRow
                isDark={isDark}
                icon={<><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></>}
                title={translate('profile_password_title')}
                subtitle={translate('profile_password_subtitle')}
                open={openSecurityPanel === 'password'}
                onToggle={() => setOpenSecurityPanel((p) => (p === 'password' ? null : 'password'))}
              >
                {session.user.email ? (
                  <PasswordPanel isDark={isDark} email={session.user.email} onActivity={onActivity} />
                ) : (
                  <p className={t(isDark, 'text-sm text-slate-400 px-1 py-2', 'text-sm text-slate-500 px-1 py-2')}>
                    {translate('guest_password_locked')}
                  </p>
                )}
              </ExpandableRow>
              <ExpandableRow
                isDark={isDark}
                icon={<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />}
                title={translate('profile_2fa_title')}
                subtitle={translate('profile_2fa_subtitle')}
                open={openSecurityPanel === '2fa'}
                onToggle={() => setOpenSecurityPanel((p) => (p === '2fa' ? null : '2fa'))}
              >
                <TwoFactorPanel isDark={isDark} onActivity={onActivity} />
              </ExpandableRow>
            </div>
          </SectionCard>
      </div>

      {pendingImageUrl && (
        <AvatarCropModal
          isDark={isDark}
          imageUrl={pendingImageUrl}
          onCancel={handleCropCancel}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  )
}
