// Client-side activity log for the History tab. There's no backend audit
// table yet, so entries are kept per-account in localStorage — good enough
// to show "what did I just do" on this browser without a schema migration.
const MAX_ENTRIES = 50

function storageKey(userId) {
  return `orbit_activity_log_${userId}`
}

export function getActivityLog(userId) {
  if (!userId) return []
  try {
    return JSON.parse(localStorage.getItem(storageKey(userId)) || '[]')
  } catch {
    return []
  }
}

export function logActivity(userId, text, type = 'update') {
  if (!userId) return
  try {
    const log = getActivityLog(userId)
    log.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      text,
      type,
      timestamp: new Date().toISOString(),
    })
    localStorage.setItem(storageKey(userId), JSON.stringify(log.slice(0, MAX_ENTRIES)))
  } catch {
    // localStorage can throw (quota exceeded, private browsing) — logging is best-effort.
  }
}
