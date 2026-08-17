// Generates a plain .ics file (RFC 5545) client-side — no server round
// trip, no third-party account, no paid API. Any calendar app (Google,
// Apple, Outlook) can import it directly. Deliberately a one-time export
// rather than a live subscription feed: a subscribable calendar needs a
// standing, per-user-authenticated URL to serve fresh .ics content on
// demand, which is a real (if still free) follow-up, not this.
const ALARM_OFFSETS_DAYS = [30, 7, 1]

function escapeIcsText(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

function formatIcsDate(dateStr) {
  return dateStr.replace(/-/g, '')
}

function formatIcsTimestamp(date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

export function buildIcsContent(documents) {
  const now = formatIcsTimestamp(new Date())
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Orbit//Document Reminders//EN', 'CALSCALE:GREGORIAN']

  // Application-intent documents carry a placeholder expiry_date, not a
  // real one — same exclusion every reminder path in the app already
  // makes, so an in-progress application never shows up as a fake deadline.
  documents
    .filter((doc) => doc.intent !== 'application' && doc.expiry_date)
    .forEach((doc) => {
      const title = doc.title || doc.doc_type
      lines.push(
        'BEGIN:VEVENT',
        `UID:${doc.id}@orbit.app`,
        `DTSTAMP:${now}`,
        `DTSTART;VALUE=DATE:${formatIcsDate(doc.expiry_date)}`,
        `SUMMARY:${escapeIcsText(`${title} expires`)}`,
        `DESCRIPTION:${escapeIcsText('Tracked in Orbit')}`
      )
      // Mirrors the app's own 30/7/1-day reminder thresholds, so the
      // calendar's alarms match what Orbit itself would have nudged about.
      for (const days of ALARM_OFFSETS_DAYS) {
        lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Reminder', `TRIGGER:-P${days}D`, 'END:VALARM')
      }
      lines.push('END:VEVENT')
    })

  lines.push('END:VCALENDAR')
  // The format requires CRLF line endings, not just \n.
  return lines.join('\r\n')
}

export function downloadIcs(documents) {
  const content = buildIcsContent(documents)
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'orbit-documents.ics'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
