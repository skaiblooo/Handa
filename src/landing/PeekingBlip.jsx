import { useState } from 'react'
import BlipIllustration from './BlipIllustration'

// Positions BlipIllustration peeking from an edge, wandering near it with a
// springy bounce. `edge` picks which side of the parent it peeks from
// (small px-based movement, not a wide sweep, so it doesn't drift fully
// behind whatever it's peeking out of); `look`/`lookAt` pass straight
// through to make it glance reactively — see BlipIllustration for that
// mechanism.
export default function PeekingBlip({ edge = 'bottom', look, lookAt = 'up', size = 64 }) {
  const [reducedMotion] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)

  return (
    <div
      className={`absolute pointer-events-none ${reducedMotion ? '' : 'blip-wander'} ${edge === 'bottom' ? 'blip-edge-bottom' : edge === 'left' ? 'blip-edge-left' : 'blip-edge-right'}`}
      style={{ width: size, height: size }}
    >
      <BlipIllustration size={size} look={look} lookAt={lookAt} reducedMotion={reducedMotion} />
    </div>
  )
}
