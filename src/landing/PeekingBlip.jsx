import { useState } from 'react'

const GLANCE_OFFSET = { up: '0px, -2.5px', down: '0px, 2.5px', left: '-2.5px, 0px', right: '2.5px, 0px' }

// Orbit's own mascot sketch (see the mascot mockup artifact), simplified to
// the flat "Mark" construction — a rounded body, one glowing-tipped
// antenna, one eye — since this version has to stay light enough to
// animate continuously in the background of a landing page, not sit still
// as a hero illustration.
//
// `edge` picks which side of the parent it peeks from, and `look` is a
// one-shot trigger — pass a value that changes (e.g. a notification index)
// to make the eye glance toward `lookAt` and back. Driven entirely by a
// CSS animation keyed on `look` (remounting the pupil replays it) rather
// than a JS timer, so there's no setState-on-a-timeout to coordinate.
export default function PeekingBlip({ edge = 'bottom', look, lookAt = 'up', size = 64 }) {
  const [reducedMotion] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  const offset = GLANCE_OFFSET[lookAt] || GLANCE_OFFSET.up

  return (
    <div
      className={`absolute pointer-events-none ${reducedMotion ? '' : 'blip-wander'} ${edge === 'bottom' ? 'blip-edge-bottom' : edge === 'left' ? 'blip-edge-left' : 'blip-edge-right'}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 116 116" width={size} height={size} style={{ overflow: 'visible' }}>
        <line x1="58" y1="30" x2="58" y2="18" stroke="var(--accent-400, #7C9AAD)" strokeWidth="4" strokeLinecap="round" />
        <circle cx="58" cy="15" r="5.5" fill="#F0B87A" />
        <rect x="30" y="30" width="56" height="56" rx="22" fill="var(--accent-400, #7C9AAD)" />
        <g
          key={reducedMotion ? 'static' : look}
          style={!reducedMotion && look !== undefined && look !== null ? { animation: 'blip-glance 900ms ease', '--glance-offset': offset } : undefined}
        >
          <circle cx="58" cy="58" r="10" fill="#020308" />
          <circle cx="55" cy="55" r="2.6" fill="rgba(255,255,255,0.75)" />
        </g>
      </svg>
    </div>
  )
}
