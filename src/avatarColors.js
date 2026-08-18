// Shared between Auth (signup color picker) and Dashboard/ProfilePage (avatar
// fallback rendering) so the palette a user picks at signup renders identically
// everywhere later. Plain hex, applied via an inline `backgroundColor` style
// rather than a `bg-gradient-to-br` className: every swatch also carries
// glass-interactive for its hover sweep, and that utility sets its own
// `background-image` — a Tailwind gradient className on the same element
// sets that exact same property, so whichever rule lands later in the
// compiled stylesheet wins outright and the other's fill never renders at
// all. `background-color` is a different property, so it composes safely
// with glass-interactive's sweep instead of racing it.
export const AVATAR_COLORS = ['#0B1723', '#12313A', '#4B6169', '#8E968F', '#D8CFC6']

// Same index order as AVATAR_COLORS, as raw hex, so the chosen color can
// drive CSS custom properties (--accent-500/--accent-600) rather than just
// the avatar's own fill, letting buttons and highlights across the app pick
// it up too.
export const AVATAR_ACCENT_HEX = [
  { 400: '#5A7A8F', 500: '#0B1723', 600: '#060D14' },
  { 400: '#5F868F', 500: '#12313A', 600: '#0B2027' },
  { 400: '#8CA0A5', 500: '#4B6169', 600: '#374C53' },
  { 400: '#B9C0BA', 500: '#8E968F', 600: '#6F7770' },
  { 400: '#EEE8E1', 500: '#D8CFC6', 600: '#B7ADA1' },
]
