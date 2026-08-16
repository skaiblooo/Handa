# Orbit Design System

This documents the UI conventions Orbit's React components actually follow
(and where they don't yet, but should). Read this before adding or changing
any UI — the goal is one consistent material and motion language instead of
every new component inventing its own.

## Theming

There is no Tailwind `dark:` variant usage. Every component takes an
`isDark` boolean prop and picks classes with a small helper repeated in each
file:

```js
function t(isDark, darkClasses, lightClasses) {
  return isDark ? darkClasses : lightClasses
}
```

Always write both branches together — never ship a dark-only or light-only
class list. `isDark` is threaded down from `Dashboard.jsx`'s theme state
(`themeMode`: `'light' | 'dark' | 'system'`).

## The glass material system (`src/index.css`)

Orbit's surfaces are frosted glass, not flat fills. All variants are defined
with `@utility` (Tailwind v4) so they participate in the cascade layers
correctly — never add a plain top-level CSS rule for a reusable surface.

| Utility | Use for |
|---|---|
| `glass-dark` / `glass-light` | Large panels, nav bars, big cards |
| `glass-dark-sm` / `glass-light-sm` | Small surfaces — inputs, icon badges, chips |
| `glass-chip-dark` / `glass-chip-light` | Badges/toggles **nested inside** an already-glass panel (no backdrop-filter, so no double-blur cost) |
| `glass-accent` | Primary/CTA buttons (tints via `--accent-*`) |
| `glass-danger` | Destructive actions (delete, disable, log out) |
| `glass-btn` | Bright pill CTAs sitting directly on the landing page's dark hero/video background |
| `glass-panel` | Large landing-page surfaces with an ambient glow |
| `glass-interactive` | The bouncy hover/press feedback — pair with almost every clickable glass element |

**Rule: never nest two `backdrop-filter` glass layers.** A glass surface
inside another glass surface re-samples the same pixels twice, which is
where the flicker/glitch on repaint came from historically (documented in
`index.css` above `glass-chip-dark`). If a small element sits *inside* a
`glass-dark`/`glass-light` panel, use the chip variant or a flat
`bg-white/5`-style class instead of another `glass-*-sm`.

**Liquid Glass motion (`glass-interactive`):** every element that pairs
`glass-interactive` gets a specular sheen — a soft diagonal highlight band
that sweeps across on hover, like light catching a curved pane of glass —
plus the springy hover/press transform. It's implemented as the
`background-image` longhand on `glass-interactive` itself, layered on top
of whatever `background-color` the paired `glass-dark`/`glass-light`/
`glass-accent`/`glass-danger` utility already set (those come first in
`index.css`, so this later same-specificity longhand wins without clobbering
them). This means it's automatic — you don't add anything extra, just keep
pairing `glass-interactive` per the button hierarchy below. `glass-dark`/
`glass-light` also carry a subtle bottom-edge inset shadow simulating the
lower curve of the glass; don't strip it when tuning a variant's shadow.

## Button hierarchy

- **Primary / CTA** → `glass-accent glass-interactive`
- **Destructive** → `glass-danger glass-interactive`
- **Landing hero CTA** → `glass-btn glass-interactive`
- **Secondary / pill** (e.g. "Edit profile") → `glass-dark-sm`/`glass-light-sm` + `glass-interactive`, `rounded-full`, small padding
- **Tertiary / icon-only** (close buttons, chevrons) → no fill, just
  `text-slate-400 hover:text-slate-100 transition-colors`

**Known inconsistency, migrate opportunistically:** several older buttons
still use flat, non-glass fills — `bg-blue-500`/`bg-blue-600` (e.g.
`panelButtonClass` in `ProfilePage.jsx`, feedback buttons in
`PlaybookModal.jsx`) and flat `bg-[#16171c]` cards. These predate the glass
system settling. Don't copy them into new code — when you're already
touching one of these components for something else, bring its buttons in
line with the table above. Don't do a drive-by mass rewrite unless asked.

## Animation timing

Nothing that opens or closes should snap instantly — every show/hide has a
matching enter *and* exit animation. The keyframes live in `index.css`
(lines ~247-380):

| Interaction | Keyframes / technique |
|---|---|
| Modal open/close | `backdrop-in` (150ms ease-out) / `backdrop-out` (180ms ease-in) on the overlay, `modal-in`/`modal-out` (180ms, scale 0.96↔1) on the dialog |
| Accordion / expandable row | `display: grid; grid-template-rows: 0fr ↔ 1fr` over 350ms `cubic-bezier(0.22,1,0.36,1)`, plus a nested `opacity` fade over 300ms |
| Dropdown menu | `dropdown-in` 140ms ease-out (translateY + scale) |
| Card entrance (staggered) | `rise-in` 0.5s `cubic-bezier(0.16,1,0.3,1)`, delayed per-index |
| Hover/press feedback | built into `glass-interactive` — a springy `cubic-bezier(0.34,1.56,0.64,1)` overshoot, not a linear resize |

Anything that conditionally renders (`{open && <Panel/>}`) and needs an exit
animation must use the `useDelayedUnmount(isOpen, duration)` hook (defined
per-file, e.g. `Dashboard.jsx`, `ProfilePage.jsx` — a shared
`src/hooks/useDelayedUnmount.js` would be a reasonable next step) so the
close animation gets to finish playing before the DOM node disappears.

## Radius scale

- `rounded-lg` — inputs, small buttons
- `rounded-xl` — rows, list items, small cards
- `rounded-2xl` — section cards, modals, large panels
- `rounded-full` — pills, avatars, icon badges

## Icons

Prefer inline stroke SVGs using `stroke="currentColor"` (see the `Icon`
helper component repeated across files) — they follow `isDark` for free via
whatever text color class wraps them.

If you're given raster icon assets (flat black PNGs, no theme awareness),
use the invert trick instead of asking for re-exports:

```jsx
function RowIcon({ isDark, src, size = 18 }) {
  return (
    <img src={src} alt="" style={{ width: size, height: size }}
      className={t(isDark, 'opacity-75 invert', 'opacity-60')} />
  )
}
```

`invert` flips black → white for dark mode; light mode just dims the
opacity slightly to sit at roughly the same visual weight as the rest of
that theme's icon set.

## Forms

- Text inputs: `glass-dark-sm`/`glass-light-sm` (unless already inside a
  glass panel — see the no-double-glass rule), `rounded-lg`,
  `focus:outline-none focus:border-blue-400/50` (dark) /
  `focus:border-blue-400` (light), `disabled:opacity-60`.
- Segmented inputs (date of birth, phone number) auto-insert their
  separator while typing forward but not while deleting — see
  `formatSegments` in `ProfilePage.jsx`. Don't hand-roll a new masked input;
  reuse or extend that helper.

## i18n

Every user-facing string goes through `translate('key')` from
`useLanguage()` (`src/i18n.jsx`). When adding a string, add the key to
**both** the `en` and `fil` blocks in the same change — never leave one
language behind.

## Persistence

`localStorage` keys are prefixed `orbit_`, and per-account data is suffixed
with `${session.user.id}` (e.g. `orbit_profile_meta_${uid}`). Keep this
prefix — it's also what lets the app detect "first login, no profile yet"
by checking for the key's absence.
