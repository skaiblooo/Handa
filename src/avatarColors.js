// Shared between Auth (signup color picker) and Dashboard/ProfilePage (avatar
// fallback rendering) so the palette a user picks at signup renders identically
// everywhere later. Index 0 matches the app's original hardcoded blue, so
// existing accounts with no stored color see no visual change.
export const AVATAR_COLORS = [
  'from-blue-500 to-blue-700',
  'from-emerald-500 to-emerald-700',
  'from-purple-500 to-purple-700',
  'from-amber-500 to-amber-700',
  'from-rose-500 to-rose-700',
  'from-teal-500 to-teal-700',
]

// Same index order as AVATAR_COLORS, as raw hex, so the chosen color can
// drive CSS custom properties (--accent-500/--accent-600) rather than just
// the avatar's own gradient, letting buttons and highlights across the app
// pick it up too.
export const AVATAR_ACCENT_HEX = [
  { 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb' },
  { 400: '#34d399', 500: '#10b981', 600: '#059669' },
  { 400: '#c084fc', 500: '#a855f7', 600: '#9333ea' },
  { 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706' },
  { 400: '#fb7185', 500: '#f43f5e', 600: '#e11d48' },
  { 400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488' },
]
