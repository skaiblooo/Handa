// Web Push subscribe/unsubscribe, backed by public/sw.js and the
// push_subscriptions table. VITE_VAPID_PUBLIC_KEY is the public half of a
// VAPID key pair — safe to ship to the client; only the private half
// (kept as a Supabase edge function secret, never in this repo) can
// actually sign push messages.

// PushManager wants applicationServerKey as a Uint8Array, but VAPID keys
// are handed out base64url-encoded — this is the standard conversion.
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && !!import.meta.env.VITE_VAPID_PUBLIC_KEY
}

// Reconciles what the UI thinks push is set to against what's actually
// subscribed in the browser — localStorage's copy of the toggle can't be
// trusted alone, since permission can be revoked or site data cleared
// entirely outside the app's control.
export async function getActualPushSubscription() {
  if (!isPushSupported()) return null
  try {
    const registration = await navigator.serviceWorker.ready
    return await registration.pushManager.getSubscription()
  } catch {
    return null
  }
}

export async function subscribeToPush(supabase, userId) {
  if (!isPushSupported()) return { ok: false, reason: 'unsupported' }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return { ok: false, reason: 'denied' }

  try {
    const registration = await navigator.serviceWorker.ready
    let subscription = await registration.pushManager.getSubscription()
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY),
      })
    }

    const json = subscription.toJSON()
    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: userId,
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth_key: json.keys.auth,
      },
      { onConflict: 'endpoint' }
    )
    if (error) return { ok: false, reason: 'save_failed' }
    return { ok: true }
  } catch {
    return { ok: false, reason: 'subscribe_failed' }
  }
}

export async function unsubscribeFromPush(supabase) {
  if (!isPushSupported()) return
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (!subscription) return
    const endpoint = subscription.endpoint
    await subscription.unsubscribe()
    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
  } catch {
    // best-effort — if this fails the subscription may linger server-side
    // until the endpoint starts bouncing, which send-reminders already
    // has to tolerate for revoked-but-not-explicitly-unsubscribed cases
  }
}
