// Shared "make it feel like a real, physical screen" texture layer used by
// both AnimatedPhone and DashboardDemo — a flat color fill under UI content
// reads as a mockup; a faint grain from the panel/anti-glare coating is
// what real product photos have and screenshots don't. No gradients or
// glows here on purpose — this app doesn't use them anywhere else either.

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
