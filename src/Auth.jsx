import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { useLanguage } from './i18n'
import { AVATAR_COLORS, AVATAR_ACCENT_HEX } from './avatarColors'
import loginIllustration from './assets/login page new bg.png'

const FIELD_ERROR_LIFETIME = 3500

// Anchored under a field instead of the browser's own native validation
// bubble — that one can't be restyled and looks out of place next to the
// rest of the glass UI. Auto-dismisses so it reads as a nudge, not a
// blocking wall of red.
function FieldError({ message }) {
  if (!message) return null
  return (
    <div
      className="absolute left-0 top-full mt-2 z-20 glass-dark rounded-lg px-3 py-2 text-sm text-white/90"
      style={{ animation: 'dropdown-in 140ms ease-out' }}
    >
      {message}
    </div>
  )
}

// "Orbit" stays in the cursive wordmark font even when the surrounding
// sentence switches to the body font, so the brand name still stands out.
function withCursiveOrbit(text) {
  const idx = text.indexOf('Orbit')
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <span className="font-dancing">Orbit</span>
      {text.slice(idx + 5)}
    </>
  )
}

function LogoMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="9" fill="url(#handa-grad-auth)" />
      <path d="M11 9v14M21 9v14M11 16h10" stroke="#0f172a" strokeWidth="2.4" strokeLinecap="round" />
      <defs>
        <linearGradient id="handa-grad-auth" x1="0" y1="0" x2="32" y2="32">
          <stop stopColor="#818cf8" />
          <stop offset="1" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// `accentHex` lets the signup color step preview itself, live, in whatever
// color the user just picked, instead of always rendering the app's default
// blue regardless of their choice. Tinted liquid glass either way — a
// translucent, blurred fill with a bright inset rim — rather than a flat
// color block.
function FillButton({ children, type = 'button', onClick, disabled, className = '', accentHex }) {
  const tint = accentHex || { 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb' }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        borderColor: `${tint[400]}66`,
        backgroundColor: `${tint[600]}4d`,
        boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.3), 0 10px 24px -10px ${tint[500]}66`,
      }}
      className={`glass-interactive relative rounded-lg font-semibold text-white border backdrop-blur-xl backdrop-saturate-150
        disabled:opacity-60
        ${className}`}
    >
      {children}
    </button>
  )
}

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 7l10 6 10-6" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  )
}

function EyeIcon({ open }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.94 10.94 0 0112 20c-7 0-11-8-11-8a20.3 20.3 0 015.06-5.94M9.9 4.24A10.94 10.94 0 0112 4c7 0 11 8 11 8a20.3 20.3 0 01-3.22 4.34M1 1l22 22" />
      <path d="M14.12 14.12a3 3 0 11-4.24-4.24" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.48a5.54 5.54 0 01-2.4 3.63v3h3.88c2.27-2.09 3.56-5.17 3.56-8.81z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.92l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11A12 12 0 0012 24z" />
      <path fill="#FBBC05" d="M5.27 14.27a7.2 7.2 0 010-4.54V6.62H1.27a12 12 0 000 10.76l4-3.11z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 001.27 6.62l4 3.11C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
  )
}

export default function Auth({ defaultMode = 'login', prefillEmail = '', isGuestUpgrade = false, onCancelGuestUpgrade, onGuestStart, guestError = '' }) {
  const { translate } = useLanguage()
  const [email, setEmail] = useState(prefillEmail)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSignUp, setIsSignUp] = useState(isGuestUpgrade || defaultMode === 'signup')
  const [errorMsg, setErrorMsg] = useState('')
  const [infoMsg, setInfoMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [fieldError, setFieldError] = useState(null) // { field: 'email' | 'password', message }
  const [startingDashboard, setStartingDashboard] = useState(false)

  useEffect(() => {
    if (!fieldError) return
    const timer = setTimeout(() => setFieldError(null), FIELD_ERROR_LIFETIME)
    return () => clearTimeout(timer)
  }, [fieldError])

  // Signup only: a short "build your profile" step before email/password.
  // Letting people choose a username and color first — before they've
  // committed to anything — makes the account already feel a little bit
  // theirs, so finishing signup feels like continuing, not starting over.
  const [profileStep, setProfileStep] = useState(!isGuestUpgrade)
  const [chosenUsername, setChosenUsername] = useState('')
  const [chosenColor, setChosenColor] = useState(0)

  function startSignUp() {
    setIsSignUp(true)
    setProfileStep(true)
    setErrorMsg('')
    setInfoMsg('')
  }

  function backToLogin() {
    setIsSignUp(false)
    setErrorMsg('')
    setInfoMsg('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setInfoMsg('')
    setFieldError(null)

    if (!email.trim()) {
      setFieldError({ field: 'email', message: translate('auth_error_email_required') })
      return
    }
    if (!email.includes('@')) {
      setFieldError({ field: 'email', message: translate('auth_error_email_invalid') })
      return
    }
    if (!password) {
      setFieldError({ field: 'password', message: translate('auth_error_password_required') })
      return
    }

    setLoading(true)

    if (isSignUp) {
      // A guest is already signed in with a real (anonymous) user id and
      // real data attached to it. Upgrading that session in place with
      // updateUser keeps everything they've already added; signUp would
      // instead create a brand new, empty account and orphan the old one.
      const { data, error } = isGuestUpgrade
        ? await supabase.auth.updateUser({ email, password })
        : await supabase.auth.signUp({ email, password })
      if (error) {
        setErrorMsg(error.message)
      } else if (data?.user?.id) {
        // Written now so it's already in place by the time the dashboard
        // mounts — the identity they built in the profile step carries
        // straight through instead of resetting to defaults.
        try {
          localStorage.setItem(
            `handa_profile_meta_${data.user.id}`,
            JSON.stringify({ photo: null, username: chosenUsername.trim(), color: chosenColor })
          )
          localStorage.setItem('handa_last_email', email)
        } catch {
          // best-effort persistence
        }
        if (isGuestUpgrade) {
          setInfoMsg(translate('auth_guest_upgrade_success'))
        } else if (!data.session) {
          // No session back means Supabase is holding the account for email
          // confirmation before it's usable — without this, submitting just
          // silently does nothing from the user's point of view.
          setInfoMsg(translate('auth_confirm_email_sent'))
        }
      }
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setErrorMsg(error.message)
    } else {
      try {
        localStorage.setItem('handa_last_email', email)
      } catch {
        // best-effort persistence
      }
    }
    setLoading(false)
  }

  const handleForgotPassword = async () => {
    setErrorMsg('')
    setInfoMsg('')
    if (!email) {
      setErrorMsg(translate('auth_enter_email_first'))
      return
    }
    // Orbit sends this itself (branded, via the same Resend setup as
    // reminder emails) instead of Supabase's own default reset email.
    const { error } = await supabase.functions.invoke('send-password-reset', {
      body: { email, redirectTo: window.location.origin },
    })
    if (error) {
      setErrorMsg(error.message)
    } else {
      setInfoMsg(translate('auth_check_email_link'))
    }
  }

  const handleGoogleSignIn = async () => {
    setErrorMsg('')
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' })
    if (error) setErrorMsg(error.message)
  }

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-[#0a0a0f]">
      {/* Illustration behind the entire page, not just one side — hidden on
          mobile (as before) where there's no room for it to read as
          anything but noise behind the form. */}
      <img src={loginIllustration} alt="" className="hidden md:block absolute inset-0 w-full h-full object-cover" />
      <div
        className="hidden md:block absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(90deg, rgba(10,10,15,0.15) 0%, rgba(10,10,15,0.6) 55%, rgba(10,10,15,0.9) 100%)' }}
      />

      {/* Form, anchored to the right like the reference design */}
      <div className="relative min-h-screen w-full flex items-center justify-center md:justify-end px-6 md:px-16 lg:px-24 py-16">
        <div className="w-full max-w-sm">
          {isSignUp && profileStep ? (
            <>
              <button
                onClick={backToLogin}
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300 mb-6"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                {translate('auth_toggle_login')}
              </button>

              <div className="text-center mb-8">
                <h2 className="text-3xl font-semibold text-white mb-2">{translate('auth_get_started')}</h2>
                <p className="text-slate-400">{translate('auth_profile_step_subtitle')}</p>
              </div>

              <div className="flex flex-col gap-6">
                <div>
                  <label
                    className="text-sm font-medium mb-1.5 block transition-colors duration-300"
                    style={{ color: AVATAR_ACCENT_HEX[chosenColor][400] }}
                  >
                    {translate('auth_username_label')}
                  </label>
                  <input
                    type="text"
                    maxLength={40}
                    placeholder={translate('auth_username_placeholder')}
                    value={chosenUsername}
                    onChange={(e) => setChosenUsername(e.target.value)}
                    className="w-full glass-dark-sm rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-white/30 transition-colors"
                  />
                </div>

                <div>
                  <label
                    className="text-sm font-medium mb-2.5 block transition-colors duration-300"
                    style={{ color: AVATAR_ACCENT_HEX[chosenColor][400] }}
                  >
                    {translate('auth_color_label')}
                  </label>
                  <div className="flex items-center gap-3">
                    {AVATAR_COLORS.map((gradient, i) => (
                      <button
                        key={gradient}
                        type="button"
                        onClick={() => setChosenColor(i)}
                        aria-label={`Color ${i + 1}`}
                        className={`glass-interactive w-9 h-9 rounded-full bg-gradient-to-br ${gradient} ${
                          chosenColor === i ? 'ring-2 ring-offset-2 ring-offset-[#0a0a0f] ring-white' : ''
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Lets them see the color at work, not just pick a swatch: a
                    tiny preview of the nav pill and button they'll actually see
                    once they're inside the dashboard. */}
                <div className="glass-dark rounded-xl p-3 flex items-center gap-3 transition-colors duration-300">
                  <div
                    className={`w-9 h-9 rounded-full bg-gradient-to-br ${AVATAR_COLORS[chosenColor]} flex items-center justify-center text-xs font-semibold text-white shrink-0`}
                  >
                    {(chosenUsername.trim()[0] || 'H').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className="h-2 w-20 rounded-full mb-1.5 transition-colors duration-300"
                      style={{ backgroundColor: AVATAR_ACCENT_HEX[chosenColor][500] }}
                    />
                    <div className="h-1.5 w-28 rounded-full bg-white/10" />
                  </div>
                  <span
                    className="text-[11px] font-semibold text-white px-3 py-1.5 rounded-lg shrink-0 transition-colors duration-300"
                    style={{ backgroundColor: AVATAR_ACCENT_HEX[chosenColor][600] }}
                  >
                    {translate('card_add_document')}
                  </span>
                </div>

                <FillButton
                  onClick={async () => {
                    setStartingDashboard(true)
                    await onGuestStart?.({ username: chosenUsername.trim(), color: chosenColor })
                    setStartingDashboard(false)
                  }}
                  disabled={startingDashboard}
                  className="py-3 mt-1"
                  accentHex={AVATAR_ACCENT_HEX[chosenColor]}
                >
                  {startingDashboard ? translate('auth_please_wait') : translate('auth_continue')}
                </FillButton>
                {guestError && <p className="text-red-400 text-sm text-center">{guestError}</p>}
              </div>
            </>
          ) : (
            <>
              {isGuestUpgrade ? (
                <button
                  onClick={onCancelGuestUpgrade}
                  className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300 mb-6"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                  {translate('auth_guest_upgrade_cancel')}
                </button>
              ) : isSignUp && (
                <button
                  onClick={() => setProfileStep(true)}
                  className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300 mb-6"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                  {translate('add_doc_back')}
                </button>
              )}

              <div className="text-center mb-8">
                <h2 className="text-3xl font-semibold text-white mb-2">
                  {isGuestUpgrade ? translate('auth_guest_upgrade_title') : isSignUp ? translate('auth_get_started') : translate('auth_welcome_back')}
                </h2>
                <p className="text-slate-400">
                  {withCursiveOrbit(isGuestUpgrade ? translate('auth_guest_upgrade_subtitle') : isSignUp ? translate('auth_signup_subtitle') : translate('auth_login_subtitle'))}
                </p>
              </div>

              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
                <div>
                  <label className="text-sm text-blue-400 font-medium mb-1.5 block">{translate('auth_email_label')}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 z-10 pointer-events-none">
                      <MailIcon />
                    </span>
                    <input
                      type="email"
                      autoComplete="email"
                      placeholder={translate('auth_email_placeholder')}
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); if (fieldError?.field === 'email') setFieldError(null) }}
                      className="w-full glass-dark-sm rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-400/50 transition-colors"
                    />
                    <FieldError message={fieldError?.field === 'email' ? fieldError.message : null} />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-blue-400 font-medium mb-1.5 block">{translate('auth_password')}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 z-10 pointer-events-none">
                      <LockIcon />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={isSignUp ? 'new-password' : 'current-password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); if (fieldError?.field === 'password') setFieldError(null) }}
                      className="w-full glass-dark-sm rounded-lg pl-10 pr-10 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-400/50 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 z-10"
                    >
                      <EyeIcon open={showPassword} />
                    </button>
                    <FieldError message={fieldError?.field === 'password' ? fieldError.message : null} />
                  </div>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-sm text-blue-400 hover:text-blue-300 mt-1.5"
                    >
                      {translate('auth_forgot_password')}
                    </button>
                  )}
                </div>

                {errorMsg && <p className="text-red-400 text-sm">{errorMsg}</p>}
                {infoMsg && <p className="text-emerald-400 text-sm">{infoMsg}</p>}

                <FillButton type="submit" disabled={loading} className="py-3 mt-1">
                  {loading ? translate('auth_please_wait') : isSignUp ? translate('auth_continue') : translate('auth_login_btn')}
                </FillButton>
              </form>

              {!isGuestUpgrade && (
                <>
                  <div className="flex items-center gap-3 my-6">
                    <div className="h-px bg-white/10 flex-1" />
                    <span className="text-slate-500 text-sm">{translate('auth_or')}</span>
                    <div className="h-px bg-white/10 flex-1" />
                  </div>

                  <button
                    onClick={handleGoogleSignIn}
                    className="glass-dark glass-interactive w-full flex items-center justify-center gap-3 rounded-lg py-3 text-white"
                  >
                    <GoogleIcon />
                    {translate('auth_continue_google')}
                  </button>

                  <p className="text-sm text-slate-500 mt-8 text-center">
                    {isSignUp ? translate('auth_have_account') : translate('auth_no_account')}{' '}
                    <button
                      onClick={() => (isSignUp ? backToLogin() : startSignUp())}
                      className="text-blue-400 hover:text-blue-300 font-medium"
                    >
                      {isSignUp ? translate('auth_toggle_login') : translate('auth_toggle_signup')}
                    </button>
                  </p>

                  {onGuestStart && (
                    <>
                      <button
                        type="button"
                        onClick={onGuestStart}
                        className="w-full text-sm text-slate-500 hover:text-slate-300 mt-4 text-center"
                      >
                        {translate('auth_continue_guest')}
                      </button>
                      {guestError && <p className="text-red-400 text-sm text-center mt-2">{guestError}</p>}
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Shown instead of the dashboard when the session came from a password
// reset email link. Without this, App.jsx would see a valid session and
// jump straight into the dashboard, skipping the actual "set a new
// password" step, which was the bug: the reset link looked like it did
// nothing.
export function ResetPasswordScreen({ onDone }) {
  const { translate } = useLanguage()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [fieldError, setFieldError] = useState(null) // { field: 'password' | 'confirm', message }

  useEffect(() => {
    if (!fieldError) return
    const timer = setTimeout(() => setFieldError(null), FIELD_ERROR_LIFETIME)
    return () => clearTimeout(timer)
  }, [fieldError])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setFieldError(null)
    if (!password) {
      setFieldError({ field: 'password', message: translate('auth_error_password_required') })
      return
    }
    if (password.length < 6) {
      setErrorMsg(translate('auth_password_too_short'))
      return
    }
    if (!confirmPassword) {
      setFieldError({ field: 'confirm', message: translate('auth_error_confirm_password_required') })
      return
    }
    if (password !== confirmPassword) {
      setErrorMsg(translate('auth_passwords_dont_match'))
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setErrorMsg(error.message)
      return
    }
    onDone()
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-6 bg-[#0a0a0f]">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <LogoMark size={32} />
          <span className="font-dancing text-white text-2xl">Orbit</span>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-semibold text-white mb-2">{translate('auth_reset_password_title')}</h2>
          <p className="text-slate-400">{translate('auth_reset_password_subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <div>
            <label className="text-sm text-blue-400 font-medium mb-1.5 block">{translate('auth_new_password')}</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 z-10 pointer-events-none">
                <LockIcon />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (fieldError?.field === 'password') setFieldError(null) }}
                autoComplete="new-password"
                className="w-full glass-dark-sm rounded-lg pl-10 pr-10 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-400/50 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 z-10"
              >
                <EyeIcon open={showPassword} />
              </button>
              <FieldError message={fieldError?.field === 'password' ? fieldError.message : null} />
            </div>
          </div>

          <div>
            <label className="text-sm text-blue-400 font-medium mb-1.5 block">{translate('auth_confirm_password')}</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 z-10 pointer-events-none">
                <LockIcon />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); if (fieldError?.field === 'confirm') setFieldError(null) }}
                autoComplete="new-password"
                className="w-full glass-dark-sm rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-400/50 transition-colors"
              />
              <FieldError message={fieldError?.field === 'confirm' ? fieldError.message : null} />
            </div>
          </div>

          {errorMsg && <p className="text-red-400 text-sm">{errorMsg}</p>}

          <FillButton type="submit" disabled={loading} className="py-3 mt-1">
            {loading ? translate('auth_please_wait') : translate('auth_reset_password_btn')}
          </FillButton>
        </form>
      </div>
    </div>
  )
}