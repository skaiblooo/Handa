import { useId } from 'react'

// Eye-highlight offset for the one-shot "glance" reaction — nudges the
// small white highlight dot on the lens toward whatever just happened,
// the same beat as a real eye catching movement.
const GLANCE_OFFSET = { up: '0px, -2px', down: '0px, 2px', left: '-2px, 0px', right: '2px, 0px' }

// The "Blip — Active" character from the mascot mockup (gradients, glowing
// lens, warm-tipped antenna, glinting panels), as a plain illustration with
// no positioning of its own — PeekingBlip wraps this for the edge-peeking
// treatment; ErrorBoundary and anything else that just wants Blip centered
// can render it directly.
//
// `look` is a one-shot trigger — pass a value that changes (e.g. a
// notification index) to make the lens highlight glance toward `lookAt`
// and back. Driven by a CSS animation keyed on `look` (remounting replays
// it) rather than a JS timer, so there's no setState-on-a-timeout to
// coordinate. Pass `reducedMotion` to suppress it entirely.
export default function BlipIllustration({ size = 64, look, lookAt = 'up', reducedMotion = false, className = '' }) {
  const offset = GLANCE_OFFSET[lookAt] || GLANCE_OFFSET.up
  const uid = useId()
  const bodyGradId = `blip-body-${uid}`
  const lensGradId = `blip-lens-${uid}`
  const glowId = `blip-glow-${uid}`

  return (
    <svg viewBox="0 0 200 200" width={size} height={size} className={className} style={{ overflow: 'visible' }} aria-hidden="true">
      <defs>
        <linearGradient id={bodyGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f5f7f8" />
          <stop offset="100%" stopColor="#c7cfd4" />
        </linearGradient>
        <radialGradient id={lensGradId} cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="var(--accent-400, #7C9AAD)" />
          <stop offset="70%" stopColor="var(--accent-500, #2C3E48)" />
          <stop offset="100%" stopColor="#0a0e12" />
        </radialGradient>
        <filter id={glowId} x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g transform="rotate(4 100 100)">
        {/* panels with gradient + glint */}
        <g>
          <rect x="24" y="78" width="34" height="48" rx="6" fill={`url(#${bodyGradId})`} stroke="var(--accent-400, #7C9AAD)" strokeWidth="1.4" />
          <line x1="30" y1="90" x2="52" y2="90" stroke="var(--accent-400, #7C9AAD)" strokeWidth="1.2" opacity="0.7" />
          <line x1="30" y1="102" x2="52" y2="102" stroke="var(--accent-400, #7C9AAD)" strokeWidth="1.2" opacity="0.7" />
          <line x1="30" y1="114" x2="52" y2="114" stroke="var(--accent-400, #7C9AAD)" strokeWidth="1.2" opacity="0.7" />
          <path d="M27 80 L34 80 L27 124 Z" fill="#fff" opacity="0.25" />
        </g>
        <g>
          <rect x="142" y="78" width="34" height="48" rx="6" fill={`url(#${bodyGradId})`} stroke="var(--accent-400, #7C9AAD)" strokeWidth="1.4" />
          <line x1="148" y1="90" x2="170" y2="90" stroke="var(--accent-400, #7C9AAD)" strokeWidth="1.2" opacity="0.7" />
          <line x1="148" y1="102" x2="170" y2="102" stroke="var(--accent-400, #7C9AAD)" strokeWidth="1.2" opacity="0.7" />
          <line x1="148" y1="114" x2="170" y2="114" stroke="var(--accent-400, #7C9AAD)" strokeWidth="1.2" opacity="0.7" />
          <path d="M173 80 L166 80 L173 124 Z" fill="#fff" opacity="0.25" />
        </g>
        <rect x="58" y="98" width="14" height="6" fill="var(--accent-500, #2C3E48)" />
        <rect x="128" y="98" width="14" height="6" fill="var(--accent-500, #2C3E48)" />

        {/* glowing antenna */}
        <line x1="88" y1="52" x2="80" y2="26" stroke="var(--accent-400, #7C9AAD)" strokeWidth="3" strokeLinecap="round" />
        <g filter={`url(#${glowId})`}>
          <circle cx="80" cy="24" r="4.4" fill="#F0B87A" />
        </g>
        <line x1="112" y1="52" x2="120" y2="26" stroke="var(--accent-400, #7C9AAD)" strokeWidth="3" strokeLinecap="round" />
        <circle cx="120" cy="24" r="4.4" fill="var(--accent-400, #7C9AAD)" />

        {/* body */}
        <rect x="60" y="52" width="80" height="76" rx="28" fill={`url(#${bodyGradId})`} />
        <path d="M64 56 Q66 90 64 122" stroke="#fff" strokeWidth="4" opacity="0.35" fill="none" strokeLinecap="round" />

        {/* lens with glow + highlight that glances on trigger */}
        <g filter={`url(#${glowId})`}>
          <circle cx="100" cy="90" r="23" fill={`url(#${lensGradId})`} />
        </g>
        <circle cx="100" cy="90" r="23" fill="none" stroke="var(--accent-400, #7C9AAD)" strokeWidth="2" />
        <circle cx="100" cy="90" r="12" fill="var(--accent-400, #7C9AAD)" opacity="0.9" />
        <g
          key={reducedMotion ? 'static' : look}
          style={!reducedMotion && look !== undefined && look !== null ? { animation: 'blip-glance 900ms ease', '--glance-offset': offset } : undefined}
        >
          <circle cx="94" cy="84" r="3.4" fill="#fff" opacity="0.85" />
        </g>

        <rect x="82" y="116" width="36" height="5" rx="2.5" fill="var(--accent-500, #2C3E48)" opacity="0.5" />
      </g>
    </svg>
  )
}
