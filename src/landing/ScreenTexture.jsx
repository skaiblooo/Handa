// Shared "make it feel like a real, physical screen" texture layer used by
// both AnimatedPhone and DashboardDemo — a flat color fill under UI content
// reads as a mockup; these two small pieces are what real product photos
// have and screenshots don't: a soft glow from the display itself, and a
// faint grain from the panel/anti-glare coating.

// Soft breathing glow behind the top of a screen, tinted with the app's
// accent color, so the mockup reads as an actively-lit display rather than
// flat wallpaper. `className` carries the size/position (each call site
// passes one complete literal string — see CLAUDE.md on why Tailwind
// classes must never be built from interpolation).
export function AmbientGlow({ reducedMotion, className = 'w-56 h-40 -top-10' }) {
  return (
    <div
      className={`absolute left-1/2 -translate-x-1/2 rounded-full pointer-events-none ${className}`}
      style={{
        background: 'radial-gradient(closest-side, color-mix(in srgb, var(--accent-500, #3b82f6) 35%, transparent), transparent)',
        filter: 'blur(18px)',
        animation: reducedMotion ? 'none' : 'ambient-glow-pulse 5s ease-in-out infinite',
      }}
    />
  )
}

// Very faint turbulence texture over the whole screen — a perfectly flat
// color fill reads as a UI mockup; real OLED/LCD panels have a subtle grain
// to them even in product photography.
export function ScreenGrain() {
  return (
    <div
      className="absolute inset-0 pointer-events-none mix-blend-overlay"
      style={{
        opacity: 0.05,
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }}
    />
  )
}
