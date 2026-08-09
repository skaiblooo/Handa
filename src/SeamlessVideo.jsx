import { useEffect, useRef } from 'react'

const CROSSFADE_SECONDS = 1.2

/**
 * A looping background video with no visible "reset" at the loop point.
 * The native `loop` attribute cuts hard back to frame 0 the instant playback
 * ends, which reads as a jarring flash on footage like this. Two copies of
 * the same clip play a fraction of a lap apart; shortly before the front
 * copy ends, the back copy (already primed at time 0) fades in underneath
 * it, so the cut is hidden inside a crossfade instead of happening in the
 * open.
 */
export default function SeamlessVideo({ src, className = '' }) {
  const videoARef = useRef(null)
  const videoBRef = useRef(null)
  const frontIsA = useRef(true)

  useEffect(() => {
    const a = videoARef.current
    const b = videoBRef.current
    if (!a || !b) return

    let raf

    function armNextSwap(front, back) {
      let swapped = false
      function watch() {
        if (!swapped && front.duration && front.currentTime >= front.duration - CROSSFADE_SECONDS) {
          swapped = true
          back.currentTime = 0
          back.play().catch(() => {})
          front.style.transition = `opacity ${CROSSFADE_SECONDS}s linear`
          back.style.transition = `opacity ${CROSSFADE_SECONDS}s linear`
          front.style.opacity = '0'
          back.style.opacity = '1'
          frontIsA.current = !frontIsA.current
          window.setTimeout(() => {
            front.pause()
            armNextSwap(back, front)
          }, CROSSFADE_SECONDS * 1000)
          return
        }
        raf = requestAnimationFrame(watch)
      }
      raf = requestAnimationFrame(watch)
    }

    a.play().catch(() => {})
    armNextSwap(a, b)

    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <>
      <video
        ref={videoARef}
        muted
        playsInline
        preload="auto"
        className={`${className} absolute inset-0`}
        style={{ opacity: 1 }}
        src={src}
      />
      <video
        ref={videoBRef}
        muted
        playsInline
        preload="auto"
        className={`${className} absolute inset-0`}
        style={{ opacity: 0 }}
        src={src}
      />
    </>
  )
}
