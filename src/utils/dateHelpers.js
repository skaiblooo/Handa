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
    const years = Math.floor(n / 365)
    const months = Math.floor((n % 365) / 30)
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