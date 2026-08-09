// Shared document-type identity used across the dashboard so a document
// reads the same way (name, agency color) wherever it shows up.
export const DOC_TYPE_LABELS = {
  drivers_license: "Driver's License",
  passport: 'Passport',
  nbi_clearance: 'NBI Clearance',
  national_id: 'National ID (PhilSys)',
  psa_birth_certificate: 'PSA Birth Certificate',
  sss: 'SSS',
  philhealth: 'PhilHealth',
  pagibig: 'Pag-IBIG',
  tin_bir: 'TIN / BIR',
}

export const AGENCY_BADGE = {
  drivers_license: { label: 'LTO', color: 'bg-blue-600' },
  passport: { label: 'DFA', color: 'bg-teal-600' },
  nbi_clearance: { label: 'NBI', color: 'bg-purple-600' },
  national_id: { label: 'PSA', color: 'bg-orange-600' },
  psa_birth_certificate: { label: 'PSA', color: 'bg-orange-600' },
  sss: { label: 'SSS', color: 'bg-emerald-600' },
  philhealth: { label: 'PH', color: 'bg-red-600' },
  pagibig: { label: 'HDMF', color: 'bg-yellow-600' },
  tin_bir: { label: 'BIR', color: 'bg-slate-600' },
}

export const URGENCY_META = {
  expired: { label: 'Expired', dot: 'bg-red-400', bar: 'bg-red-400', badgeDark: 'bg-red-400/10 text-red-300', badgeLight: 'bg-red-100 text-red-700', fill: 100 },
  critical: { label: 'Due Soon', dot: 'bg-red-400', bar: 'bg-red-400', badgeDark: 'bg-red-500/15 text-red-300', badgeLight: 'bg-red-100 text-red-700', fill: 90, pulse: true },
  urgent: { label: 'Active', dot: 'bg-amber-400', bar: 'bg-amber-400', badgeDark: 'bg-amber-400/10 text-amber-300', badgeLight: 'bg-amber-100 text-amber-800', fill: 80 },
  upcoming: { label: 'Active', dot: 'bg-blue-400', bar: 'bg-blue-400', badgeDark: 'bg-blue-400/10 text-blue-300', badgeLight: 'bg-blue-100 text-blue-700', fill: 50 },
  safe: { label: 'Active', dot: 'bg-emerald-400', bar: 'bg-emerald-400', badgeDark: 'bg-emerald-400/10 text-emerald-300', badgeLight: 'bg-emerald-100 text-emerald-700', fill: 20 },
  // A document being applied for isn't "expiring" — it doesn't exist yet —
  // so it gets its own neutral status instead of being forced into the
  // expiry-driven scale.
  ongoing: { label: 'Ongoing', dot: 'bg-blue-400', bar: 'bg-blue-400', badgeDark: 'bg-blue-400/10 text-blue-300', badgeLight: 'bg-blue-100 text-blue-700', fill: 30 },
}
