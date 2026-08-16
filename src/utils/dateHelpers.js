// For past timestamps (news articles, activity log entries) — formatDaysUntil
// below is the opposite case, a countdown to a future date. Falls back to an
// actual date past a week out rather than counting "12d ago" indefinitely.
export function formatTimeAgo(dateStr) {
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

export function getDaysUntilExpiry(expiryDate) {
  const today = new Date()
  const expiry = new Date(expiryDate)
  const diffTime = expiry - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

export function formatDaysUntil(daysUntil) {
  if (daysUntil === 0) return 'Due today'
  const n = Math.abs(daysUntil)
  const suffix = daysUntil < 0 ? 'ago' : 'left'

  if (n >= 365) {
    // Deriving years/months independently (n/365 and (n%365)/30) can round
    // up to "12 months" within a year that hasn't turned over yet — carry
    // the total month count into years first so months always lands 0-11.
    const totalMonths = Math.floor(n / 30)
    const years = Math.floor(totalMonths / 12)
    const months = totalMonths % 12
    const yearPart = `${years} ${years === 1 ? 'year' : 'years'}`
    const monthPart = months > 0 ? `, ${months} ${months === 1 ? 'month' : 'months'}` : ''
    return `${yearPart}${monthPart} ${suffix}`
  }
  if (n >= 30) {
    const months = Math.floor(n / 30)
    return `${months} ${months === 1 ? 'month' : 'months'} ${suffix}`
  }
  const unit = n === 1 ? 'day' : 'days'
  return `${n} ${unit} ${suffix}`
}

// Compact single-token version of the countdown above ("8d" instead of "8
// days ago") — for tight spaces like a notification dropdown row where
// the full "N days ago/left" phrasing doesn't fit next to a title. Drops
// the ago/left suffix entirely rather than abbreviating it; the sign is
// implied by context (an already-expired vs. still-upcoming document).
export function formatCompactDaysUntil(daysUntil) {
  const n = Math.abs(daysUntil)
  if (n === 0) return 'Today'
  if (n >= 365) return `${Math.floor(n / 365)}y`
  if (n >= 30) return `${Math.floor(n / 30)}mo`
  if (n >= 7) return `${Math.floor(n / 7)}w`
  return `${n}d`
}

// A relative countdown ("1 year, 6 months left") is only useful when the
// deadline is close enough to act on soon — past a month out, an absolute
// date is more useful (you can actually check it against a calendar) and
// doesn't force you to do date math to know when to worry.
export function formatExpiryDisplay(daysUntil, expiryDate) {
  if (daysUntil <= 30) return formatDaysUntil(daysUntil)
  const date = new Date(expiryDate)
  return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`
}

export function getUrgencyLevel(daysUntil) {
  if (daysUntil < 0) return 'expired'
  if (daysUntil <= 7) return 'critical'
  if (daysUntil <= 30) return 'urgent'
  if (daysUntil <= 90) return 'upcoming'
  return 'safe'
}

export function getUrgencyStyles(urgency) {
  const styles = {
    expired: 'bg-red-100 border-red-400 text-red-700',
    urgent: 'bg-orange-100 border-orange-400 text-orange-700',
    upcoming: 'bg-yellow-100 border-yellow-400 text-yellow-700',
    safe: 'bg-green-100 border-green-400 text-green-700',
  }
  return styles[urgency]
}

export function getUrgencyLabel(urgency, daysUntil) {
  if (urgency === 'expired') return `Expired ${Math.abs(daysUntil)} days ago`
  if (urgency === 'urgent') return `${daysUntil} days left`
  if (urgency === 'upcoming') return `${daysUntil} days left`
  return `${daysUntil} days left`
}