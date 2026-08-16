---
name: orbit-design
description: Design conventions for Orbit's UI (glass material system, button hierarchy, animation timing, theming, forms, i18n). Use before writing, editing, or reviewing any component/UI code in this repo, so new work matches the existing look instead of inventing new button styles or skipping animations.
---

# Orbit design conventions

Before writing or changing any UI in this repo, read `DESIGN.md` at the
project root. It documents, with real examples from the codebase:

- The `isDark` + `t(isDark, darkClasses, lightClasses)` theming pattern
  (no Tailwind `dark:` variants are used anywhere)
- The glass material system in `src/index.css` (`glass-dark`, `glass-light`,
  `glass-accent`, `glass-danger`, `glass-dark-sm`/`glass-light-sm`,
  `glass-chip-*`, `glass-btn`, `glass-panel`, `glass-interactive`) and the
  rule against nesting two glass (backdrop-filter) layers
- The button hierarchy (primary/destructive/secondary/tertiary) and which
  glass utility each maps to
- Animation timing for modals, accordions, dropdowns, and card entrances —
  nothing that opens/closes should snap instantly; use `useDelayedUnmount`
  for anything that needs an exit animation before unmounting
- Radius scale, icon conventions (stroke SVG preferred; the invert trick for
  raster icons), form input styling, i18n (`translate()` + both `en`/`fil`
  blocks), and the `orbit_*` localStorage key convention

## How to use this

1. Read `DESIGN.md` before implementing new UI or reviewing someone else's.
2. Match new components to the existing patterns rather than introducing a
   new button style, animation curve, or ad hoc color. If you're unsure
   which glass utility fits, check the button hierarchy table first.
3. Legacy code that predates this system (flat `bg-blue-600` buttons, flat
   `bg-[#16171c]` cards) is called out in `DESIGN.md` as known debt — don't
   copy it into new code, but don't mass-rewrite it unprompted either.
   Bring a component in line with the system when you're already touching
   it for another reason.
4. If you establish a genuinely new, reusable pattern (a new animation, a
   new surface type), add it to `DESIGN.md` in the same change so the next
   session doesn't have to rediscover it.
