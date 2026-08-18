import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Auth, { ResetPasswordScreen, CompleteGoogleProfileScreen, GuestUpgradeModal } from './Auth'
import Dashboard from './Dashboard'
import Landing from './landing/Landing'
import { LanguageProvider } from './i18n'

function App() {
  const [session, setSession] = useState(null)
  // Logged-out visitors land on the marketing page first; clicking through
  // ("Start tracking for free") is what actually reveals the auth screen.
  const [entered, setEntered] = useState(false)
  // Set only while an existing guest is upgrading to a real account from
  // inside the dashboard — distinct from "no session yet", which always
  // shows Auth directly.
  const [upgradingGuest, setUpgradingGuest] = useState(false)
  // A session from a password reset link is still just a session as far as
  // Supabase is concerned, so without tracking this separately the app would
  // treat the recovery link as a normal login and jump straight into the
  // dashboard, skipping the actual "set a new password" step entirely.
  const [isRecovery, setIsRecovery] = useState(false)
  // Defaults assume a first-time visitor (signup) until the IP check below
  // says otherwise, so the auth screen never has to wait on the network.
  const [authRouting, setAuthRouting] = useState({ mode: 'signup', email: '' })
  const [guestError, setGuestError] = useState('')

  // Swapping Landing for Auth is a pure client-side state change with no
  // history entry of its own, so the browser back button had nowhere to go
  // but out of the site entirely. Pushing a history entry when entering
  // Auth, and following back/forward navigation to match, keeps the back
  // button inside the app instead.
  function goToAuth() {
    window.history.pushState({ orbitEntered: true }, '')
    setEntered(true)
  }

  useEffect(() => {
    function onPopState(e) {
      setEntered(!!e.state?.orbitEntered)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'PASSWORD_RECOVERY') setIsRecovery(true)
        setSession(session)
      }
    )

    return () => listener.subscription.unsubscribe()
  }, [])

  // First-time visitors get the signup screen so they don't feel like they
  // have to log in to something they haven't tried yet; returning visitors
  // (same hashed IP seen before) get login with their last email remembered.
  useEffect(() => {
    let cancelled = false
    supabase.functions.invoke('check-visit').then(({ data }) => {
      if (cancelled || !data?.returning) return
      setAuthRouting({ mode: 'login', email: localStorage.getItem('orbit_last_email') || '' })
    }).catch(() => {
      // if the check fails, default to the first-time signup experience
    })
    return () => { cancelled = true }
  }, [])

  const isGuest = !!session?.user?.is_anonymous

  // Google sign-in skips Auth's own "pick a username" step entirely (it
  // redirects straight to Google and back), so first-ever login for a
  // Google account still needs to collect a username before landing in the
  // dashboard — detected by the profile meta this step writes never having
  // been created for that user id.
  const [needsGoogleProfile, setNeedsGoogleProfile] = useState(false)
  useEffect(() => {
    if (!session?.user?.id || session.user.app_metadata?.provider !== 'google') {
      setNeedsGoogleProfile(false)
      return
    }
    try {
      setNeedsGoogleProfile(localStorage.getItem(`orbit_profile_meta_${session.user.id}`) === null)
    } catch {
      setNeedsGoogleProfile(false)
    }
  }, [session?.user?.id])

  // `profile` carries the username/color a new signee just picked in Auth's
  // profile step — signing in anonymously here (rather than making them set
  // a password first) is what lets them land straight in the dashboard;
  // they can add real credentials later from the guest banner.
  async function startGuest(profile) {
    setGuestError('')
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) {
      setGuestError(error.message)
      return
    }
    if (profile && data?.user?.id) {
      try {
        localStorage.setItem(
          `orbit_profile_meta_${data.user.id}`,
          JSON.stringify({ photo: null, username: profile.username, color: profile.color })
        )
      } catch {
        // best-effort persistence
      }
    }
  }

  return (
    <LanguageProvider>
      {session && isRecovery ? (
        <ResetPasswordScreen onDone={() => setIsRecovery(false)} />
      ) : session && needsGoogleProfile ? (
        <CompleteGoogleProfileScreen session={session} onDone={() => setNeedsGoogleProfile(false)} />
      ) : session ? (
        <>
          <Dashboard
            session={session}
            isGuest={isGuest}
            onUpgradeAccount={() => setUpgradingGuest(true)}
          />
          {isGuest && upgradingGuest && (
            <GuestUpgradeModal onCancel={() => setUpgradingGuest(false)} />
          )}
        </>
      ) : !entered ? (
        <Landing onGetStarted={goToAuth} />
      ) : (
        <Auth
          defaultMode={authRouting.mode}
          prefillEmail={authRouting.email}
          onGuestStart={startGuest}
          guestError={guestError}
        />
      )}
    </LanguageProvider>
  )
}

export default App
