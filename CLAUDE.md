# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start the Vite dev server
- `npm run build` — production build. This is **not** a plain `vite build`: it also builds an SSR entry (`vite build --ssr src/entry-server.jsx`) and runs `scripts/prerender.js`, which renders the landing page to static HTML and injects it into `dist/index.html` (see "Build-time prerendering" below). Always use this script, not a raw `vite build`, when verifying a change compiles.
- `npm run lint` — ESLint (flat config in `eslint.config.js`: `js.recommended` + `react-hooks` + `react-refresh`). There is a standing baseline of pre-existing warnings/errors in the tree; when checking your own change didn't regress anything, compare the full problem *count* before/after rather than grepping for specific messages, since the baseline count is what matters.
- `npm run preview` — serve the production build locally.
- No test suite exists in this repo (no test script, no test framework installed).

## Architecture

**Stack:** React 19 + Vite 8 + Tailwind v4 (`@tailwindcss/vite` plugin), Supabase (Postgres + Auth + Storage + Edge Functions + RLS), deployed on Vercel.

### App shell has no router

`src/App.jsx` is a hand-rolled state machine, not `react-router`: it holds `session` (from `supabase.auth`), `entered` (has the visitor clicked past the landing page), and a few auth-flow flags (`isRecovery`, `needsGoogleProfile`, `upgradingGuest`), and picks one of `Landing` / `Auth` / `ResetPasswordScreen` / `CompleteGoogleProfileScreen` / `Dashboard` to render based on their combination. Landing→Auth pushes a real `history` entry (see the `goToAuth`/`popstate` handling) specifically so the browser back button works there; that's the only place in the app that touches `window.history` directly. Inside `Dashboard`, navigation between sections is plain `useState`, not URL-based — there are no deep-linkable routes anywhere in the app.

### `Dashboard.jsx` is the app

At 4000+ lines, `src/Dashboard.jsx` contains most of the authenticated app: My Space, My Orbits, Notifications, Settings (all tabs), Calendar/Appointments, History, and the shared sidebar/topbar chrome, all as functions in one file. `ProfilePage.jsx` and `PlaybookModal.jsx` are the two pieces large enough to have been split out.

The load-bearing gotcha: several components in this file are rendered from **more than one call site** (e.g. a panel reachable both from a top-level sidebar nav item and from a Settings tab). When you change a shared component's props, grep for every call site before considering the change done — a prop added at only one of them compiles fine and crashes at runtime the first time a user reaches the other one. This has caused a real production crash before.

### Design system — read `DESIGN.md` first

UI conventions (the `isDark`/`t()` theming pattern, the `glass-*` material utilities in `src/index.css`, button hierarchy, animation timing, form/i18n conventions) are documented in `DESIGN.md` at the repo root, and the `orbit-design` skill points at it. Read it before writing or reviewing any UI code rather than inferring conventions from whichever component you opened first — several older components predate the current system and don't follow it.

One recurring class of bug not yet fully swept: a `glass-interactive` element that never got paired with a `glass-dark`/`glass-light`/`glass-accent` base fill renders as a border floating over nothing, which reads as a broken/stuck sweep animation rather than a missing background. When adding a new interactive glass element, check it actually has a paired material class, not just `glass-interactive` alone.

### Tailwind class names must be static

Tailwind's build-time scanner finds class names by scanning source text for literal strings — a class built with template interpolation (`` `bg-${color}-600` ``) or computed at runtime produces **silently no CSS**, not an error. `data/docTypes.js`'s agency badge/gradient values and `avatarColors.js`'s palette are both written as complete literal strings for exactly this reason (both files have comments to this effect after this bit the codebase in practice). Never build a Tailwind class dynamically; if a value needs to be dynamic, use an inline `style` prop instead.

### Data model: `docTypes.js` + `playbooks.js`

`src/data/docTypes.js` defines every Philippine government (and common non-government) document type Orbit tracks, the issuing agency each belongs to, badge colors, and category groupings. `src/data/playbooks.js` holds the actual step-by-step renewal/application instructions per document type — this content is **English-only, deliberately not translated** (see the comment at the top of `i18n.jsx`: inventing Filipino legal/procedural text without an authoritative source risks giving users wrong instructions for real government transactions). Everything else in the app goes through `translate()`.

### i18n

`src/i18n.jsx` exports `useLanguage()` → `{ translate, lang, setLang }`. Every user-facing string (outside of `playbooks.js`, see above) must have both an `en` and a `fil` entry added in the same change — `translate()` falls back to the key itself if a translation is missing, so a forgotten translation fails silently rather than erroring.

### Supabase: migrations and deploy are not automatic

Vercel auto-deploys the frontend on every push to `main`. **Supabase does not** — migrations in `supabase/migrations/` need `supabase db push --linked` run explicitly, and anything in `supabase/functions/` needs `supabase functions deploy <name>` explicitly. A migration or function landing in this repo does not mean it's live; check with the user before assuming a schema change or edge function change has taken effect in production.

Three core tables (`documents`, `playbook_feedback`, `reminder_log`) predate this repo's migration-tracking — they were created directly in the Supabase dashboard, so their schema isn't fully visible from migration files alone. Client queries (e.g. `fetchDocuments()`) select without an explicit `user_id` filter and rely entirely on RLS to scope rows to the current user — when touching a table like this, verify RLS policy state directly rather than assuming the client-side query is what's enforcing access.

### Build-time prerendering

`src/entry-server.jsx` + `scripts/prerender.js` render the landing page (only — not the authenticated app) to static HTML at build time via `react-dom/server`, and inject it into `dist/index.html` so crawlers/social-link-previews see real content instead of an empty `#root`. This works because `Landing`'s first synchronous render is deterministic (before any async `getSession()`/analytics calls resolve). If you change what `Landing` renders on its first pass in a way that becomes non-deterministic, this will silently start prerendering stale/wrong content.

### Known reference docs in this repo

- `DESIGN.md` — UI/design conventions (see above).
- `AUDIT_REPORT.md` — a point-in-time security/SaaS-readiness audit. Useful for the *reasoning* behind some existing choices (why CORS is locked down the way it is, why certain tables have RLS-enabled-zero-policies), but treat its "current state" claims as a snapshot, not live truth — e.g. it says no file-upload feature exists, which is no longer accurate.
